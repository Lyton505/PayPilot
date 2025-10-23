// Core data models for PayPilot

export interface Invoice {
  id: string;
  vendorAddress: string;
  amount: bigint;
  currency: 'PYUSD';
  dueDate: Date;
  targetChain: string;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  FAILED = 'failed'
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  transactionHash: string;
  fromChain: string;
  toChain: string;
  amount: bigint;
  gasUsed: bigint;
  status: TransactionStatus;
  executedAt: Date;
  blockNumber: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface PolicyConfig {
  allowedVendors: string[];
  spendingCaps: Map<string, bigint>; // user address -> cap
  requiresApproval: boolean;
  emergencyPaused: boolean;
}

// Input/validation interfaces
export interface InvoiceData {
  vendorAddress: string;
  amount: bigint;
  dueDate: Date;
  targetChain: string;
  currency: 'PYUSD';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: bigint;
}

// Risk assessment interfaces
export interface RiskProfile {
  address: string;
  transactionCount: number;
  totalVolume: bigint;
  riskFlags: RiskFlag[];
  reputation: number;
}

export interface RiskFlag {
  type: RiskFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export enum RiskFlagType {
  HIGH_VOLUME = 'high_volume',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BLACKLISTED = 'blacklisted',
  NEW_ADDRESS = 'new_address',
  MIXER_INTERACTION = 'mixer_interaction'
}

export interface TransactionHistory {
  address: string;
  transactions: HistoricalTransaction[];
  totalCount: number;
  firstSeen: Date;
  lastActive: Date;
}

export interface HistoricalTransaction {
  hash: string;
  timestamp: Date;
  value: bigint;
  from: string;
  to: string;
  status: string;
}

// Cross-chain routing interfaces
export interface ChainRoute {
  fromChain: string;
  toChain: string;
  estimatedGas: bigint;
  estimatedTime: number;
  bridgeFee: bigint;
  route: RouteStep[];
}

export interface RouteStep {
  protocol: string;
  action: string;
  estimatedGas: bigint;
  estimatedTime: number;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}