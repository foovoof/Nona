# Scheduling Domain

## Responsibility
Managing scheduled/recurring transport jobs, cron-based tasks, retry logic.

## What It Owns
ScheduledTask, TaskStatus, RetryPolicy, CronExpression.

## What It Does NOT Own
Job lifecycle (transport-job), dispatch logic (dispatch).

## Events Emitted
- `ScheduledTaskCreated`
- `ScheduledTaskExecuted`
- `ScheduledTaskFailed`

## Events Consumed
- `JobCreated`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
