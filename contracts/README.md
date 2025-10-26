# PayPilot Smart Contracts

This directory contains the smart contracts for the PayPilot payment platform, specifically the `PaymentPolicyModule` contract that enforces payment policies and spending controls.

## Overview

The `PaymentPolicyModule` is a smart contract that provides:

- **Allow-list Management**: Control which vendor addresses can receive payments
- **Spending Cap Enforcement**: Set and enforce per-user spending limits
- **Emergency Pause**: Ability to halt all payment validations in emergency situations
- **Admin Management**: Role-based access control for policy management

## Contract Features

### Core Functionality

1. **Vendor Allow-list**
   - Add/remove vendors from the approved payment list
   - Batch operations for efficient management
   - Only allowed vendors can receive payments

2. **Spending Caps**
   - Default spending cap of 10,000 PYUSD for all users
   - Custom spending caps per user
   - Automatic tracking of spent amounts
   - Reset functionality for new spending periods

3. **Payment Validation**
   - Pre-payment validation against policies
   - Automatic spending tracking
   - Comprehensive error handling with specific error types

4. **Emergency Controls**
   - Emergency pause functionality for admins
   - Only owner can unpause the contract
   - All payment validations are blocked when paused

5. **Access Control**
   - Owner has full control over the contract
   - Admins can manage policies and emergency pause
   - Role-based permissions with proper validation

### Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Ownable**: Secure ownership management
- **Input Validation**: Comprehensive validation of all inputs
- **Custom Errors**: Gas-efficient error handling

## Usage

### Deployment

```bash
npm run compile
npm run deploy
```

### Testing

```bash
npm test
```

### Local Development

```bash
npm run node  # Start local Hardhat node
```

## Contract Interface

### Key Functions

#### View Functions
- `isVendorAllowed(address vendor)`: Check if vendor is on allow-list
- `getSpendingCap(address user)`: Get user's spending cap
- `getRemainingAllowance(address user)`: Get user's remaining spending allowance
- `getSpentAmount(address user)`: Get user's total spent amount

#### Admin Functions
- `addVendor(address vendor)`: Add vendor to allow-list
- `removeVendor(address vendor)`: Remove vendor from allow-list
- `setSpendingCap(address user, uint256 cap)`: Set user's spending cap
- `emergencyPause()`: Pause all payment validations

#### Payment Validation
- `validatePayment(address user, address vendor, uint256 amount)`: Validate and record payment

### Events

- `VendorAllowListUpdated(address indexed vendor, bool allowed)`
- `SpendingCapUpdated(address indexed user, uint256 newCap)`
- `PaymentExecuted(address indexed user, address indexed vendor, uint256 amount)`
- `EmergencyPauseActivated(address indexed admin)`
- `EmergencyPauseDeactivated(address indexed admin)`

### Custom Errors

- `VendorNotAllowed(address vendor)`: Vendor not on allow-list
- `SpendingCapExceeded(address user, uint256 requested, uint256 available)`: Payment exceeds spending cap
- `InvalidAmount()`: Invalid payment amount (zero or negative)
- `InvalidAddress()`: Invalid address (zero address)
- `UnauthorizedAccess()`: Caller lacks required permissions

## Integration

The contract is designed to be integrated with the PayPilot frontend and backend services. The TypeScript interface is available in `interfaces/IPaymentPolicyModule.ts` for type-safe integration.

### Frontend Integration

```typescript
import { PAYMENT_POLICY_ABI } from './interfaces/IPaymentPolicyModule';
import { ethers } from 'ethers';

const contract = new ethers.Contract(contractAddress, PAYMENT_POLICY_ABI, signer);
const isAllowed = await contract.isVendorAllowed(vendorAddress);
```

### Backend Integration

The contract can be called from the backend service to validate payments before execution:

```typescript
await contract.validatePayment(userAddress, vendorAddress, amount);
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 2.2**: Vendor allow-list verification
- **Requirement 2.3**: Spending cap validation and enforcement  
- **Requirement 6.1**: Allow-list management for vendor wallets
- **Requirement 6.2**: Per-transaction spending caps through smart contract validation
- **Requirement 6.3**: Emergency pause function to halt all payments

## Security Considerations

1. **Access Control**: Only authorized admins can modify policies
2. **Input Validation**: All inputs are validated to prevent invalid states
3. **Reentrancy Protection**: ReentrancyGuard prevents reentrancy attacks
4. **Emergency Controls**: Emergency pause can halt operations if needed
5. **Gas Optimization**: Efficient storage patterns and batch operations
6. **Error Handling**: Custom errors provide clear feedback while saving gas

## Testing

The contract includes comprehensive unit tests covering:

- All core functionality
- Edge cases and error conditions
- Access control and permissions
- Emergency scenarios
- Gas optimization and security features

Run tests with: `npm test`