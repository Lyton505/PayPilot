/**
 * TypeScript interface for PaymentPolicyModule smart contract
 * This interface matches the Solidity contract functions for type safety
 */

export interface IPaymentPolicyModule {
  // View functions
  isVendorAllowed(vendor: string): Promise<boolean>;
  getSpendingCap(user: string): Promise<bigint>;
  getRemainingAllowance(user: string): Promise<bigint>;
  getSpentAmount(user: string): Promise<bigint>;
  isAdmin(admin: string): Promise<boolean>;
  getContractStatus(): Promise<{ paused: boolean; defaultCap: bigint }>;
  defaultSpendingCap(): Promise<bigint>;
  owner(): Promise<string>;
  paused(): Promise<boolean>;

  // Admin functions
  updateAllowList(vendors: string[], allowed: boolean[]): Promise<void>;
  addVendor(vendor: string): Promise<void>;
  removeVendor(vendor: string): Promise<void>;
  setSpendingCap(user: string, cap: bigint): Promise<void>;
  setSpendingCaps(users: string[], caps: bigint[]): Promise<void>;
  resetSpentAmount(user: string): Promise<void>;
  resetSpentAmounts(users: string[]): Promise<void>;
  addAdmin(admin: string): Promise<void>;
  removeAdmin(admin: string): Promise<void>;
  emergencyPause(): Promise<void>;

  // Owner functions
  setDefaultSpendingCap(newDefaultCap: bigint): Promise<void>;
  unpause(): Promise<void>;

  // Payment validation
  validatePayment(user: string, vendor: string, amount: bigint): Promise<void>;
}

export interface PaymentPolicyEvents {
  VendorAllowListUpdated: {
    vendor: string;
    allowed: boolean;
  };
  SpendingCapUpdated: {
    user: string;
    newCap: bigint;
  };
  PaymentExecuted: {
    user: string;
    vendor: string;
    amount: bigint;
  };
  EmergencyPauseActivated: {
    admin: string;
  };
  EmergencyPauseDeactivated: {
    admin: string;
  };
}

export interface PaymentPolicyErrors {
  VendorNotAllowed: {
    vendor: string;
  };
  SpendingCapExceeded: {
    user: string;
    requested: bigint;
    available: bigint;
  };
  InvalidAmount: {};
  InvalidAddress: {};
  UnauthorizedAccess: {};
}

export const PAYMENT_POLICY_ABI = [
  // View functions
  "function isVendorAllowed(address vendor) external view returns (bool)",
  "function getSpendingCap(address user) external view returns (uint256)",
  "function getRemainingAllowance(address user) external view returns (uint256)",
  "function getSpentAmount(address user) external view returns (uint256)",
  "function isAdmin(address admin) external view returns (bool)",
  "function getContractStatus() external view returns (bool paused, uint256 defaultCap)",
  "function defaultSpendingCap() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)",

  // Admin functions
  "function updateAllowList(address[] calldata vendors, bool[] calldata allowed) external",
  "function addVendor(address vendor) external",
  "function removeVendor(address vendor) external",
  "function setSpendingCap(address user, uint256 cap) external",
  "function setSpendingCaps(address[] calldata users, uint256[] calldata caps) external",
  "function resetSpentAmount(address user) external",
  "function resetSpentAmounts(address[] calldata users) external",
  "function addAdmin(address admin) external",
  "function removeAdmin(address admin) external",
  "function emergencyPause() external",

  // Owner functions
  "function setDefaultSpendingCap(uint256 newDefaultCap) external",
  "function unpause() external",

  // Payment validation
  "function validatePayment(address user, address vendor, uint256 amount) external",

  // Events
  "event VendorAllowListUpdated(address indexed vendor, bool allowed)",
  "event SpendingCapUpdated(address indexed user, uint256 newCap)",
  "event PaymentExecuted(address indexed user, address indexed vendor, uint256 amount)",
  "event EmergencyPauseActivated(address indexed admin)",
  "event EmergencyPauseDeactivated(address indexed admin)",

  // Errors
  "error VendorNotAllowed(address vendor)",
  "error SpendingCapExceeded(address user, uint256 requested, uint256 available)",
  "error InvalidAmount()",
  "error InvalidAddress()",
  "error UnauthorizedAccess()"
] as const;