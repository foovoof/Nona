import type { Result } from '@tos/shared/result';

// Output DTO for SubmitKycDocuments
export interface SubmitKycDocumentsOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SubmitKycDocumentsResult = Result<SubmitKycDocumentsOutput, Error>;
