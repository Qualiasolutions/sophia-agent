/**
 * Calculator Service Tests
 * Epic 3: Real Estate Calculators
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTransferFees,
  calculateCapitalGainsTax,
  calculateVAT,
  executeCalculator,
} from '../calculator.service';

describe('CalculatorService', () => {
  describe('calculateTransferFees', () => {
    it('should calculate transfer fees for property under €85,000', () => {
      const result = calculateTransferFees({
        property_value: 80000,
        joint_names: false,
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.base_fees).toBe(2400); // 80000 * 0.03
      expect(result.result?.details?.exemption).toBe(1200); // 50% exemption
      expect(result.result?.details?.total_fees).toBe(1200);
    });

    it('should calculate transfer fees for property between €85,000-€170,000', () => {
      const result = calculateTransferFees({
        property_value: 150000,
        joint_names: false,
      });

      expect(result.success).toBe(true);
      // Base: (85000 * 0.03) + (65000 * 0.05) = 2550 + 3250 = 5800
      expect(result.result?.details?.base_fees).toBe(5800);
      expect(result.result?.details?.total_fees).toBe(2900); // After 50% exemption
    });

    it('should calculate transfer fees for property over €170,000', () => {
      const result = calculateTransferFees({
        property_value: 300000,
        joint_names: false,
      });

      expect(result.success).toBe(true);
      // Base: (85000*0.03) + (85000*0.05) + (130000*0.08) = 2550 + 4250 + 10400 = 17200
      expect(result.result?.details?.base_fees).toBe(17200);
      expect(result.result?.details?.total_fees).toBe(8600); // After 50% exemption
    });

    it('should handle joint names correctly', () => {
      const result = calculateTransferFees({
        property_value: 200000,
        joint_names: true,
      });

      expect(result.success).toBe(true);
      // Each person: 100000
      // Per person: (85000*0.03) + (15000*0.05) = 2550 + 750 = 3300
      // Total: 3300 * 2 = 6600
      // After exemption: 3300
      expect(result.result?.details?.value_per_person).toBe(100000);
      expect(result.result?.details?.total_fees).toBe(3300);
    });

    it('should return error for invalid property value', () => {
      const result = calculateTransferFees({
        property_value: -1000,
        joint_names: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('calculateCapitalGainsTax', () => {
    it('should calculate capital gains tax with profit', () => {
      const result = calculateCapitalGainsTax({
        sale_price: 300000,
        purchase_price: 200000,
        purchase_year: 2020,
        sale_year: 2025,
        allowance_type: 'any_other_sale',
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.capital_gain).toBeGreaterThan(0);
      expect(result.result?.details?.tax).toBeGreaterThan(0);
    });

    it('should apply main residence allowance', () => {
      const result = calculateCapitalGainsTax({
        sale_price: 300000,
        purchase_price: 200000,
        purchase_year: 2020,
        sale_year: 2025,
        allowance_type: 'main_residence',
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.allowance).toBe(85430);
    });

    it('should include improvement costs in cost basis', () => {
      const result = calculateCapitalGainsTax({
        sale_price: 300000,
        purchase_price: 200000,
        purchase_year: 2020,
        sale_year: 2025,
        cost_of_improvements: 20000,
        improvements_year: 2023,
        allowance_type: 'none',
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.total_cost_basis).toBeGreaterThan(220000);
    });

    it('should return zero tax when no gain', () => {
      const result = calculateCapitalGainsTax({
        sale_price: 200000,
        purchase_price: 200000,
        purchase_year: 2024,
        sale_year: 2025,
        allowance_type: 'any_other_sale',
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.tax).toBe(0);
    });

    it('should return error for invalid inputs', () => {
      const result = calculateCapitalGainsTax({
        sale_price: 'invalid',
        purchase_price: 200000,
        purchase_year: 2020,
        sale_year: 2025,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('calculateVAT', () => {
    it('should calculate VAT at standard rate (19%)', () => {
      const result = calculateVAT({
        property_value: 200000,
        property_type: 'apartment',
        is_first_home: false,
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.total_vat).toBe(38000); // 200000 * 0.19
    });

    it('should apply reduced rate for first home (first 200m²)', () => {
      const result = calculateVAT({
        property_value: 200000,
        property_type: 'house',
        buildable_area: 150,
        is_first_home: true,
      });

      expect(result.success).toBe(true);
      // Entire area at 5%: 200000 * 0.05 = 10000
      expect(result.result?.details?.total_vat).toBe(10000);
      expect(result.result?.details?.reduced_rate_area).toBe(150);
    });

    it('should split VAT rates for area over 200m²', () => {
      const result = calculateVAT({
        property_value: 300000,
        property_type: 'house',
        buildable_area: 250,
        is_first_home: true,
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.reduced_rate_area).toBe(200);
      expect(result.result?.details?.standard_rate_area).toBe(50);
      // (200 * 1200 * 0.05) + (50 * 1200 * 0.19) = 12000 + 11400 = 23400
      expect(result.result?.details?.total_vat).toBeGreaterThan(0);
    });

    it('should apply full reduced rate for person with disability', () => {
      const result = calculateVAT({
        property_value: 200000,
        property_type: 'apartment',
        buildable_area: 150,
        is_first_home: true,
        has_disability: true,
      });

      expect(result.success).toBe(true);
      expect(result.result?.details?.total_vat).toBe(10000); // Full property at 5%
      expect(result.result?.details?.reduced_rate_area).toBe(150);
      expect(result.result?.details?.standard_rate_area).toBe(0);
    });

    it('should return error for invalid property type', () => {
      const result = calculateVAT({
        property_value: 200000,
        property_type: 'land', // Invalid - only house/apartment allowed
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('executeCalculator', () => {
    it('should route to correct calculator by name', () => {
      const result = executeCalculator({
        calculator_name: 'transfer_fees',
        inputs: {
          property_value: 100000,
          joint_names: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.calculator_name).toBe('transfer_fees');
    });

    it('should return error for unknown calculator', () => {
      const result = executeCalculator({
        calculator_name: 'unknown_calculator',
        inputs: {},
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_CALCULATOR');
    });

    it('should include execution time in result', () => {
      const result = executeCalculator({
        calculator_name: 'transfer_fees',
        inputs: {
          property_value: 100000,
          joint_names: false,
        },
      });

      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.execution_time_ms).toBeLessThan(100); // Should be very fast
    });

    it('should include fallback URL in error responses', () => {
      const result = executeCalculator({
        calculator_name: 'transfer_fees',
        inputs: {
          property_value: 'invalid',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.fallback_url).toBeDefined();
      if (result.error!.fallback_url) {
        expect(result.error!.fallback_url).toContain('zyprus.com');
      }
    });
  });
});
