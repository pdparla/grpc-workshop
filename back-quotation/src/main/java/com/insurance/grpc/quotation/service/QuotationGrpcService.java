package com.insurance.grpc.quotation.service;

import com.insurance.grpc.quotation.*;
import com.insurance.grpc.common.*;
import com.google.protobuf.Timestamp;
import io.grpc.stub.StreamObserver;
import org.springframework.grpc.server.service.GrpcService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@GrpcService
@Service
public class QuotationGrpcService extends QuotationServiceGrpc.QuotationServiceImplBase {

    private final PremiumCalculationService premiumCalculationService;

    public QuotationGrpcService(PremiumCalculationService premiumCalculationService) {
        this.premiumCalculationService = premiumCalculationService;
    }

    @Override
    public void createQuote(QuoteRequest request, StreamObserver<QuoteResponse> responseObserver) {
        try {
            // Generate unique quote ID
            String quoteId = UUID.randomUUID().toString();
            
            // Calculate premiums based on customer, vehicle, and coverages
            PremiumCalculationService.PremiumCalculationResult calculationResult = premiumCalculationService.calculatePremium(
                request.getCustomer(),
                request.getVehicle(),
                request.getCoveragesList()
            );

            // Build coverage details
            List<CoverageDetail> coverageDetails = buildCoverageDetails(
                request.getCoveragesList(), 
                calculationResult
            );

            // Set quote expiration (30 days from now)
            Instant validUntil = Instant.now().plus(30, ChronoUnit.DAYS);
            Timestamp validUntilTimestamp = Timestamp.newBuilder()
                .setSeconds(validUntil.getEpochSecond())
                .setNanos(validUntil.getNano())
                .build();

            // Build response
            QuoteResponse response = QuoteResponse.newBuilder()
                .setQuoteId(quoteId)
                .setMonthlyPremium(Money.newBuilder()
                    .setAmount(calculationResult.getMonthlyPremium())
                    .setCurrency("USD")
                    .build())
                .setAnnualPremium(Money.newBuilder()
                    .setAmount(calculationResult.getAnnualPremium())
                    .setCurrency("USD")
                    .build())
                .addAllCoverageDetails(coverageDetails)
                .setValidUntil(validUntilTimestamp)
                .setStatus("ACTIVE")
                .build();

            // Send response
            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    private List<CoverageDetail> buildCoverageDetails(
            List<Coverage> requestedCoverages, 
            PremiumCalculationService.PremiumCalculationResult calculationResult) {
        
        List<CoverageDetail> details = new ArrayList<>();
        
        for (Coverage coverage : requestedCoverages) {
            double premium = calculationResult.getCoveragePremium(coverage.getType());
            
            CoverageDetail detail = CoverageDetail.newBuilder()
                .setType(coverage.getType())
                .setPremium(Money.newBuilder()
                    .setAmount(premium)
                    .setCurrency("USD")
                    .build())
                .setDeductible(coverage.getDeductible())
                .setLimit(coverage.getLimit())
                .build();
                
            details.add(detail);
        }
        
        return details;
    }
}