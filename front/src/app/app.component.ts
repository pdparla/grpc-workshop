import { Component } from '@angular/core';
import { SayHiComponent } from './components/say-hi/say-hi.component';

@Component({
  selector: 'app-root',
  imports: [SayHiComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>🛡️ Insurance Portal</h1>
        <p>gRPC Workshop - RPC Pattern Demo</p>
      </header>
      
      <main class="app-main">
        <app-say-hi></app-say-hi>
      </main>
      
      <footer class="app-footer">
        <p>Powered by Angular + Spring Boot + gRPC</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
    }

    .app-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .app-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2.5rem;
      font-weight: 300;
    }

    .app-header p {
      margin: 5px 0 0 0;
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .app-main {
      flex: 1;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .app-footer {
      background: rgba(0, 0, 0, 0.1);
      color: white;
      text-align: center;
      padding: 15px;
      margin-top: auto;
    }

    .app-footer p {
      margin: 0;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent {
  title = 'Insurance Portal - gRPC Demo';
}