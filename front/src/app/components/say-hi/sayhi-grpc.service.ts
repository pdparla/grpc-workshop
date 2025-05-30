import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { grpc } from '@improbable-eng/grpc-web';

// Import generated proto files (these will be created after running protoc)
import { SayHiService } from '../../proto-gen/sayhi/sayhi_pb_service';
import { HiRequest, HiResponse, HiCountRequest} from '../../proto-gen/sayhi/sayhi_pb';

@Injectable({
  providedIn: 'root'
})
export class SayHiGrpcService {
  // grpcwebproxy will run on port 8081
  private readonly grpcWebEndpoint = 'http://localhost:8081';

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

  
}