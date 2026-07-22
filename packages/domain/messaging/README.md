# Messaging Domain

## Responsibility
In-app chat/messaging between parties (rider-driver, rider-support). NOT system notifications.

## What It Owns
Conversation, Message, ReadReceipt.

## What It Does NOT Own
System notifications (notification), user identity (identity).

## Events Emitted
- `MessageSent`
- `MessageRead`
- `ConversationCreated`
- `ConversationClosed`

## Events Consumed
- `JobAccepted`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
