package com.insurance.grpc.quotation.controller;

import com.insurance.grpc.quotation.*;
import com.insurance.grpc.quotation.service.QuotationGrpcService;
import com.insurance.grpc.common.*;
import com.google.protobuf.Timestamp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.grpc.stub.StreamObserver;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200") // Allow Angular app
public class QuotationController {

    @Autowired
    private QuotationGrpcService quotationGrpcService;

    /**
     * HTTP endpoint that bridges to gRPC Unary RPC call
     * This demonstrates how to integrate gRPC with traditional REST APIs
     */
    @PostMapping("/quotes")
    public ResponseEntity<?> createQuote(@RequestBody Map<String, Object> request) {
        try {
            // Convert HTTP request to gRPC request
            QuoteRequest grpcRequest = convertToGrpcRequest(request);

            // Create a CompletableFuture to handle the async gRPC call
            CompletableFuture<QuoteResponse> future = new CompletableFuture<>();

            // Call gRPC service with custom StreamObserver
            quotationGrpcService.createQuote(grpcRequest, new StreamObserver<QuoteResponse>() {
                @Override
                public void onNext(QuoteResponse response) {
                    future.complete(response);
                }

                @Override
                public void onError(Throwable throwable) {
                    future.completeExceptionally(throwable);
                }

                @Override
                public void onCompleted() {
                    // Response already completed in onNext
                }
            });

            // Wait for the gRPC response (with timeout)
            QuoteResponse grpcResponse = future.get(10, TimeUnit.SECONDS);

            // Convert gRPC response to HTTP response
            Map<String, Object> httpResponse = convertToHttpResponse(grpcResponse);

            return ResponseEntity.ok(httpResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Failed to create quote",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "quotation-service",
                "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Convert HTTP request JSON to gRPC QuoteRequest
     */
    private QuoteRequest convertToGrpcRequest(Map<String, Object> request) {
        // Extract customer data
        @SuppressWarnings("unchecked")
        Map<String, Object> customerData = (Map<String, Object>) request.get("customer");
        Customer customer = Customer.newBuilder()
                .setCustomerId((String) customerData.get("customer_id"))
                .setName((String) customerData.get("name"))
                .setEmail((String) customerData.get("email"))
                .setAge((Integer) customerData.get("age"))
                .setYearsLicensed((Integer) customerData.get("years_licensed"))
                .build();

        // Extract vehicle data
        @SuppressWarnings("unchecked")
        Map<String, Object> vehicleData = (Map<String, Object>) request.get("vehicle");
        Vehicle vehicle = Vehicle.newBuilder()
                .setBrand((String) vehicleData.get("brand"))
                .setModel((String) vehicleData.get("model"))
                .setYear((Integer) vehicleData.get("year"))
                .setLicensePlate((String) vehicleData.getOrDefault("license_plate", ""))
                .setValue(((Number) vehicleData.get("value")).doubleValue())
                .build();

        // Extract coverages data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> coveragesData = (List<Map<String, Object>>) request.get("coverages");
        List<Coverage> coverages = coveragesData.stream()
                .map(coverageData -> Coverage.newBuilder()
                        .setType(CoverageType.forNumber((Integer) coverageData.get("type")))
                        .setLimit(((Number) coverageData.get("limit")).doubleValue())
                        .setDeductible(((Number) coverageData.get("deductible")).doubleValue())
                        .build())
                .collect(Collectors.toList());

        return QuoteRequest.newBuilder()
                .setRequestId((String) request.get("request_id"))
                .setCustomer(customer)
                .setVehicle(vehicle)
                .addAllCoverages(coverages)
                .build();
    }

    /**
     * Convert gRPC QuoteResponse to HTTP response JSON
     */
    private Map<String, Object> convertToHttpResponse(QuoteResponse grpcResponse) {
        return Map.of(
                "quote_id", grpcResponse.getQuoteId(),
                "monthly_premium", Map.of(
                        "amount", grpcResponse.getMonthlyPremium().getAmount(),
                        "currency", grpcResponse.getMonthlyPremium().getCurrency()
                ),
                "annual_premium", Map.of(
                        "amount", grpcResponse.getAnnualPremium().getAmount(),
                        "currency", grpcResponse.getAnnualPremium().getCurrency()
                ),
                "coverage_details", grpcResponse.getCoverageDetailsList().stream()
                        .map(detail -> Map.of(
                                "type", detail.getType().getNumber(),
                                "premium", Map.of(
                                        "amount", detail.getPremium().getAmount(),
                                        "currency", detail.getPremium().getCurrency()
                                ),
                                "deductible", detail.getDeductible(),
                                "limit", detail.getLimit()
                        ))
                        .collect(Collectors.toList()),
                "valid_until", convertTimestampToISO(grpcResponse.getValidUntil()),
                "status", grpcResponse.getStatus()
        );
    }

    /**
     * Convert Protobuf Timestamp to ISO string
     */
    private String convertTimestampToISO(Timestamp timestamp) {
        Instant instant = Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos());
        return instant.toString();
    }
}
