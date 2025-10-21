#!/usr/bin/env node

/**
 * Test VAT Calculator API
 * Tests the VAT calculator API endpoint to ensure it works with the new parameters
 */

async function testVATCalculator() {
  try {
    console.log('🧪 Testing VAT Calculator API...\n');

    // Test case 1: New policy, property under €350,000
    console.log('Test 1: New policy (after Nov 1, 2023), property under €350,000');
    const test1Response = await fetch('http://localhost:3001/api/admin/calculators/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildable_area: 150,
        price: 300000,
        planning_application_date: '15/01/2024',
      }),
    });

    if (test1Response.ok) {
      const test1Result = await test1Response.json();
      console.log('✅ Test 1 passed');
      console.log(`Expected: €15,000 (5% of €300,000)`);
      console.log(`Actual: ${test1Result.result?.summary}`);
      console.log(`Success: ${test1Result.success}`);
      console.log('');
    } else {
      console.log('❌ Test 1 failed');
      console.log(`Status: ${test1Response.status}`);
      console.log(`Error: ${await test1Response.text()}`);
      console.log('');
    }

    // Test case 2: New policy, property over €350,000
    console.log('Test 2: New policy (after Nov 1, 2023), property over €350,000');
    const test2Response = await fetch('http://localhost:3001/api/admin/calculators/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildable_area: 200,
        price: 500000,
        planning_application_date: '01/12/2023',
      }),
    });

    if (test2Response.ok) {
      const test2Result = await test2Response.json();
      console.log('✅ Test 2 passed');
      console.log(`Expected: €95,000 (19% of €500,000)`);
      console.log(`Actual: ${test2Result.result?.summary}`);
      console.log(`Success: ${test2Result.success}`);
      console.log('');
    } else {
      console.log('❌ Test 2 failed');
      console.log(`Status: ${test2Response.status}`);
      console.log(`Error: ${await test2Response.text()}`);
      console.log('');
    }

    // Test case 3: Old policy, property under 200m²
    console.log('Test 3: Old policy (before Nov 1, 2023), property under 200m²');
    const test3Response = await fetch('http://localhost:3001/api/admin/calculators/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildable_area: 150,
        price: 400000,
        planning_application_date: '15/10/2023',
      }),
    });

    if (test3Response.ok) {
      const test3Result = await test3Response.json();
      console.log('✅ Test 3 passed');
      console.log(`Expected: €20,000 (5% of €400,000)`);
      console.log(`Actual: ${test3Result.result?.summary}`);
      console.log(`Success: ${test3Result.success}`);
      console.log('');
    } else {
      console.log('❌ Test 3 failed');
      console.log(`Status: ${test3Response.status}`);
      console.log(`Error: ${await test3Response.text()}`);
      console.log('');
    }

    // Test case 4: Invalid date format
    console.log('Test 4: Invalid date format');
    const test4Response = await fetch('http://localhost:3001/api/admin/calculators/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildable_area: 150,
        price: 300000,
        planning_application_date: '2024-01-15', // Wrong format
      }),
    });

    if (!test4Response.ok) {
      const test4Result = await test4Response.json();
      console.log('✅ Test 4 passed (correctly rejected invalid format)');
      console.log(`Expected: Error about DD/MM/YYYY format`);
      console.log(`Actual: ${test4Result.error?.message}`);
      console.log(`Success: ${test4Result.success}`);
    } else {
      console.log('❌ Test 4 failed (should have rejected invalid format)');
    }

    console.log('\n🏁 VAT Calculator API testing complete!');

  } catch (error) {
    console.error('❌ Error testing VAT calculator:', error);
    console.log('Make sure the dev server is running on http://localhost:3001');
  }
}

testVATCalculator();