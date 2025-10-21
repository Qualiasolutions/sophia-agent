/**
 * Calculator Service
 * Epic 3: Real Estate Calculators
 *
 * Implements calculation logic for Cyprus real estate calculators
 * Based on calculation rules extracted from zyprus.com and mof.gov.cy
 */

import type {
  Calculator,
  CalculatorExecutionRequest,
  CalculatorExecutionResult,
  CalculatorInputValidationResult,
} from '@sophiaai/shared';

/**
 * Transfer Fees Calculator
 * Source: https://www.zyprus.com/help/1260/property-transfer-fees-calculator
 *
 * Calculation Rules:
 * - Up to €85,000: 3%
 * - €85,001 - €170,000: 5%
 * - Over €170,001: 8%
 * - 50% exemption applies for resale properties (non-VAT transactions)
 * - Joint names: Each person calculated separately (property_value / 2)
 */
export function calculateTransferFees(inputs: Record<string, any>): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const propertyValue = parseFloat(inputs.property_value);
    const jointNames = inputs.joint_names === true || inputs.joint_names === 'true';

    if (isNaN(propertyValue) || propertyValue <= 0) {
      return {
        success: false,
        calculator_name: 'transfer_fees',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Property value must be a positive number',
          fallback_url: 'https://www.zyprus.com/help/1260/property-transfer-fees-calculator',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Calculate for each person if joint names
    const valuePerPerson = jointNames ? propertyValue / 2 : propertyValue;
    const numberOfPersons = jointNames ? 2 : 1;

    // Calculate progressive transfer fees
    let fees = 0;

    if (valuePerPerson <= 85000) {
      fees = valuePerPerson * 0.03;
    } else if (valuePerPerson <= 170000) {
      fees = (85000 * 0.03) + ((valuePerPerson - 85000) * 0.05);
    } else {
      fees = (85000 * 0.03) + (85000 * 0.05) + ((valuePerPerson - 170000) * 0.08);
    }

    // Multiply by number of persons
    fees = fees * numberOfPersons;

    // Apply 50% exemption for resale properties
    const exemptionApplied = fees * 0.5;
    const totalFees = fees - exemptionApplied;

    const formattedOutput = `💰 Transfer Fees Calculation\n\nProperty Value: €${propertyValue.toLocaleString()}\nBuying in Joint Names: ${jointNames ? 'Yes' : 'No'}\n\nCalculation Breakdown:\n${jointNames ? `- Value per person: €${valuePerPerson.toLocaleString()}\n` : ''}- Base transfer fees: €${fees.toLocaleString()}\n- 50% Exemption (resale): -€${exemptionApplied.toLocaleString()}\n\n📊 Total Transfer Fees: €${totalFees.toLocaleString()}\n\nNote: This calculation assumes a resale property (50% exemption applied). New builds subject to VAT are fully exempt from transfer fees.`;

    return {
      success: true,
      calculator_name: 'transfer_fees',
      inputs,
      result: {
        summary: `€${totalFees.toLocaleString()}`,
        details: {
          property_value: propertyValue,
          joint_names: jointNames,
          value_per_person: valuePerPerson,
          base_fees: fees,
          exemption: exemptionApplied,
          total_fees: totalFees,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: 'transfer_fees',
      inputs,
      error: {
        code: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown calculation error',
        fallback_url: 'https://www.zyprus.com/help/1260/property-transfer-fees-calculator',
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Capital Gains Tax Calculator
 * Source: https://www.zyprus.com/capital-gains-calculator
 *
 * Calculation Rules:
 * - Capital Gains = Sale Price - (Purchase Cost + Improvements + Expenses)
 * - Allowances: Main Residence (€85,430), Farm Land (€25,629), Any Other Sale (€17,086)
 * - Tax Rate: 20% on gains above allowance
 * - Inflation adjustment based on year of purchase/improvements
 */
export function calculateCapitalGainsTax(inputs: Record<string, any>): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const salePrice = parseFloat(inputs.sale_price);
    const purchasePrice = parseFloat(inputs.purchase_price);
    const purchaseYear = parseInt(inputs.purchase_year);
    const saleYear = parseInt(inputs.sale_year);

    // Optional expenses
    const costOfImprovements = parseFloat(inputs.cost_of_improvements || '0');
    // const improvementsYear = parseInt(inputs.improvements_year || saleYear.toString());
    const transferFees = parseFloat(inputs.transfer_fees || '0');
    const interestOnLoan = parseFloat(inputs.interest_on_loan || '0');
    const legalFees = parseFloat(inputs.legal_fees || '0');
    const agentFees = parseFloat(inputs.estate_agent_fees || '0');
    const otherExpenses = parseFloat(inputs.other_expenses || '0');

    // Allowance type
    const allowanceType = inputs.allowance_type || 'any_other_sale';

    if (isNaN(salePrice) || isNaN(purchasePrice) || salePrice <= 0 || purchasePrice <= 0) {
      return {
        success: false,
        calculator_name: 'capital_gains_tax',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Sale price and purchase price must be positive numbers',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Simplified inflation adjustment (approximation based on typical Cyprus CPI)
    const yearsHeld = saleYear - purchaseYear;
    const inflationRate = 0.02; // 2% annual average
    const inflationMultiplier = Math.pow(1 + inflationRate, yearsHeld);

    const adjustedPurchasePrice = purchasePrice * inflationMultiplier;

    // Calculate total cost basis
    const totalCostBasis = adjustedPurchasePrice + costOfImprovements + transferFees +
                          interestOnLoan + legalFees + agentFees + otherExpenses;

    // Calculate capital gain
    const capitalGain = salePrice - totalCostBasis;

    // Determine allowance
    const allowances: Record<string, number> = {
      main_residence: 85430,
      farm_land: 25629,
      any_other_sale: 17086,
      none: 0,
    };

    const allowance = allowances[allowanceType] ?? allowances.any_other_sale;

    // Calculate taxable gain
    const taxableGain = Math.max(0, capitalGain - (allowance ?? 0));

    // Calculate tax (20% rate)
    const capitalGainsTax = taxableGain * 0.20;

    const formattedOutput = `📈 Capital Gains Tax Calculation\n\nSale Details:\n- Sale Price: €${salePrice.toLocaleString()}\n- Sale Year: ${saleYear}\n\nPurchase Details:\n- Purchase Price: €${purchasePrice.toLocaleString()}\n- Purchase Year: €{purchaseYear}\n- Inflation-Adjusted: €${adjustedPurchasePrice.toLocaleString()}\n\nExpenses:\n- Improvements: €${costOfImprovements.toLocaleString()}\n- Transfer Fees: €${transferFees.toLocaleString()}\n- Legal Fees: €${legalFees.toLocaleString()}\n- Agent Fees: €${agentFees.toLocaleString()}\n- Other: €${otherExpenses.toLocaleString()}\n\nCalculation:\n- Total Cost Basis: €${totalCostBasis.toLocaleString()}\n- Capital Gain: €${capitalGain.toLocaleString()}\n- Allowance (${allowanceType.replace('_', ' ')}): €${(allowance ?? 0).toLocaleString()}\n- Taxable Gain: €${taxableGain.toLocaleString()}\n\n📊 Capital Gains Tax (20%): €${capitalGainsTax.toLocaleString()}\n\nNote: This is an estimate. Consult a tax professional for accurate assessment.`;

    return {
      success: true,
      calculator_name: 'capital_gains_tax',
      inputs,
      result: {
        summary: `€${capitalGainsTax.toLocaleString()}`,
        details: {
          sale_price: salePrice,
          purchase_price: purchasePrice,
          adjusted_purchase_price: adjustedPurchasePrice,
          total_cost_basis: totalCostBasis,
          capital_gain: capitalGain,
          allowance,
          taxable_gain: taxableGain,
          tax: capitalGainsTax,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: 'capital_gains_tax',
      inputs,
      error: {
        code: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown calculation error',
        fallback_url: 'https://www.zyprus.com/capital-gains-calculator',
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * VAT Calculator for Houses/Apartments
 * Source: https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
 *
 * Calculation Rules:
 * - Standard VAT Rate: 19%
 * - Reduced VAT Rate (5%): First 200m² for first home (before Nov 1, 2023)
 * - NEW Policy (from Nov 1, 2023): Reduced rate applies to properties up to €350,000
 * - Further reduced for persons with disabilities or large families
 * - Based on buildable area, property price, and planning application date
 */
export function calculateVAT(inputs: Record<string, any>): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const buildableArea = parseFloat(inputs.buildable_area);
    const propertyValue = parseFloat(inputs.price);

    // Parse planning application date (DD/MM/YYYY format)
    const planningApplicationDateStr = inputs.planning_application_date;
    if (!planningApplicationDateStr) {
      return {
        success: false,
        calculator_name: 'vat_calculator',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Planning application date is required (DD/MM/YYYY format)',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Parse DD/MM/YYYY to Date object
    const dateParts = planningApplicationDateStr.split('/');
    if (dateParts.length !== 3) {
      return {
        success: false,
        calculator_name: 'vat_calculator',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Date must be in DD/MM/YYYY format',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const year = parseInt(dateParts[2]);
    const planningApplicationDate = new Date(year, month - 1, day);

    if (isNaN(buildableArea) || buildableArea <= 0 || isNaN(propertyValue) || propertyValue <= 0) {
      return {
        success: false,
        calculator_name: 'vat_calculator',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Buildable area and price must be positive numbers',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Check if invalid date
    if (isNaN(planningApplicationDate.getTime())) {
      return {
        success: false,
        calculator_name: 'vat_calculator',
        inputs,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid date provided',
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Policy cutoff date: November 1, 2023
    const policyCutoffDate = new Date(2023, 10, 1); // Month is 0-indexed
    const isNewPolicy = planningApplicationDate >= policyCutoffDate;

    let totalVAT: number;
    let breakdown: string[] = [];

    if (isNewPolicy) {
      // NEW POLICY (from Nov 1, 2023)
      // Reduced 5% rate applies to properties up to €350,000
      if (propertyValue <= 350000) {
        totalVAT = propertyValue * 0.05;
        breakdown.push(`Property value (€${propertyValue.toLocaleString()}) is under €350,000 limit`);
        breakdown.push(`VAT Rate: 5% (reduced rate under new policy)`);
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      } else {
        totalVAT = propertyValue * 0.19;
        breakdown.push(`Property value (€${propertyValue.toLocaleString()}) exceeds €350,000 limit`);
        breakdown.push(`VAT Rate: 19% (standard rate under new policy)`);
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      }
    } else {
      // OLD POLICY (before Nov 1, 2023)
      // Reduced 5% rate for first 200m² of first home
      const reducedRateArea = Math.min(buildableArea, 200);
      const standardRateArea = Math.max(0, buildableArea - 200);

      if (buildableArea <= 200) {
        // Entire property at reduced rate
        totalVAT = propertyValue * 0.05;
        breakdown.push(`Buildable area (${buildableArea}m²) is within 200m² limit`);
        breakdown.push(`VAT Rate: 5% (reduced rate under old policy)`);
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      } else {
        // Mixed rate calculation
        const pricePerSqm = propertyValue / buildableArea;
        const reducedRateValue = reducedRateArea * pricePerSqm;
        const standardRateValue = standardRateArea * pricePerSqm;

        const reducedVAT = reducedRateValue * 0.05;
        const standardVAT = standardRateValue * 0.19;
        totalVAT = reducedVAT + standardVAT;

        breakdown.push(`First 200m² at 5%: ${reducedRateArea}m² × €${pricePerSqm.toFixed(2)}/m² = €${reducedVAT.toLocaleString()}`);
        breakdown.push(`Remaining area at 19%: ${standardRateArea}m² × €${pricePerSqm.toFixed(2)}/m² = €${standardVAT.toLocaleString()}`);
        breakdown.push(`Total VAT: €${totalVAT.toLocaleString()}`);
      }
    }

    const policyType = isNewPolicy ? 'New Policy (from Nov 1, 2023)' : 'Old Policy (before Nov 1, 2023)';
    const formattedOutput = `💵 VAT Calculation\n\nProperty Details:\n- Buildable Area: ${buildableArea}m²\n- Price: €${propertyValue.toLocaleString()}\n- Planning Application Date: ${planningApplicationDateStr}\n- Applied Policy: ${policyType}\n\nCalculation Breakdown:\n${breakdown.map(line => `• ${line}`).join('\n')}\n\n📊 Total VAT: €${totalVAT.toLocaleString()}\n\nNote: This calculation is for new builds only. Resale properties are exempt from VAT but pay transfer fees. Policy effective from planning application date.`;

    return {
      success: true,
      calculator_name: 'vat_calculator',
      inputs,
      result: {
        summary: `€${totalVAT.toLocaleString()}`,
        details: {
          buildable_area: buildableArea,
          price: propertyValue,
          planning_application_date: planningApplicationDateStr,
          is_new_policy: isNewPolicy,
          total_vat: totalVAT,
          breakdown,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: 'vat_calculator',
      inputs,
      error: {
        code: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown calculation error',
        fallback_url: 'https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform',
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Main Calculator Execution Function
 * Routes to appropriate calculator based on calculator name
 */
export function executeCalculator(request: CalculatorExecutionRequest): CalculatorExecutionResult {
  switch (request.calculator_name) {
    case 'transfer_fees':
      return calculateTransferFees(request.inputs);
    case 'capital_gains_tax':
      return calculateCapitalGainsTax(request.inputs);
    case 'vat_calculator':
      return calculateVAT(request.inputs);
    default:
      return {
        success: false,
        calculator_name: request.calculator_name,
        inputs: request.inputs,
        error: {
          code: 'UNKNOWN_CALCULATOR',
          message: `Calculator "${request.calculator_name}" not found`,
        },
      };
  }
}

/**
 * Validate calculator inputs against configuration
 */
export function validateCalculatorInputs(
  calculator: Calculator,
  inputs: Record<string, any>
): CalculatorInputValidationResult {
  const missingFields: string[] = [];
  const invalidFields: { name: string; value: any; reason: string }[] = [];
  const errors: string[] = [];

  for (const field of calculator.input_fields) {
    const value = inputs[field.name];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      missingFields.push(field.name);
      errors.push(`${field.label} is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!field.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (field.type === 'currency' || field.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        invalidFields.push({
          name: field.name,
          value,
          reason: 'Must be a valid number',
        });
        errors.push(`${field.label} must be a valid number`);
        continue;
      }

      // Range validation
      if (field.validation) {
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          invalidFields.push({
            name: field.name,
            value,
            reason: `Must be at least ${field.validation.min}`,
          });
          errors.push(`${field.label} must be at least ${field.validation.min}`);
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          invalidFields.push({
            name: field.name,
            value,
            reason: `Must be at most ${field.validation.max}`,
          });
          errors.push(`${field.label} must be at most ${field.validation.max}`);
        }
      }
    }

    // Select validation
    if (field.type === 'select' && field.validation?.allowed_values) {
      if (!field.validation.allowed_values.includes(value)) {
        invalidFields.push({
          name: field.name,
          value,
          reason: `Must be one of: ${field.validation.allowed_values.join(', ')}`,
        });
        errors.push(`${field.label} must be one of: ${field.validation.allowed_values.join(', ')}`);
      }
    }
  }

  return {
    valid: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
    errors,
  };
}

/**
 * Export calculator service functions
 */
export const CalculatorService = {
  executeCalculator,
  validateCalculatorInputs,
  calculateTransferFees,
  calculateCapitalGainsTax,
  calculateVAT,
};
