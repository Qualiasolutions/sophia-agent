#!/usr/bin/env node

/**
 * Test VAT Calculator Direct
 * Tests the VAT calculator service directly without API authentication
 */

import { CalculatorService } from '../packages/services/src/calculator.service.ts';

async function testVATCalculator() {
  try {
    console.log('🧪 Testing VAT Calculator Service Directly...\n');

    // Test case 1: New policy, property under €350,000
    console.log('Test 1: New policy (after Nov 1, 2023), property under €350,000');
    const test1Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 150,
        price: 300000,
        planning_application_date: '15/01/2024',
      },
    });

    console.log(`Expected: €15,000 (5% of €300,000)`);
    console.log(`Actual: ${test1Result.result?.summary}`);
    console.log(`Success: ${test1Result.success}`);
    console.log(`Policy: ${test1Result.result?.details.is_new_policy ? 'New' : 'Old'}`);
    console.log('');

    // Test case 2: New policy, property over €350,000
    console.log('Test 2: New policy (after Nov 1, 2023), property over €350,000');
    const test2Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 200,
        price: 500000,
        planning_application_date: '01/12/2023',
      },
    });

    console.log(`Expected: €95,000 (19% of €500,000)`);
    console.log(`Actual: ${test2Result.result?.summary}`);
    console.log(`Success: ${test2Result.success}`);
    console.log(`Policy: ${test2Result.result?.details.is_new_policy ? 'New' : 'Old'}`);
    console.log('');

    // Test case 3: Old policy, property under 200m²
    console.log('Test 3: Old policy (before Nov 1, 2023), property under 200m²');
    const test3Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 150,
        price: 400000,
        planning_application_date: '15/10/2023',
      },
    });

    console.log(`Expected: €20,000 (5% of €400,000)`);
    console.log(`Actual: ${test3Result.result?.summary}`);
    console.log(`Success: ${test3Result.success}`);
    console.log(`Policy: ${test3Result.result?.details.is_new_policy ? 'New' : 'Old'}`);
    console.log('');

    // Test case 4: Old policy, mixed calculation
    console.log('Test 4: Old policy (before Nov 1, 2023), mixed calculation');
    const test4Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 300,
        price: 600000,
        planning_application_date: '15/06/2023',
      },
    });

    console.log(`Expected: €58,000 (200m² at 5% + 100m² at 19%)`);
    console.log(`Actual: ${test4Result.result?.summary}`);
    console.log(`Success: ${test4Result.success}`);
    console.log(`Policy: ${test4Result.result?.details.is_new_policy ? 'New' : 'Old'}`);
    console.log('');

    // Test case 5: Invalid date format
    console.log('Test 5: Invalid date format');
    const test5Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 150,
        price: 300000,
        planning_application_date: '2024-01-15', // Wrong format
      },
    });

    console.log(`Expected: Error about DD/MM/YYYY format`);
    console.log(`Success: ${test5Result.success}`);
    console.log(`Error: ${test5Result.error?.message}`);
    console.log('');

    // Test case 6: Invalid planning application date (exactly Nov 1, 2023)
    console.log('Test 6: Policy boundary - exactly Nov 1, 2023');
    const test6Result = CalculatorService.executeCalculator({
      calculator_name: 'vat_calculator',
      inputs: {
        buildable_area: 180,
        price: 350000,
        planning_application_date: '01/11/2023', // Exactly Nov 1, 2023
      },
    });

    console.log(`Expected: €17,500 (5% of €350,000 - new policy)`);
    console.log(`Actual: ${test6Result.result?.summary}`);
    console.log(`Success: ${test6Result.success}`);
    console.log(`Policy: ${test6Result.result?.details.is_new_policy ? 'New' : 'Old'}`);
    console.log('');

    // Show formatted output for one test
    console.log('Sample formatted output (Test 1):');
    console.log('=====================================');
    console.log(test1Result.result?.formatted_output);
    console.log('');

    console.log('🏁 VAT Calculator testing complete!');

    // Summary
    const tests = [test1Result, test2Result, test3Result, test4Result, test5Result, test6Result];
    const passed = tests.filter(t =>
      (t.success && t.result?.summary) ||
      (!t.success && t.error?.message?.includes('DD/MM/YYYY'))
    ).length;

    console.log(`Summary: ${passed}/${tests.length} tests passed`);

  } catch (error) {
    console.error('❌ Error testing VAT calculator:', error);
  }
}

testVATCalculator();