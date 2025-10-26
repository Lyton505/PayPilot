import {
  validateWalletAddress,
  validateAmount,
  validateDueDate,
  validateTargetChain,
  validateCurrency,
  validateInvoice,
  formatPYUSDAmount,
  parsePYUSDAmount
} from '../validation';
import { InvoiceData } from '../index';

describe('validateWalletAddress', () => {
  it('should accept valid Ethereum addresses', () => {
    const validAddresses = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      '0x0000000000000000000000000000000000000001',
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
    ];

    validAddresses.forEach(address => {
      expect(validateWalletAddress(address)).toBeNull();
    });
  });

  it('should reject empty or null addresses', () => {
    const result = validateWalletAddress('');
    expect(result).toEqual({
      field: 'vendorAddress',
      message: 'Vendor address is required',
      code: 'REQUIRED_FIELD'
    });
  });

  it('should reject invalid address formats', () => {
    const invalidAddresses = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b', // too short
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b66', // too long
      '742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // missing 0x
      '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // invalid hex
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 ' // trailing space
    ];

    invalidAddresses.forEach(address => {
      const result = validateWalletAddress(address);
      expect(result).toEqual({
        field: 'vendorAddress',
        message: 'Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters)',
        code: 'INVALID_ADDRESS_FORMAT'
      });
    });
  });

  it('should reject zero address', () => {
    const result = validateWalletAddress('0x0000000000000000000000000000000000000000');
    expect(result).toEqual({
      field: 'vendorAddress',
      message: 'Cannot send payment to zero address',
      code: 'ZERO_ADDRESS'
    });
  });
});

describe('validateAmount', () => {
  it('should accept valid amounts', () => {
    const validAmounts = [
      BigInt(1000000), // 1 PYUSD
      BigInt(100000000), // 100 PYUSD
      BigInt(1000000000000) // 1M PYUSD
    ];

    validAmounts.forEach(amount => {
      expect(validateAmount(amount)).toBeNull();
    });
  });

  it('should reject zero or negative amounts', () => {
    const invalidAmounts = [BigInt(0), BigInt(-1), BigInt(-1000000)];

    invalidAmounts.forEach(amount => {
      const result = validateAmount(amount);
      expect(result).toEqual({
        field: 'amount',
        message: 'Payment amount must be greater than zero',
        code: 'INVALID_AMOUNT'
      });
    });
  });

  it('should enforce spending caps', () => {
    const amount = BigInt(2000000); // 2 PYUSD
    const spendingCap = BigInt(1000000); // 1 PYUSD

    const result = validateAmount(amount, spendingCap);
    expect(result).toEqual({
      field: 'amount',
      message: 'Payment amount exceeds spending cap of 1000000 PYUSD',
      code: 'SPENDING_CAP_EXCEEDED'
    });
  });

  it('should reject amounts that are too large', () => {
    const maxAmount = BigInt('1000000000000000000000001'); // Exceeds max
    const result = validateAmount(maxAmount);
    expect(result).toEqual({
      field: 'amount',
      message: 'Payment amount exceeds maximum allowed value',
      code: 'AMOUNT_TOO_LARGE'
    });
  });
});

describe('validateDueDate', () => {
  it('should accept valid future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    expect(validateDueDate(futureDate)).toBeNull();
  });

  it('should reject invalid dates', () => {
    const invalidDate = new Date('invalid');
    const result = validateDueDate(invalidDate);
    expect(result).toEqual({
      field: 'dueDate',
      message: 'Valid due date is required',
      code: 'INVALID_DATE'
    });
  });

  it('should reject past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const result = validateDueDate(pastDate);
    expect(result).toEqual({
      field: 'dueDate',
      message: 'Due date cannot be in the past',
      code: 'PAST_DUE_DATE'
    });
  });

  it('should reject dates too far in the future', () => {
    const farFutureDate = new Date();
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 2); // 2 years from now

    const result = validateDueDate(farFutureDate);
    expect(result).toEqual({
      field: 'dueDate',
      message: 'Due date cannot be more than 1 year in the future',
      code: 'DUE_DATE_TOO_FAR'
    });
  });

  it('should accept dates within 1 minute tolerance', () => {
    const recentDate = new Date();
    recentDate.setSeconds(recentDate.getSeconds() - 30); // 30 seconds ago

    expect(validateDueDate(recentDate)).toBeNull();
  });
});

describe('validateTargetChain', () => {
  it('should accept supported chains', () => {
    const supportedChains = [
      'ethereum',
      'polygon',
      'arbitrum',
      'optimism',
      'base',
      'avalanche',
      'bsc'
    ];

    supportedChains.forEach(chain => {
      expect(validateTargetChain(chain)).toBeNull();
    });
  });

  it('should accept case-insensitive chain names', () => {
    expect(validateTargetChain('ETHEREUM')).toBeNull();
    expect(validateTargetChain('Polygon')).toBeNull();
  });

  it('should reject empty chain names', () => {
    const result = validateTargetChain('');
    expect(result).toEqual({
      field: 'targetChain',
      message: 'Target chain is required',
      code: 'REQUIRED_FIELD'
    });
  });

  it('should reject unsupported chains', () => {
    const result = validateTargetChain('solana');
    expect(result?.code).toBe('UNSUPPORTED_CHAIN');
    expect(result?.message).toContain('Unsupported target chain: solana');
  });
});

describe('validateCurrency', () => {
  it('should accept PYUSD', () => {
    expect(validateCurrency('PYUSD')).toBeNull();
  });

  it('should reject empty currency', () => {
    const result = validateCurrency('');
    expect(result).toEqual({
      field: 'currency',
      message: 'Currency is required',
      code: 'REQUIRED_FIELD'
    });
  });

  it('should reject unsupported currencies', () => {
    const result = validateCurrency('USDC');
    expect(result).toEqual({
      field: 'currency',
      message: 'Only PYUSD payments are supported',
      code: 'UNSUPPORTED_CURRENCY'
    });
  });
});

describe('validateInvoice', () => {
  const validInvoiceData: InvoiceData = {
    vendorAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    amount: BigInt(1000000), // 1 PYUSD
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    targetChain: 'ethereum',
    currency: 'PYUSD'
  };

  it('should validate a complete valid invoice', () => {
    const result = validateInvoice(validInvoiceData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect multiple validation errors', () => {
    const invalidInvoiceData: any = {
      vendorAddress: 'invalid-address',
      amount: BigInt(0),
      dueDate: new Date('invalid'),
      targetChain: 'unsupported',
      currency: 'USDC'
    };

    const result = validateInvoice(invalidInvoiceData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(5);
    
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain('INVALID_ADDRESS_FORMAT');
    expect(errorCodes).toContain('INVALID_AMOUNT');
    expect(errorCodes).toContain('INVALID_DATE');
    expect(errorCodes).toContain('UNSUPPORTED_CHAIN');
    expect(errorCodes).toContain('UNSUPPORTED_CURRENCY');
  });

  it('should enforce spending caps during validation', () => {
    const invoiceWithHighAmount = {
      ...validInvoiceData,
      amount: BigInt(2000000) // 2 PYUSD
    };
    const spendingCap = BigInt(1000000); // 1 PYUSD

    const result = validateInvoice(invoiceWithHighAmount, spendingCap);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('SPENDING_CAP_EXCEEDED');
  });
});

describe('formatPYUSDAmount', () => {
  it('should format whole amounts correctly', () => {
    expect(formatPYUSDAmount(BigInt(1000000))).toBe('1 PYUSD');
    expect(formatPYUSDAmount(BigInt(100000000))).toBe('100 PYUSD');
  });

  it('should format decimal amounts correctly', () => {
    expect(formatPYUSDAmount(BigInt(1500000))).toBe('1.5 PYUSD');
    expect(formatPYUSDAmount(BigInt(1234567))).toBe('1.234567 PYUSD');
    expect(formatPYUSDAmount(BigInt(1230000))).toBe('1.23 PYUSD');
  });

  it('should handle zero amount', () => {
    expect(formatPYUSDAmount(BigInt(0))).toBe('0 PYUSD');
  });

  it('should handle small amounts', () => {
    expect(formatPYUSDAmount(BigInt(1))).toBe('0.000001 PYUSD');
    expect(formatPYUSDAmount(BigInt(100))).toBe('0.0001 PYUSD');
  });
});

describe('parsePYUSDAmount', () => {
  it('should parse whole amounts correctly', () => {
    expect(parsePYUSDAmount('1')).toBe(BigInt(1000000));
    expect(parsePYUSDAmount('100')).toBe(BigInt(100000000));
    expect(parsePYUSDAmount('1 PYUSD')).toBe(BigInt(1000000));
  });

  it('should parse decimal amounts correctly', () => {
    expect(parsePYUSDAmount('1.5')).toBe(BigInt(1500000));
    expect(parsePYUSDAmount('1.234567')).toBe(BigInt(1234567));
    expect(parsePYUSDAmount('0.000001')).toBe(BigInt(1));
  });

  it('should handle zero amount', () => {
    expect(parsePYUSDAmount('0')).toBe(BigInt(0));
    expect(parsePYUSDAmount('0.0')).toBe(BigInt(0));
  });

  it('should throw on invalid formats', () => {
    expect(() => parsePYUSDAmount('')).toThrow('Invalid amount string');
    expect(() => parsePYUSDAmount('abc')).toThrow('Invalid numeric format');
    expect(() => parsePYUSDAmount('1.2.3')).toThrow('Invalid amount format');
  });

  it('should handle amounts with PYUSD suffix', () => {
    expect(parsePYUSDAmount('1.5 PYUSD')).toBe(BigInt(1500000));
    expect(parsePYUSDAmount('100PYUSD')).toBe(BigInt(100000000));
  });
});