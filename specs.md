PayPilot — MVP Feature Checklist
1.Core Vendor Payment Flow

Input invoice details: vendor wallet, amount, due date, chain

Validate & display parsed fields to user

One-click execution settling in PYUSD

Confirmation screen with success status

2️. Policy-Safe, Non-Custodial Execution

Uses user-owned wallet (no custody)

Guardrails:

Allow-listed vendor wallets

Per-transaction spending cap

Optional approval prompt if policy violated

3. Cross-Chain Intents (Avail Nexus SDK)

Select vendor’s preferred chain

Execute Bridge & Execute intent if chains differ

Show routing + expected gas/fees before confirmation

4. Risk & Transparency (Blockscout)

Pre-execution vendor risk snapshot (address history lookup)

Post-execution:

Transaction hash + embedded Blockscout SDK view

Downloadable human-readable receipt

5. Clean, Credible Product UX

Minimal navigation:
Invoice → Review (Policy/Risk) → Execute → Receipt

Supports 2–4 min ETHGlobal demo video with clarity

✨ Stretch Goals (Optional)

Toggle recurring payments

Spend analytics (e.g., last 7 days by vendor)

Vendor reputation scoring from Blockscout data

Invoice term negotiation: “1% discount for net-15”

🧩 MVP Architecture Overview

Frontend: Next.js + React UI with Blockscout SDK

Backend Agent: Node/TS service calling:

checkRisk(vendor) (Blockscout API/MCP)

executePayment(amount, destChain, vendor) (Avail Nexus)

Smart Contract: Minimal PaymentPolicyModule

Allow-lists + spend caps + emergency pause
