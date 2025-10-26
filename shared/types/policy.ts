import { PolicyConfig, ValidationResult, ValidationError } from './index';

/**
 * Creates a new PolicyConfig with default settings
 */
export function createDefaultPolicyConfig(): PolicyConfig {
  return {
    allowedVendors: [],
    spendingCaps: new Map<string, bigint>(),
    requiresApproval: true,
    emergencyPaused: false
  };
}

/**
 * Creates a PolicyConfig from plain object (for JSON deserialization)
 */
export function createPolicyConfigFromObject(obj: {
  allowedVendors: string[];
  spendingCaps: [string, string][]; // Array of [address, amount] tuples
  requiresApproval: boolean;
  emergencyPaused: boolean;
}): PolicyConfig {
  const spendingCaps = new Map<string, bigint>();
  
  // Convert spending caps array to Map with BigInt values
  obj.spendingCaps.forEach(([address, amount]) => {
    spendingCaps.set(address, BigInt(amount));
  });

  return {
    allowedVendors: [...obj.allowedVendors],
    spendingCaps,
    requiresApproval: obj.requiresApproval,
    emergencyPaused: obj.emergencyPaused
  };
}

/**
 * Converts PolicyConfig to plain object (for JSON serialization)
 */
export function policyConfigToObject(config: PolicyConfig): {
  allowedVendors: string[];
  spendingCaps: [string, string][];
  requiresApproval: boolean;
  emergencyPaused: boolean;
} {
  const spendingCapsArray: [string, string][] = Array.from(config.spendingCaps.entries())
    .map(([address, amount]) => [address, amount.toString()]);

  return {
    allowedVendors: [...config.allowedVendors],
    spendingCaps: spendingCapsArray,
    requiresApproval: config.requiresApproval,
    emergencyPaused: config.emergencyPaused
  };
}

/**
 * Adds a vendor to the allowed list
 */
export function addAllowedVendor(config: PolicyConfig, vendorAddress: string): PolicyConfig {
  const addressError = validateVendorAddress(vendorAddress);
  if (addressError) {
    throw new Error(`Invalid vendor address: ${addressError.message}`);
  }

  const normalizedAddress = vendorAddress.toLowerCase();
  
  if (config.allowedVendors.includes(normalizedAddress)) {
    return config; // Already exists, no change needed
  }

  return {
    ...config,
    allowedVendors: [...config.allowedVendors, normalizedAddress]
  };
}

/**
 * Removes a vendor from the allowed list
 */
export function removeAllowedVendor(config: PolicyConfig, vendorAddress: string): PolicyConfig {
  const normalizedAddress = vendorAddress.toLowerCase();
  
  return {
    ...config,
    allowedVendors: config.allowedVendors.filter(addr => addr !== normalizedAddress)
  };
}

/**
 * Sets spending cap for a user
 */
export function setSpendingCap(config: PolicyConfig, userAddress: string, cap: bigint): PolicyConfig {
  const addressError = validateUserAddress(userAddress);
  if (addressError) {
    throw new Error(`Invalid user address: ${addressError.message}`);
  }

  const capError = validateSpendingCap(cap);
  if (capError) {
    throw new Error(`Invalid spending cap: ${capError.message}`);
  }

  const newSpendingCaps = new Map(config.spendingCaps);
  newSpendingCaps.set(userAddress.toLowerCase(), cap);

  return {
    ...config,
    spendingCaps: newSpendingCaps
  };
}

/**
 * Removes spending cap for a user
 */
export function removeSpendingCap(config: PolicyConfig, userAddress: string): PolicyConfig {
  const newSpendingCaps = new Map(config.spendingCaps);
  newSpendingCaps.delete(userAddress.toLowerCase());

  return {
    ...config,
    spendingCaps: newSpendingCaps
  };
}

/**
 * Updates approval requirement setting
 */
export function setApprovalRequirement(config: PolicyConfig, requiresApproval: boolean): PolicyConfig {
  return {
    ...config,
    requiresApproval
  };
}

/**
 * Sets emergency pause state
 */
export function setEmergencyPause(config: PolicyConfig, paused: boolean): PolicyConfig {
  return {
    ...config,
    emergencyPaused: paused
  };
}

/**
 * Checks if a vendor is allowed
 */
export function isVendorAllowed(config: PolicyConfig, vendorAddress: string): boolean {
  if (config.emergencyPaused) {
    return false;
  }

  // If no vendors are specified, allow all (open policy)
  if (config.allowedVendors.length === 0) {
    return true;
  }

  return config.allowedVendors.includes(vendorAddress.toLowerCase());
}

/**
 * Gets spending cap for a user
 */
export function getSpendingCap(config: PolicyConfig, userAddress: string): bigint | null {
  return config.spendingCaps.get(userAddress.toLowerCase()) || null;
}

/**
 * Checks if amount is within spending cap
 */
export function isWithinSpendingCap(config: PolicyConfig, userAddress: string, amount: bigint): boolean {
  if (config.emergencyPaused) {
    return false;
  }

  const cap = getSpendingCap(config, userAddress);
  if (cap === null) {
    return true; // No cap set, allow any amount
  }

  return amount <= cap;
}

/**
 * Validates vendor address format
 */
function validateVendorAddress(address: string): ValidationError | null {
  if (!address) {
    return {
      field: 'vendorAddress',
      message: 'Vendor address is required',
      code: 'REQUIRED_FIELD'
    };
  }

  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    return {
      field: 'vendorAddress',
      message: 'Invalid vendor address format',
      code: 'INVALID_ADDRESS_FORMAT'
    };
  }

  return null;
}

/**
 * Validates user address format
 */
function validateUserAddress(address: string): ValidationError | null {
  if (!address) {
    return {
      field: 'userAddress',
      message: 'User address is required',
      code: 'REQUIRED_FIELD'
    };
  }

  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    return {
      field: 'userAddress',
      message: 'Invalid user address format',
      code: 'INVALID_ADDRESS_FORMAT'
    };
  }

  return null;
}

/**
 * Validates spending cap amount
 */
function validateSpendingCap(cap: bigint): ValidationError | null {
  if (cap < 0n) {
    return {
      field: 'spendingCap',
      message: 'Spending cap must be non-negative',
      code: 'INVALID_SPENDING_CAP'
    };
  }

  // Check for reasonable maximum
  const maxCap = BigInt('1000000000000000000000000'); // 1M PYUSD with 6 decimals
  if (cap > maxCap) {
    return {
      field: 'spendingCap',
      message: 'Spending cap exceeds maximum allowed value',
      code: 'SPENDING_CAP_TOO_LARGE'
    };
  }

  return null;
}

/**
 * Validates allowed vendors list
 */
function validateAllowedVendors(vendors: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();

  vendors.forEach((vendor, index) => {
    const addressError = validateVendorAddress(vendor);
    if (addressError) {
      errors.push({
        field: `allowedVendors[${index}]`,
        message: addressError.message,
        code: addressError.code
      });
    }

    const normalizedAddress = vendor.toLowerCase();
    if (seen.has(normalizedAddress)) {
      errors.push({
        field: `allowedVendors[${index}]`,
        message: 'Duplicate vendor address',
        code: 'DUPLICATE_VENDOR'
      });
    }
    seen.add(normalizedAddress);
  });

  return errors;
}

/**
 * Validates spending caps map
 */
function validateSpendingCaps(spendingCaps: Map<string, bigint>): ValidationError[] {
  const errors: ValidationError[] = [];

  spendingCaps.forEach((cap, address) => {
    const addressError = validateUserAddress(address);
    if (addressError) {
      errors.push({
        field: `spendingCaps.${address}`,
        message: `Invalid address: ${addressError.message}`,
        code: addressError.code
      });
    }

    const capError = validateSpendingCap(cap);
    if (capError) {
      errors.push({
        field: `spendingCaps.${address}`,
        message: `Invalid cap: ${capError.message}`,
        code: capError.code
      });
    }
  });

  return errors;
}

/**
 * Comprehensive PolicyConfig validation
 */
export function validatePolicyConfig(config: PolicyConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate allowed vendors
  const vendorErrors = validateAllowedVendors(config.allowedVendors);
  errors.push(...vendorErrors);

  // Validate spending caps
  const capErrors = validateSpendingCaps(config.spendingCaps);
  errors.push(...capErrors);

  // Validate boolean fields (they should always be valid, but check for safety)
  if (typeof config.requiresApproval !== 'boolean') {
    errors.push({
      field: 'requiresApproval',
      message: 'requiresApproval must be a boolean value',
      code: 'INVALID_TYPE'
    });
  }

  if (typeof config.emergencyPaused !== 'boolean') {
    errors.push({
      field: 'emergencyPaused',
      message: 'emergencyPaused must be a boolean value',
      code: 'INVALID_TYPE'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if policy allows a specific payment
 */
export function isPolicyCompliant(
  config: PolicyConfig,
  vendorAddress: string,
  userAddress: string,
  amount: bigint
): { allowed: boolean; reason?: string } {
  if (config.emergencyPaused) {
    return { allowed: false, reason: 'System is in emergency pause mode' };
  }

  if (!isVendorAllowed(config, vendorAddress)) {
    return { allowed: false, reason: 'Vendor is not in the allowed list' };
  }

  if (!isWithinSpendingCap(config, userAddress, amount)) {
    const cap = getSpendingCap(config, userAddress);
    return { 
      allowed: false, 
      reason: `Amount exceeds spending cap of ${cap?.toString() || 'unknown'} PYUSD` 
    };
  }

  return { allowed: true };
}

/**
 * Gets policy summary for display
 */
export function getPolicySummary(config: PolicyConfig): {
  vendorCount: number;
  userCapCount: number;
  requiresApproval: boolean;
  emergencyPaused: boolean;
  totalCapsValue: bigint;
} {
  let totalCapsValue = BigInt(0);
  config.spendingCaps.forEach(cap => {
    totalCapsValue += cap;
  });

  return {
    vendorCount: config.allowedVendors.length,
    userCapCount: config.spendingCaps.size,
    requiresApproval: config.requiresApproval,
    emergencyPaused: config.emergencyPaused,
    totalCapsValue
  };
}