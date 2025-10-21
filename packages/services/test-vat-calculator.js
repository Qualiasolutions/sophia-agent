/**
 * Test VAT Calculator Direct
 * Simple test using the compiled calculator service
 */

const { CalculatorService } = require('./src/calculator.service.ts');

async function testVATCalculator() {
  try {
    console.log('🧪 Testing VAT Calculator Service...\n');

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

    console.log('🏁 VAT Calculator testing complete!');

  } catch (error) {
    console.error('❌ Error testing VAT calculator:', error);
  }
}

testVATCalculator();