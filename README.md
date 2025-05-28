# gRPC Workshop Roadmap: Insurance Quotation System (1 Hour)

## Workshop Overview
**Objective**: Understand gRPC fundamentals and build a working insurance quotation system with microservices communication.

**Architecture**: 
- **Calculator Microservice** (Spring Boot + gRPC Server)
- **Quotation Microservice** (Spring Boot + gRPC Server + gRPC Client)  
- **Insurance Portal** (Angular + gRPC-Web)

**Business Domain**: Insurance quotation system for premium calculations and quote management.

**Duration**: 60 minutes

---

## Phase 1: What is gRPC? (20 minutes)

### 1.1 gRPC Fundamentals (8 minutes)
- **What is gRPC?**
  - High-performance, language-agnostic RPC framework
  - Built on HTTP/2 for efficiency and speed
  - Protocol Buffers as interface definition language
  - Comparison with REST APIs and traditional RPC

- **Key Benefits**
  - Type safety with schema-first approach
  - Bi-directional streaming capabilities
  - Built-in code generation
  - Superior performance for service-to-service communication

### 1.2 gRPC Communication Patterns (12 minutes)
- **Unary RPC** (Request-Response)
  - Single request → Single response
  - Example: Calculate insurance premium for specific policy
  - Best for: CRUD operations, simple calculations

- **Server Streaming RPC**
  - Single request → Multiple responses (stream)
  - Example: Real-time risk factor updates during quote calculation
  - Best for: Data feeds, progress updates, notifications

- **Client Streaming RPC**
  - Multiple requests (stream) → Single response
  - Example: Upload multiple customer documents for risk assessment
  - Best for: File uploads, batch data processing

- **Bidirectional Streaming RPC**
  - Multiple requests (stream) ↔ Multiple responses (stream)
  - Example: Interactive quote negotiation with real-time premium adjustments
  - Best for: Chat systems, collaborative editing, real-time dashboards

---

## Phase 2: Grpc Patterns:
### 1. **Unary RPC** - Simple Request/Response
**Service:** `QuotationService.CreateQuote()`
**Flow:** User submits quote request → Quotation Service → Calculator Service → Return premium

```
QuoteRequest → QuoteResponse
```

### 2. **Server Streaming RPC** - Real-time Updates  
**Service:** `CalculatorService.StreamRiskAssessment()`
**Flow:** Calculator Service streams risk assessment updates in real-time

```
RiskRequest → stream RiskUpdate
```

### 3. **Client Streaming RPC** - Multiple Uploads
**Service:** `QuotationService.UploadDocuments()`
**Flow:** Angular Portal streams multiple customer documents to Quotation Service

```
stream DocumentUpload → DocumentUploadResponse
```

### 4. **Bidirectional Streaming RPC** - Interactive Chat
**Service:** `QuotationService.NegotiateQuote()`
**Flow:** Real-time negotiation between customer and agent with live premium updates

```
stream NegotiationMessage ↔ stream NegotiationResponse
```

## Workshop Flow

### Phase 1: Unary RPC
- User fills out quote form (customer, vehicle, coverage info)
- Single request to create quote with premium calculation
- Simple request/response pattern

### Phase 2: Server Streaming RPC  
- During quote creation, call calculator service
- Calculator streams real-time updates: "Analyzing driver age...", "Checking vehicle value...", etc.
- Frontend shows progress bar with live updates

### Phase 3: Client Streaming RPC
- After quote creation, user uploads required documents
- Stream multiple files (license, registration, insurance card) to quotation service
- Show upload progress for each file

### Phase 4: Bidirectional Streaming RPC
- Agent and customer negotiate quote in real-time
- Send messages, coverage changes, premium counters
- Live updates to quote and premium as negotiation progresses


