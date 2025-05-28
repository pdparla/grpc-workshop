package com.insurance.grpc.quotation.service;

import com.insurance.grpc.common.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PremiumCalculationService {

    public PremiumCalculationResult calculatePremium(
            Customer customer,
            Vehicle vehicle,
            List<Coverage> coverages) {

        // Calculate base premium factors
        double driverFactor = calculateDriverFactor(customer);
        double vehicleFactor = calculateVehicleFactor(vehicle);

        Map<CoverageType, Double> coveragePremiums = new HashMap<>();
        double totalMonthlyPremium = 0.0;

        // Calculate premium for each coverage
        for (Coverage coverage : coverages) {
            double basePremium = getBasePremium(coverage.getType());
            double adjustedPremium = basePremium * driverFactor * vehicleFactor;

            // Apply deductible and limit adjustments
            adjustedPremium = applyDeductibleAdjustment(adjustedPremium, coverage.getDeductible());
            adjustedPremium = applyLimitAdjustment(adjustedPremium, coverage.getLimit(), coverage.getType());

            double monthlyPremium = roundToTwoDecimals(adjustedPremium);
            coveragePremiums.put(coverage.getType(), monthlyPremium);
            totalMonthlyPremium += monthlyPremium;
        }

        double totalAnnualPremium = roundToTwoDecimals(totalMonthlyPremium * 12);
        totalMonthlyPremium = roundToTwoDecimals(totalMonthlyPremium);

        return new PremiumCalculationResult(
                totalMonthlyPremium,
                totalAnnualPremium,
                coveragePremiums
        );
    }

    private double calculateDriverFactor(Customer customer) {
        double ageFactor = 1.0;
        double experienceFactor = 1.0;

        // Age-based risk factor
        if (customer.getAge() < 25) {
            ageFactor = 1.5; // Higher risk for young drivers
        } else if (customer.getAge() < 35) {
            ageFactor = 1.2;
        } else if (customer.getAge() > 65) {
            ageFactor = 1.1; // Slightly higher risk for senior drivers
        }

        // Experience-based factor
        if (customer.getYearsLicensed() < 2) {
            experienceFactor = 1.3; // Higher risk for inexperienced drivers
        } else if (customer.getYearsLicensed() > 10) {
            experienceFactor = 0.9; // Lower risk for experienced drivers
        }

        return ageFactor * experienceFactor;
    }

    private double calculateVehicleFactor(Vehicle vehicle) {
        double valueFactor = 1.0;
        double ageFactor = 1.0;

        // Vehicle value factor
        if (vehicle.getValue() > 50000) {
            valueFactor = 1.3; // Higher premium for expensive cars
        } else if (vehicle.getValue() > 30000) {
            valueFactor = 1.1;
        } else if (vehicle.getValue() < 10000) {
            valueFactor = 0.8; // Lower premium for less valuable cars
        }

        // Vehicle age factor
        int currentYear = java.time.Year.now().getValue();
        int vehicleAge = currentYear - vehicle.getYear();

        if (vehicleAge > 10) {
            ageFactor = 0.9; // Slightly lower premium for older cars
        } else if (vehicleAge < 3) {
            ageFactor = 1.1; // Higher premium for newer cars
        }

        return valueFactor * ageFactor;
    }

    private double getBasePremium(CoverageType coverageType) {
        switch (coverageType) {
            case LIABILITY:
                return 85.0; // Base monthly premium for liability
            case COLLISION:
                return 65.0; // Base monthly premium for collision
            case COMPREHENSIVE:
                return 45.0; // Base monthly premium for comprehensive
            default:
                return 50.0; // Default premium
        }
    }

    private double applyDeductibleAdjustment(double premium, double deductible) {
        // Higher deductible = lower premium
        if (deductible >= 1000) {
            return premium * 0.8; // 20% discount for high deductible
        } else if (deductible >= 500) {
            return premium * 0.9; // 10% discount for medium deductible
        }
        return premium; // No adjustment for low deductible
    }

    private double applyLimitAdjustment(double premium, double limit, CoverageType coverageType) {
        // Higher limits = higher premium
        if (coverageType == CoverageType.LIABILITY) {
            if (limit >= 300000) {
                return premium * 1.2; // 20% increase for high liability limits
            } else if (limit >= 100000) {
                return premium * 1.1; // 10% increase for medium limits
            }
        }
        return premium; // No adjustment for other cases
    }

    private double roundToTwoDecimals(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    // Result class to hold calculation results
    public static class PremiumCalculationResult {
        private final double monthlyPremium;
        private final double annualPremium;
        private final Map<CoverageType, Double> coveragePremiums;

        public PremiumCalculationResult(
                double monthlyPremium,
                double annualPremium,
                Map<CoverageType, Double> coveragePremiums) {
            this.monthlyPremium = monthlyPremium;
            this.annualPremium = annualPremium;
            this.coveragePremiums = coveragePremiums;
        }

        public double getMonthlyPremium() {
            return monthlyPremium;
        }

        public double getAnnualPremium() {
            return annualPremium;
        }

        public double getCoveragePremium(CoverageType coverageType) {
            return coveragePremiums.getOrDefault(coverageType, 0.0);
        }
    }
}