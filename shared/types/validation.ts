import { InvoiceData, ValidationResult, ValidationError } from './index';

/**
 * Validates an Ethereum-compatible wallet address
 */
export function validateWalletAddress(address: string): ValidationError | null {
  if (!address) {
    return {
      field: 'vendorAddress',
      message: 'Vendor address is required',
      code: 'REQUIRED_FIELD'
    };
  }

  // Check if it's a valid Ethereum address format (0x followed by 40 hex characters)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    return {
      field: 'vendorAddress',
      message: 'Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters)',
      code: 'INVALID_ADDRESS_FORMAT'
    };
  }

  // Check for zero address
  if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    return {
      field: 'vendorAddress',
      message: 'Cannot send payment to zero address',
      code: 'ZERO_ADDRESS'
    };
  }

  return null;
}

/**
 * Validates payment amount
 */
export function validateAmount(amount: bigint, spendingCap?: bigint): ValidationError | null {
  if (amount <= 0n) {
    return {
      field: 'amount',
      message: 'Payment amount must be greater than zero',
      code: 'INVALID_AMOUNT'
    };
  }

  // Check against spending cap if provided
  if (spendingCap && amount > spendingCap) {
    return {
      field: 'amount',
      message: `Payment amount exceeds spending cap of ${spendingCap.toString()} PYUSD`,
      code: 'SPENDING_CAP_EXCEEDED'
    };
  }

  // Check for reasonable maximum (prevent overflow issues)
  const maxAmount = BigInt('1000000000000000000000000'); // 1M PYUSD with 18 decimals
  if (amount > maxAmount) {
    return {
      field: 'amount',
      message: 'Payment amount exceeds maximum allowed value',
      code: 'AMOUNT_TOO_LARGE'
    };
  }

  return null;
}

/**
 * Validates due date
 */
export function validateDueDate(dueDate: Date): ValidationError | null {
  if (!dueDate || isNaN(dueDate.getTime())) {
    return {
      field: 'dueDate',
      message: 'Valid due date is required',
      code: 'INVALID_DATE'
    };
  }

  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  // Due date cannot be in the past (with 1 minute tolerance for clock differences)
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  if (dueDate < oneMinuteAgo) {
    return {
      field: 'dueDate',
      message: 'Due date cannot be in the past',
      code: 'PAST_DUE_DATE'
    };
  }

  // Due date cannot be more than 1 year in the future
  if (dueDate > oneYearFromNow) {
    return {
      field: 'dueDate',
      message: 'Due date cannot be more than 1 year in the future',
      code: 'DUE_DATE_TOO_FAR'
    };
  }

  return null;
}

/**
 * Validates target chain
 */
export function validateTargetChain(targetChain: string): ValidationError | null {
  if (!targetChain) {
    return {
      field: 'targetChain',
      message: 'Target chain is required',
      code: 'REQUIRED_FIELD'
    };
  }

  // List of supported chains (can be expanded)
  const supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'avalanche',
    'bsc'
  ];

  if (!supportedChains.includes(targetChain.toLowerCase())) {
    return {
      field: 'targetChain',
      message: `Unsupported target chain: ${targetChain}. Supported chains: ${supportedChains.join(', ')}`,
      code: 'UNSUPPORTED_CHAIN'
    };
  }

  return null;
}

/**
 * Validates currency
 */
export function validateCurrency(currency: string): ValidationError | null {
  if (!currency) {
    return {
      field: 'currency',
      message: 'Currency is required',
      code: 'REQUIRED_FIELD'
    };
  }

  if (currency !== 'PYUSD') {
    return {
      field: 'currency',
      message: 'Only PYUSD payments are supported',
      code: 'UNSUPPORTED_CURRENCY'
    };
  }

  return null;
}

/**
 * Comprehensive invoice validation
 */
export function validateInvoice(invoiceData: InvoiceData, spendingCap?: bigint): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field
  const addressError = validateWalletAddress(invoiceData.vendorAddress);
  if (addressError) errors.push(addressError);

  const amountError = validateAmount(invoiceData.amount, spendingCap);
  if (amountError) errors.push(amountError);

  const dueDateError = validateDueDate(invoiceData.dueDate);
  if (dueDateError) errors.push(dueDateError);

  const chainError = validateTargetChain(invoiceData.targetChain);
  if (chainError) errors.push(chainError);

  const currencyError = validateCurrency(invoiceData.currency);
  if (currencyError) errors.push(currencyError);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to format amount for display
 */
export function formatPYUSDAmount(amount: bigint): string {
  // PYUSD has 6 decimal places
  const divisor = BigInt(1000000);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return `${wholePart.toString()} PYUSD`;
  }
  
  const fractionalStr = fractionalPart.toString().padStart(6, '0').replace(/0+$/, '');
  return `${wholePart.toString()}.${fractionalStr} PYUSD`;
}

/**
 * Utility function to parse PYUSD amount from string
 */
export function parsePYUSDAmount(amountStr: string): bigint {
  if (!amountStr || typeof amountStr !== 'string') {
    throw new Error('Invalid amount string');
  }

  // Remove PYUSD suffix if present
  const cleanAmount = amountStr.replace(/\s*PYUSD\s*$/i, '').trim();
  
  // Handle decimal point
  const parts = cleanAmount.split('.');
  if (parts.length > 2) {
    throw new Error('Invalid amount format');
  }

  const wholePart = parts[0] || '0';
  const fractionalPart = (parts[1] || '').padEnd(6, '0').slice(0, 6);

  // Validate numeric format
  if (!/^\d+$/.test(wholePart) || (fractionalPart && !/^\d+$/.test(fractionalPart))) {
    throw new Error('Invalid numeric format');
  }

  const wholeAmount = BigInt(wholePart) * BigInt(1000000);
  const fractionalAmount = BigInt(fractionalPart);

  return wholeAmount + fractionalAmount;
}