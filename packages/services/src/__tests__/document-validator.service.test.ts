/**
 * Document Validator Service Tests
 * Tests phone masking, bank extraction, field validation
 */

import { describe, it, expect } from 'vitest';
import { DocumentValidatorService } from '../document-validator.service';

describe('DocumentValidatorService', () => {
  describe('maskPhoneNumber', () => {
    it('should mask Cyprus mobile numbers (99 07 67 32 → 99 ** 67 32)', () => {
      expect(DocumentValidatorService.maskPhoneNumber('99 07 67 32')).toBe(
        '99 ** 67 32'
      );
    });

    it('should mask international Cyprus numbers (+357 99 07 67 32)', () => {
      expect(
        DocumentValidatorService.maskPhoneNumber('+357 99 07 67 32')
      ).toBe('+357 99 ** 67 32');
    });

    it('should mask UK numbers (+44 79 07 83 24 71)', () => {
      expect(
        DocumentValidatorService.maskPhoneNumber('+44 79 07 83 24 71')
      ).toBe('+44 79 ** 83 24 71');
    });

    it('should handle numbers with extra spaces', () => {
      expect(DocumentValidatorService.maskPhoneNumber('99  07  67  32')).toBe(
        '99 ** 67 32'
      );
    });

    it('should return empty string for empty input', () => {
      expect(DocumentValidatorService.maskPhoneNumber('')).toBe('');
    });

    it('should handle numbers without country code', () => {
      expect(DocumentValidatorService.maskPhoneNumber('79 07 83 24')).toBe(
        '79 ** 83 24'
      );
    });
  });

  describe('extractBankNameFromURL', () => {
    it('should extract Remu Team from remuproperties.com', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://www.remuproperties.com/Cyprus/listing-29190'
        )
      ).toBe('Remu Team');
    });

    it('should extract Gordian Team from gordian URLs', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://gordian.com/property/123'
        )
      ).toBe('Gordian Team');
    });

    it('should extract Altia Team from altia URLs', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://altia.properties.com/listing'
        )
      ).toBe('Altia Team');
    });

    it('should extract Altamira Team from altamira URLs', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://altamira.com/properties'
        )
      ).toBe('Altamira Team');
    });

    it('should return null for unknown URLs', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://www.zyprus.com/property/123'
        )
      ).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      expect(
        DocumentValidatorService.extractBankNameFromURL(
          'https://www.REMUPROPERTIES.com/listing'
        )
      ).toBe('Remu Team');
    });

    it('should return null for empty URL', () => {
      expect(DocumentValidatorService.extractBankNameFromURL('')).toBeNull();
    });
  });

  describe('validateFields', () => {
    it('should validate reg_banks_property with all required fields', () => {
      const result = DocumentValidatorService.validateFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 12 34 56',
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 07 67 32',
        }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', () => {
      const result = DocumentValidatorService.validateFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          // Missing client_phone, property_link, agent_phone
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('Client Phone'))).toBe(true);
    });

    it('should validate URL format', () => {
      const result = DocumentValidatorService.validateFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 12 34 56',
          property_link: 'not-a-valid-url',
          agent_phone: '99 07 67 32',
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid URL'))).toBe(true);
    });

    it('should validate phone number format', () => {
      const result = DocumentValidatorService.validateFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '123', // Too short
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 07 67 32',
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid phone'))).toBe(
        true
      );
    });

    it('should return error for unknown template', () => {
      const result = DocumentValidatorService.validateFields(
        'unknown_template',
        {}
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown template'))).toBe(
        true
      );
    });
  });

  describe('processFields', () => {
    it('should mask phone numbers during processing', () => {
      const result = DocumentValidatorService.processFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 07 67 32',
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 12 34 56',
        }
      );

      expect(result.client_phone).toBe('+357 99 ** 67 32');
      expect(result.agent_phone).toBe('99 ** 34 56');
    });

    it('should auto-extract bank name from property URL', () => {
      const result = DocumentValidatorService.processFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 07 67 32',
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 12 34 56',
          // bank_name not provided
        }
      );

      expect(result.bank_name).toBe('Remu Team');
    });

    it('should not override existing bank name', () => {
      const result = DocumentValidatorService.processFields(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 07 67 32',
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 12 34 56',
          bank_name: 'Custom Bank Name',
        }
      );

      expect(result.bank_name).toBe('Custom Bank Name');
    });
  });

  describe('parsePropertyLinks', () => {
    it('should parse single property link', () => {
      const result = DocumentValidatorService.parsePropertyLinks(
        'https://www.zyprus.com/property/123'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('https://www.zyprus.com/property/123');
    });

    it('should parse multiple property links separated by commas', () => {
      const result = DocumentValidatorService.parsePropertyLinks(
        'https://www.zyprus.com/property/123, https://www.zyprus.com/property/456'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('https://www.zyprus.com/property/123');
      expect(result[1]).toBe('https://www.zyprus.com/property/456');
    });

    it('should parse multiple property links separated by newlines', () => {
      const result = DocumentValidatorService.parsePropertyLinks(
        'https://www.zyprus.com/property/123\nhttps://www.zyprus.com/property/456'
      );

      expect(result).toHaveLength(2);
    });

    it('should parse links from formatted text', () => {
      const result = DocumentValidatorService.parsePropertyLinks(
        'Property 1: https://www.zyprus.com/property/123\nProperty 2: https://www.zyprus.com/property/456'
      );

      expect(result).toHaveLength(2);
    });

    it('should return empty array for text with no links', () => {
      const result = DocumentValidatorService.parsePropertyLinks(
        'No links here'
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('formatPropertyLinks', () => {
    it('should return single link as-is', () => {
      const result = DocumentValidatorService.formatPropertyLinks([
        'https://www.zyprus.com/property/123',
      ]);

      expect(result).toBe('https://www.zyprus.com/property/123');
    });

    it('should format multiple links with numbering', () => {
      const result = DocumentValidatorService.formatPropertyLinks([
        'https://www.zyprus.com/property/123',
        'https://www.zyprus.com/property/456',
      ]);

      expect(result).toBe(
        'Property 1: https://www.zyprus.com/property/123\nProperty 2: https://www.zyprus.com/property/456'
      );
    });

    it('should return empty string for empty array', () => {
      const result = DocumentValidatorService.formatPropertyLinks([]);

      expect(result).toBe('');
    });
  });

  describe('getMissingFieldsSummary', () => {
    it('should generate summary for missing fields', () => {
      const summary = DocumentValidatorService.getMissingFieldsSummary(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          // Missing other fields
        }
      );

      expect(summary).toContain('Bank/REMU Property Registration');
      expect(summary).toContain('Client Phone');
      expect(summary).toContain('Property URL');
    });

    it('should indicate when all fields are collected', () => {
      const summary = DocumentValidatorService.getMissingFieldsSummary(
        'reg_banks_property',
        {
          client_name: 'John Doe',
          client_phone: '+357 99 07 67 32',
          property_link: 'https://www.remuproperties.com/listing-123',
          agent_phone: '99 12 34 56',
        }
      );

      expect(summary).toContain('All required fields collected');
    });
  });
});
