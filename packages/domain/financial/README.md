# Financial Domain

## Responsibility
Transactions, commission calculation, driver wallet, settlements, refunds.

## What It Owns
Transaction, Commission, Settlement, DriverWallet.

## What It Does NOT Own
Payment gateway integration (infrastructure), pricing (pricing).

## Events Emitted
- `PaymentAuthorized`
- `PaymentCaptured`
- `PaymentSettled`
- `CommissionCalculated`
- `RefundIssued`

## Events Consumed
- `JobCompleted`
- `FareEstimated`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
