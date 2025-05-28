import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  QuotationGrpcService, 
  QuoteRequest, 
  QuoteResponse, 
  CoverageType,
  Customer,
  Vehicle,
  Coverage 
} from './quotation-grpc.service';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="quote-container">
      <h2>Insurance Quote Request</h2>
      
      <form [formGroup]="quoteForm" (ngSubmit)="onSubmit()" class="quote-form">
        
        <!-- Customer Information -->
        <div class="form-section">
          <h3>Customer Information</h3>
          <div formGroupName="customer" class="form-group">
            <div class="input-row">
              <div class="input-field">
                <label for="customerName">Full Name *</label>
                <input 
                  id="customerName"
                  type="text" 
                  formControlName="name" 
                  placeholder="John Doe"
                  required>
              </div>
              <div class="input-field">
                <label for="customerEmail">Email *</label>
                <input 
                  id="customerEmail"
                  type="email" 
                  formControlName="email" 
                  placeholder="john.doe@email.com"
                  required>
              </div>
            </div>
            <div class="input-row">
              <div class="input-field">
                <label for="customerAge">Age *</label>
                <input 
                  id="customerAge"
                  type="number" 
                  formControlName="age" 
                  min="16" 
                  max="100"
                  required>
              </div>
              <div class="input-field">
                <label for="yearsLicensed">Years Licensed *</label>
                <input 
                  id="yearsLicensed"
                  type="number" 
                  formControlName="yearsLicensed" 
                  min="0" 
                  max="50"
                  required>
              </div>
            </div>
          </div>
        </div>

        <!-- Vehicle Information -->
        <div class="form-section">
          <h3>Vehicle Information</h3>
          <div formGroupName="vehicle" class="form-group">
            <div class="input-row">
              <div class="input-field">
                <label for="vehicleBrand">Brand *</label>
                <input 
                  id="vehicleBrand"
                  type="text" 
                  formControlName="brand" 
                  placeholder="Toyota"
                  required>
              </div>
              <div class="input-field">
                <label for="vehicleModel">Model *</label>
                <input 
                  id="vehicleModel"
                  type="text" 
                  formControlName="model" 
                  placeholder="Camry"
                  required>
              </div>
            </div>
            <div class="input-row">
              <div class="input-field">
                <label for="vehicleYear">Year *</label>
                <input 
                  id="vehicleYear"
                  type="number" 
                  formControlName="year" 
                  min="1990" 
                  max="2024"
                  required>
              </div>
              <div class="input-field">
                <label for="licensePlate">License Plate</label>
                <input 
                  id="licensePlate"
                  type="text" 
                  formControlName="licensePlate" 
                  placeholder="ABC-1234">
              </div>
            </div>
            <div class="input-row">
              <div class="input-field">
                <label for="vehicleValue">Vehicle Value ($) *</label>
                <input 
                  id="vehicleValue"
                  type="number" 
                  formControlName="value" 
                  min="1000" 
                  step="1000"
                  placeholder="25000"
                  required>
              </div>
            </div>
          </div>
        </div>

        <!-- Coverage Selection -->
        <div class="form-section">
          <h3>Coverage Selection</h3>
          <div formArrayName="coverages">
            <div *ngFor="let coverage of coverageControls.controls; let i = index" 
                 [formGroupName]="i" 
                 class="coverage-item">
              <div class="coverage-header">
                <label class="coverage-checkbox">
                  <input type="checkbox" [formControlName]="'selected'">
                  <span>{{ getCoverageTypeName(coverage.get('type')?.value) }}</span>
                </label>
                <button type="button" (click)="removeCoverage(i)" class="remove-btn">Remove</button>
              </div>
              
              <div *ngIf="coverage.get('selected')?.value" class="coverage-details">
                <div class="input-row">
                  <div class="input-field">
                    <label>Coverage Limit ($)</label>
                    <input type="number" formControlName="limit" min="10000" step="10000">
                  </div>
                  <div class="input-field">
                    <label>Deductible ($)</label>
                    <input type="number" formControlName="deductible" min="250" step="250">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button type="button" (click)="addCoverage()" class="add-coverage-btn">
            Add Coverage
          </button>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button 
            type="submit" 
            [disabled]="quoteForm.invalid || isLoading"
            class="submit-btn">
            {{ isLoading ? 'Calculating...' : 'Get Quote' }}
          </button>
        </div>
      </form>

      <!-- Quote Result -->
      <div *ngIf="quoteResponse" class="quote-result">
        <h3>Your Quote</h3>
        <div class="quote-summary">
          <div class="premium-info">
            <div class="premium-item">
              <span class="label">Monthly Premium:</span>
              <span class="amount">\${{ quoteResponse.monthlyPremium.amount | number:'1.2-2' }}</span>
            </div>
            <div class="premium-item">
              <span class="label">Annual Premium:</span>
              <span class="amount">\${{ quoteResponse.annualPremium.amount | number:'1.2-2' }}</span>
            </div>
          </div>
          
          <div class="coverage-breakdown">
            <h4>Coverage Breakdown</h4>
            <div *ngFor="let detail of quoteResponse.coverageDetails" class="coverage-detail">
              <span class="coverage-name">{{ getCoverageTypeName(detail.type) }}</span>
              <span class="coverage-premium">\${{ detail.premium.amount | number:'1.2-2' }}/month</span>
            </div>
          </div>
          
          <div class="quote-info">
            <p><strong>Quote ID:</strong> {{ quoteResponse.quoteId }}</p>
            <p><strong>Valid Until:</strong> {{ formatDate(quoteResponse.validUntil) }}</p>
            <p><strong>Status:</strong> {{ quoteResponse.status }}</p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div *ngIf="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .quote-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .quote-form {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .form-section {
      margin-bottom: 30px;
    }

    .form-section h3 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .input-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .input-field {
      flex: 1;
    }

    .input-field label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    .input-field input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .input-field input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
    }

    .coverage-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 10px;
      border: 1px solid #e1e8ed;
    }

    .coverage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .coverage-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .coverage-details {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e1e8ed;
    }

    .remove-btn {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .remove-btn:hover {
      background: #c0392b;
    }

    .add-coverage-btn {
      background: #27ae60;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .add-coverage-btn:hover {
      background: #229954;
    }

    .submit-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    }

    .submit-btn:hover:not(:disabled) {
      background: #2980b9;
    }

    .submit-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .quote-result {
      background: #e8f5e8;
      padding: 25px;
      border-radius: 8px;
      border: 1px solid #27ae60;
    }

    .quote-result h3 {
      color: #27ae60;
      margin-bottom: 20px;
    }

    .premium-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }

    .premium-item {
      text-align: center;
    }

    .premium-item .label {
      display: block;
      font-weight: 500;
      color: #666;
      margin-bottom: 5px;
    }

    .premium-item .amount {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #27ae60;
    }

    .coverage-breakdown {
      margin-bottom: 20px;
    }

    .coverage-breakdown h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .coverage-detail {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e1e8ed;
    }

    .coverage-detail:last-child {
      border-bottom: none;
    }

    .quote-info {
      background: white;
      padding: 15px;
      border-radius: 6px;
    }

    .quote-info p {
      margin: 5px 0;
    }

    .error-message {
      background: #ffe6e6;
      color: #d32f2f;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #f44336;
    }
  `]
})
export class QuoteFormComponent implements OnInit {
  quoteForm: FormGroup;
  quoteResponse: QuoteResponse | null = null;
  isLoading = false;
  errorMessage = '';

  availableCoverageTypes = [
    { type: CoverageType.LIABILITY, name: 'Liability', defaultLimit: 100000, defaultDeductible: 500 },
    { type: CoverageType.COLLISION, name: 'Collision', defaultLimit: 50000, defaultDeductible: 1000 },
    { type: CoverageType.COMPREHENSIVE, name: 'Comprehensive', defaultLimit: 50000, defaultDeductible: 500 }
  ];

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationGrpcService
  ) {
    this.quoteForm = this.createForm();
  }

  ngOnInit(): void {
    // Add default coverages
    this.addCoverage(CoverageType.LIABILITY);
  }

  get coverageControls(): FormArray {
    return this.quoteForm.get('coverages') as FormArray;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      customer: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        age: ['', [Validators.required, Validators.min(16), Validators.max(100)]],
        yearsLicensed: ['', [Validators.required, Validators.min(0), Validators.max(50)]]
      }),
      vehicle: this.fb.group({
        brand: ['', [Validators.required, Validators.minLength(2)]],
        model: ['', [Validators.required, Validators.minLength(1)]],
        year: ['', [Validators.required, Validators.min(1990), Validators.max(2024)]],
        licensePlate: [''],
        value: ['', [Validators.required, Validators.min(1000)]]
      }),
      coverages: this.fb.array([])
    });
  }

  addCoverage(coverageType?: CoverageType): void {
    const defaultCoverage = this.availableCoverageTypes.find(
      c => coverageType ? c.type === coverageType : true
    ) || this.availableCoverageTypes[0];

    const coverageGroup = this.fb.group({
      type: [coverageType || defaultCoverage.type],
      limit: [defaultCoverage.defaultLimit, [Validators.required, Validators.min(10000)]],
      deductible: [defaultCoverage.defaultDeductible, [Validators.required, Validators.min(250)]],
      selected: [true]
    });

    this.coverageControls.push(coverageGroup);
  }

  removeCoverage(index: number): void {
    this.coverageControls.removeAt(index);
  }

  getCoverageTypeName(type: CoverageType): string {
    return this.quotationService.getCoverageTypeName(type);
  }

  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.quoteResponse = null;

      const formValue = this.quoteForm.value;
      
      // Filter only selected coverages
      const selectedCoverages = formValue.coverages
        .filter((coverage: any) => coverage.selected)
        .map((coverage: any) => ({
          type: coverage.type,
          limit: coverage.limit,
          deductible: coverage.deductible
        }));

      const quoteRequest: QuoteRequest = {
        requestId: this.generateRequestId(),
        customer: {
          customerId: this.generateCustomerId(),
          name: formValue.customer.name,
          email: formValue.customer.email,
          age: formValue.customer.age,
          yearsLicensed: formValue.customer.yearsLicensed
        },
        vehicle: {
          brand: formValue.vehicle.brand,
          model: formValue.vehicle.model,
          year: formValue.vehicle.year,
          licensePlate: formValue.vehicle.licensePlate || '',
          value: formValue.vehicle.value
        },
        coverages: selectedCoverages
      };

      console.log('Sending gRPC Quote Request:', quoteRequest);

      this.quotationService.createQuote(quoteRequest).subscribe({
        next: (response: QuoteResponse) => {
          console.log('Received gRPC Quote Response:', response);
          this.quoteResponse = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('gRPC Quote Error:', error);
          this.errorMessage = 'Failed to get quote. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.quoteForm);
    }
  }

  private generateRequestId(): string {
    return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private generateCustomerId(): string {
    return 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched({ onlySelf: true });
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }
}