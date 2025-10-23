# PayPilot Project Structure

This document outlines the project structure for PayPilot MVP implementation.

## Directory Structure

```
PayPilot/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   └── __tests__/       # Frontend tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── jest.config.js
├── backend/                  # Node.js/Express backend service
│   ├── src/
│   │   ├── index.ts         # Main server file
│   │   └── __tests__/       # Backend tests
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── shared/
│   └── types/               # Shared TypeScript interfaces
│       ├── index.ts         # Core type definitions
│       ├── package.json
│       ├── tsconfig.json
│       └── __tests__/       # Type tests
├── .kiro/
│   └── specs/
│       └── paypilot-mvp/    # Specification documents
├── package.json             # Root workspace configuration
└── PROJECT_STRUCTURE.md     # This file
```

## Core Interfaces Defined

### Invoice
- Complete invoice data model with status tracking
- Validation interfaces for input processing

### PaymentTransaction  
- Transaction tracking with blockchain data
- Status management for payment execution

### PolicyConfig
- Smart contract policy configuration
- Allow-list and spending cap management

### Risk Assessment
- Risk profile and flag definitions
- Transaction history interfaces

### Cross-Chain Routing
- Chain route and step definitions
- Integration interfaces for Avail Nexus

## Development Setup

1. Install dependencies: `npm run install:all`
2. Start frontend: `npm run dev:frontend`
3. Start backend: `npm run dev:backend`
4. Run tests: `npm test`

## Testing Framework

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **Types**: Jest for type validation tests

All components include basic test setup and example tests to verify the development environment is properly configured.