import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SayHiGrpcService } from './sayhi-grpc.service';
import { HiResponse, HiCountResponse } from '../../proto-gen/sayhi/sayhi_pb';

@Component({
  selector: 'app-say-hi',
  imports: [CommonModule, FormsModule],
  templateUrl: './say-hi.component.html',
  styleUrl: './say-hi.component.scss',
  standalone: true
})
export class SayHiComponent {
  senderName = 'Angular Client';
  clientStreamCount = 3;
  serverStreamCount = 3;
  
  bidirectionalActive = false;
  bidirectionalTimeLeft = 2;
  private bidirectionalTimer: any;
  private bidirectionalConnection: any;

  loading = {
    unary: false,
    clientStream: false,
    serverStream: false
  };

  results = {
    unary: null as HiResponse | null,
    clientStream: null as HiCountResponse | null,
    serverStream: [] as HiResponse[],
    bidirectional: [] as { type: 'sent' | 'received', sender: string, message: string }[]
  };

  constructor(private sayHiService: SayHiGrpcService) {}

  testUnary(): void {
    this.loading.unary = true;
    this.results.unary = null;

    this.sayHiService.sayHi(this.senderName).subscribe({
      next: (response) => {
        this.results.unary = response;
        this.loading.unary = false;
      },
      error: (error) => {
        console.error('Unary error:', error);
        this.loading.unary = false;
      }
    });
  }

  testClientStreaming(): void {
    this.loading.clientStream = true;
    this.results.clientStream = null;

    this.sayHiService.clientStreamHi(this.senderName, this.clientStreamCount).subscribe({
      next: (response) => {
        this.results.clientStream = response;
        this.loading.clientStream = false;
      },
      error: (error) => {
        console.error('Client streaming error:', error);
        this.loading.clientStream = false;
      }
    });
  }

  testServerStreaming(): void {
    this.loading.serverStream = true;
    this.results.serverStream = [];

    this.sayHiService.serverStreamHi(this.senderName, this.serverStreamCount).subscribe({
      next: (response) => {
        this.results.serverStream.push(response);
      },
      complete: () => {
        this.loading.serverStream = false;
      },
      error: (error) => {
        console.error('Server streaming error:', error);
        this.loading.serverStream = false;
      }
    });
  }

  startBidirectional(): void {
    this.bidirectionalActive = true;
    this.bidirectionalTimeLeft = 2;
    this.results.bidirectional = [];

    this.bidirectionalConnection = this.sayHiService.bidirectionalHi(this.senderName);
    
    this.bidirectionalConnection.responses.subscribe({
      next: (response: HiResponse) => {
        this.results.bidirectional.push({ 
          type: 'received', 
          sender: response.getSender(), 
          message: response.getMessage() 
        });
      },
      complete: () => {
        this.bidirectionalActive = false;
        if (this.bidirectionalTimer) {
          clearInterval(this.bidirectionalTimer);
        }
      }
    });

    this.bidirectionalTimer = setInterval(() => {
      this.bidirectionalTimeLeft--;
      if (this.bidirectionalTimeLeft <= 0) {
        this.stopBidirectional();
      }
    }, 1000);
  }

  sendBidirectionalHi(): void {
    if (this.bidirectionalConnection && this.bidirectionalActive) {
      const message = 'hi';
      this.results.bidirectional.push({ 
        type: 'sent', 
        sender: this.senderName, 
        message: message 
      });
      this.bidirectionalConnection.sendHi(message);
    }
  }

  stopBidirectional(): void {
    this.bidirectionalActive = false;
    if (this.bidirectionalTimer) {
      clearInterval(this.bidirectionalTimer);
    }
    if (this.bidirectionalConnection) {
      this.bidirectionalConnection.close();
    }
  }
}