import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { grpc } from '@improbable-eng/grpc-web';

// Import generated proto files (these will be created after running protoc)
import { SayHiService } from '../../proto-gen/sayhi/sayhi_pb_service';
import { HiRequest, HiResponse, HiCountRequest, HiCountResponse } from '../../proto-gen/sayhi/sayhi_pb';

@Injectable({
  providedIn: 'root'
})
export class SayHiGrpcService {
  // grpcwebproxy will run on port 8080
  private readonly grpcWebEndpoint = 'http://localhost:8080';

  constructor() {}

  /**
   * 1. UNARY RPC: Send one "hi" → Receive one "hi"
   */
  sayHi(sender: string): Observable<HiResponse> {
    return new Observable<HiResponse>(observer => {
      console.log('🔄 UNARY: Sending hi from', sender);

      const request = new HiRequest();
      request.setMessage('hi');
      request.setSender(sender);

      grpc.unary(SayHiService.SayHi, {
        request: request,
        host: this.grpcWebEndpoint,
        onEnd: (result) => {
          const { status, statusMessage, message } = result;
          
          if (status === grpc.Code.OK && message) {
            console.log('🔄 UNARY: Received response from server');
            observer.next(message as HiResponse);
            observer.complete();
          } else {
            const error = new Error(`gRPC Unary failed: ${statusMessage}`);
            console.error('❌ UNARY: Error:', error);
            observer.error(error);
          }
        }
      });
    });
  }

  /**
   * 2. CLIENT STREAMING RPC: Send multiple "hi" messages → Receive count
   */
  clientStreamHi(sender: string, count: number): Observable<HiCountResponse> {
    return new Observable<HiCountResponse>(observer => {
      console.log('📥 CLIENT STREAMING: Starting to send', count, 'hi messages');

      const stream = grpc.client(SayHiService.ClientStreamHi, {
        host: this.grpcWebEndpoint
      });

      stream.onEnd((status, statusMessage, trailers) => {
        if (status === grpc.Code.OK) {
          console.log('📥 CLIENT STREAMING: Stream completed successfully');
        } else {
          const error = new Error(`Client streaming failed: ${statusMessage}`);
          console.error('❌ CLIENT STREAMING: Error:', error);
          observer.error(error);
        }
      });

      stream.onMessage((message: any) => {
        const response = message as HiCountResponse;
        console.log('📥 CLIENT STREAMING: Received final response:', response.toObject());
        observer.next(response);
        observer.complete();
      });

      // Send multiple messages
      for (let i = 1; i <= count; i++) {
        const request = new HiRequest();
        request.setMessage(`hi #${i}`);
        request.setSender(sender);
        
        console.log(`📥 CLIENT STREAMING: Sending message #${i}`);
        stream.send(request);
        
        // Small delay between messages
        setTimeout(() => {
          if (i === count) {
            stream.close();
          }
        }, i * 300);
      }
    });
  }

  /**
   * 3. SERVER STREAMING RPC: Send one request → Receive multiple "hi" messages
   */
  serverStreamHi(sender: string, count: number): Observable<HiResponse> {
    return new Observable<HiResponse>(observer => {
      console.log('📤 SERVER STREAMING: Requesting', count, 'hi messages');

      const request = new HiCountRequest();
      request.setCount(count);
      request.setSender(sender);

      const stream = grpc.invoke(SayHiService.ServerStreamHi, {
        request: request,
        host: this.grpcWebEndpoint,
        onMessage: (message: any) => {
          const response = message as HiResponse;
          console.log('📤 SERVER STREAMING: Received:', response.toObject());
          observer.next(response);
        },
        onEnd: (status, statusMessage, trailers) => {
          if (status === grpc.Code.OK) {
            console.log('📤 SERVER STREAMING: Stream completed');
            observer.complete();
          } else {
            const error = new Error(`Server streaming failed: ${statusMessage}`);
            console.error('❌ SERVER STREAMING: Error:', error);
            observer.error(error);
          }
        }
      });
    });
  }

  /**
   * 4. BIDIRECTIONAL STREAMING RPC: Exchange "hi" messages for 2 seconds
   */
  bidirectionalHi(sender: string): { 
    responses: Observable<HiResponse>, 
    sendHi: (message: string) => void,
    close: () => void 
  } {
    const responseSubject = new Subject<HiResponse>();
    
    console.log('🔄 BIDIRECTIONAL: Starting 2-second hi exchange');

    const stream = grpc.client(SayHiService.BidirectionalHi, {
      host: this.grpcWebEndpoint
    });

    stream.onMessage((message: any) => {
      const response = message as HiResponse;
      console.log('🔄 BIDIRECTIONAL: Received:', response.toObject());
      responseSubject.next(response);
    });

    stream.onEnd((status, statusMessage, trailers) => {
      console.log('🔄 BIDIRECTIONAL: Stream ended');
      responseSubject.complete();
    });

    // Auto-close after 2 seconds
    setTimeout(() => {
      console.log('🔄 BIDIRECTIONAL: 2 seconds elapsed, closing');
      stream.close();
      responseSubject.complete();
    }, 2000);

    return {
      responses: responseSubject.asObservable(),
      sendHi: (message: string) => {
        const request = new HiRequest();
        request.setMessage(message);
        request.setSender(sender);
        
        console.log('🔄 BIDIRECTIONAL: Sending:', message);
        stream.send(request);
      },
      close: () => {
        stream.close();
        responseSubject.complete();
      }
    };
  }
}