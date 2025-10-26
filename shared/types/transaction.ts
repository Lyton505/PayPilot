import { PaymentTransaction, TransactionStatus, ValidationResult, ValidationError } from './index';

/**
 * Creates a new PaymentTransaction with initial status
 */
export function createPaymentTransaction(
  invoiceId: string,
  fromChain: string,
  toChain: string,
  amount: bigint
): PaymentTransaction {
  return {
    id: generateTransactionId(),
    invoiceId,
    transactionHash: '',
    fromChain,
    toChain,
    amount,
    gasUsed: BigInt(0),
    status: TransactionStatus.PENDING,
    executedAt: new Date(),
    blockNumber: 0
  };
}

/**
 * Updates transaction status and related fields
 */
export function updateTransactionStatus(
  transaction: PaymentTransaction,
  status: TransactionStatus,
  updates?: {
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: bigint;
  }
): PaymentTransaction {
  const updatedTransaction = { ...transaction };
  updatedTransaction.status = status;

  if (updates?.transactionHash) {
    updatedTransaction.transactionHash = updates.transactionHash;
  }

  if (updates?.blockNumber) {
    updatedTransaction.blockNumber = updates.blockNumber;
  }

  if (updates?.gasUsed) {
    updatedTransaction.gasUsed = updates.gasUsed;
  }

  // Update execution time for confirmed transactions
  if (status === TransactionStatus.CONFIRMED) {
    updatedTransaction.executedAt = new Date();
  }

  return updatedTransaction;
}

/**
 * Validates transaction hash format
 */
export function validateTransactionHash(hash: string): ValidationError | null {
  if (!hash) {
    return {
      field: 'transactionHash',
      message: 'Transaction hash is required',
      code: 'REQUIRED_FIELD'
    };
  }

  // Ethereum transaction hash format (0x followed by 64 hex characters)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!txHashRegex.test(hash)) {
    return {
      field: 'transactionHash',
      message: 'Invalid transaction hash format. Must be a valid Ethereum transaction hash (0x followed by 64 hex characters)',
      code: 'INVALID_TX_HASH_FORMAT'
    };
  }

  return null;
}

/**
 * Validates block number
 */
export function validateBlockNumber(blockNumber: number): ValidationError | null {
  if (blockNumber < 0) {
    return {
      field: 'blockNumber',
      message: 'Block number must be non-negative',
      code: 'INVALID_BLOCK_NUMBER'
    };
  }

  // Check for reasonable maximum block number (prevents overflow)
  const maxBlockNumber = 999999999; // ~999M blocks
  if (blockNumber > maxBlockNumber) {
    return {
      field: 'blockNumber',
      message: 'Block number exceeds maximum allowed value',
      code: 'BLOCK_NUMBER_TOO_LARGE'
    };
  }

  return null;
}

/**
 * Validates gas used amount
 */
export function validateGasUsed(gasUsed: bigint): ValidationError | null {
  if (gasUsed < 0n) {
    return {
      field: 'gasUsed',
      message: 'Gas used must be non-negative',
      code: 'INVALID_GAS_USED'
    };
  }

  // Check for reasonable maximum gas (30M gas limit per block)
  const maxGas = BigInt(30000000);
  if (gasUsed > maxGas) {
    return {
      field: 'gasUsed',
      message: 'Gas used exceeds maximum block gas limit',
      code: 'GAS_USED_TOO_HIGH'
    };
  }

  return null;
}

/**
 * Validates supported chain names
 */
export function validateChainName(chainName: string, fieldName: string): ValidationError | null {
  if (!chainName) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD'
    };
  }

  const supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'avalanche',
    'bsc'
  ];

  if (!supportedChains.includes(chainName.toLowerCase())) {
    return {
      field: fieldName,
      message: `Unsupported chain: ${chainName}. Supported chains: ${supportedChains.join(', ')}`,
      code: 'UNSUPPORTED_CHAIN'
    };
  }

  return null;
}

/**
 * Validates transaction status transitions
 */
export function validateStatusTransition(
  currentStatus: TransactionStatus,
  newStatus: TransactionStatus
): ValidationError | null {
  const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
    [TransactionStatus.PENDING]: [
      TransactionStatus.CONFIRMED,
      TransactionStatus.FAILED,
      TransactionStatus.CANCELLED
    ],
    [TransactionStatus.CONFIRMED]: [], // Terminal state
    [TransactionStatus.FAILED]: [
      TransactionStatus.PENDING // Allow retry
    ],
    [TransactionStatus.CANCELLED]: [] // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      field: 'status',
      message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      code: 'INVALID_STATUS_TRANSITION'
    };
  }

  return null;
}

/**
 * Comprehensive PaymentTransaction validation
 */
export function validatePaymentTransaction(transaction: PaymentTransaction): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate invoice ID
  if (!transaction.invoiceId) {
    errors.push({
      field: 'invoiceId',
      message: 'Invoice ID is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate transaction hash if provided
  if (transaction.transactionHash) {
    const hashError = validateTransactionHash(transaction.transactionHash);
    if (hashError) errors.push(hashError);
  }

  // Validate chains
  const fromChainError = validateChainName(transaction.fromChain, 'fromChain');
  if (fromChainError) errors.push(fromChainError);

  const toChainError = validateChainName(transaction.toChain, 'toChain');
  if (toChainError) errors.push(toChainError);

  // Validate amount
  if (transaction.amount <= 0n) {
    errors.push({
      field: 'amount',
      message: 'Transaction amount must be greater than zero',
      code: 'INVALID_AMOUNT'
    });
  }

  // Validate gas used
  const gasError = validateGasUsed(transaction.gasUsed);
  if (gasError) errors.push(gasError);

  // Validate block number
  const blockError = validateBlockNumber(transaction.blockNumber);
  if (blockError) errors.push(blockError);

  // Validate execution date
  if (!transaction.executedAt || isNaN(transaction.executedAt.getTime())) {
    errors.push({
      field: 'executedAt',
      message: 'Valid execution date is required',
      code: 'INVALID_DATE'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if transaction is in a terminal state
 */
export function isTransactionTerminal(status: TransactionStatus): boolean {
  return status === TransactionStatus.CONFIRMED || status === TransactionStatus.CANCELLED;
}

/**
 * Checks if transaction is successful
 */
export function isTransactionSuccessful(status: TransactionStatus): boolean {
  return status === TransactionStatus.CONFIRMED;
}

/**
 * Checks if transaction can be retried
 */
export function canRetryTransaction(status: TransactionStatus): boolean {
  return status === TransactionStatus.FAILED;
}

/**
 * Gets human-readable status description
 */
export function getStatusDescription(status: TransactionStatus): string {
  const descriptions: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'Transaction is being processed',
    [TransactionStatus.CONFIRMED]: 'Transaction completed successfully',
    [TransactionStatus.FAILED]: 'Transaction failed and can be retried',
    [TransactionStatus.CANCELLED]: 'Transaction was cancelled'
  };

  return descriptions[status] || 'Unknown status';
}

/**
 * Generates a unique transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `tx_${timestamp}_${randomPart}`;
}

/**
 * Formats gas amount for display
 */
export function formatGasAmount(gasUsed: bigint): string {
  if (gasUsed === 0n) {
    return '0 gas';
  }

  const gasNumber = Number(gasUsed);
  if (gasNumber >= 1000000) {
    return `${(gasNumber / 1000000).toFixed(2)}M gas`;
  } else if (gasNumber >= 1000) {
    return `${(gasNumber / 1000).toFixed(1)}K gas`;
  } else {
    return `${gasNumber} gas`;
  }
}

/**
 * Calculates estimated transaction cost in ETH (rough estimate)
 */
export function estimateTransactionCost(gasUsed: bigint, gasPriceGwei: number): bigint {
  // Convert gas price from Gwei to Wei (1 Gwei = 10^9 Wei)
  const gasPriceWei = BigInt(gasPriceGwei) * BigInt(1000000000);
  return gasUsed * gasPriceWei;
}