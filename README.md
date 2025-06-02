# gRPC Workshop 

## Workshop Overview
**Objective**: Understand gRPC fundamentals

**Architecture**: 
- **Hi Microservice** (Spring Boot + gRPC Server + gRPC Client)  
- **Insurance Portal** (Angular + gRPC-Web)

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
### 1. **Unary RPC** - Simple His


### 2. **Server Streaming RPC** - Multiple His from server

### 3. **Client Streaming RPC** - Multiple His from client

### 4. **Bidirectional Streaming RPC** - Chatting his
