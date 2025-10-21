/**
 * Test VAT Calculation Functionality
 * Tests the new VAT policy implementation
 */

import { executeCalculator } from '../calculator.service';

describe('VAT Calculator Tests', () => {
  describe('New Policy (from Nov 1, 2023)', () => {
    test('Property under €350,000 should get 5% VAT rate', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 150,
          price: 300000,
          planning_application_date: '15/01/2024', // After Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.total_vat).toBe(15000); // 300,000 * 5%
      expect(result.result?.details.is_new_policy).toBe(true);
      expect(result.result?.summary).toBe('€15,000');
    });

    test('Property over €350,000 should get 19% VAT rate', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 200,
          price: 500000,
          planning_application_date: '01/12/2023', // After Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.total_vat).toBe(95000); // 500,000 * 19%
      expect(result.result?.details.is_new_policy).toBe(true);
      expect(result.result?.summary).toBe('€95,000');
    });

    test('Property exactly €350,000 should get 5% VAT rate', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 180,
          price: 350000,
          planning_application_date: '01/11/2023', // On Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.total_vat).toBe(17500); // 350,000 * 5%
      expect(result.result?.details.is_new_policy).toBe(true);
      expect(result.result?.summary).toBe('€17,500');
    });
  });

  describe('Old Policy (before Nov 1, 2023)', () => {
    test('Property under 200m² should get 5% VAT rate', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 150,
          price: 400000,
          planning_application_date: '15/10/2023', // Before Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.total_vat).toBe(20000); // 400,000 * 5%
      expect(result.result?.details.is_new_policy).toBe(false);
      expect(result.result?.summary).toBe('€20,000');
    });

    test('Property over 200m² should get mixed rate calculation', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 300,
          price: 600000,
          planning_application_date: '01/06/2023', // Before Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.is_new_policy).toBe(false);

      // Calculate expected result:
      // Price per m²: 600,000 / 300 = 2,000
      // First 200m² at 5%: 200 * 2,000 * 0.05 = 20,000
      // Remaining 100m² at 19%: 100 * 2,000 * 0.19 = 38,000
      // Total VAT: 20,000 + 38,000 = 58,000
      expect(result.result?.details.total_vat).toBe(58000);
      expect(result.result?.summary).toBe('€58,000');
    });

    test('Property exactly 200m² should get 5% VAT rate', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 200,
          price: 500000,
          planning_application_date: '31/10/2023', // Before Nov 1, 2023
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.details.total_vat).toBe(25000); // 500,000 * 5%
      expect(result.result?.details.is_new_policy).toBe(false);
      expect(result.result?.summary).toBe('€25,000');
    });
  });

  describe('Error Handling', () => {
    test('Invalid date format should return error', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 150,
          price: 300000,
          planning_application_date: '2024-01-15', // Wrong format
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('DD/MM/YYYY format');
    });

    test('Missing date should return error', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 150,
          price: 300000,
          planning_application_date: '',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('Planning application date is required');
    });

    test('Negative values should return error', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: -100,
          price: 300000,
          planning_application_date: '15/01/2024',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('positive numbers');
    });

    test('Zero values should return error', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 0,
          price: 300000,
          planning_application_date: '15/01/2024',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('positive numbers');
    });
  });

  describe('Formatted Output', () => {
    test('New policy result should include policy information', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 150,
          price: 300000,
          planning_application_date: '15/01/2024',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.formatted_output).toContain('New Policy (from Nov 1, 2023)');
      expect(result.result?.formatted_output).toContain('under €350,000 limit');
      expect(result.result?.formatted_output).toContain('5% (reduced rate under new policy)');
    });

    test('Old policy result should include area breakdown', () => {
      const result = executeCalculator({
        calculator_name: 'vat_calculator',
        inputs: {
          buildable_area: 300,
          price: 600000,
          planning_application_date: '15/06/2023',
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.formatted_output).toContain('Old Policy (before Nov 1, 2023)');
      expect(result.result?.formatted_output).toContain('First 200m² at 5%');
      expect(result.result?.formatted_output).toContain('Remaining area at 19%');
    });
  });
});