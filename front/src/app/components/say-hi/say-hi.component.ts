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
}