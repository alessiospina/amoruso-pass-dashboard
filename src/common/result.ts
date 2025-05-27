// Base Result interface
// eslint-disable-next-line import/no-cycle
import { SuccessResult } from '@/common/success.result'
// eslint-disable-next-line import/no-cycle
import { ErrorResult } from '@/common/error.result'
import { ValidationErrorResult } from '@/common/validation.error.result'
import { BusinessRuleErrorResult } from '@/common/business.rule.error.result'

export interface IResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Union type for results
export type Result<T = void> = SuccessResult<T> | ErrorResult<T>

// Validation Error Result - per errori di validazione strutturati
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Business Rule Error Result - per errori di business logic
export interface BusinessRuleError {
  rule: string;
  message: string;
  field?: string;
}

// Type guards per discriminare i tipi
export function isSuccessResult<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success === true
}

export function isErrorResult<T>(result: Result<T>): result is ErrorResult<T> {
  return result.success === false && !('validationErrors' in result) && !('businessErrors' in result)
}

export function isValidationErrorResult<T>(
  result: Result<T> | ValidationErrorResult<T>,
): result is ValidationErrorResult<T> {
  return result.success === false && 'validationErrors' in result
}

export function isBusinessRuleErrorResult<T>(
  result: Result<T> | BusinessRuleErrorResult<T>,
): result is BusinessRuleErrorResult<T> {
  return result.success === false && 'businessErrors' in result
}

// Helper functions per creare risultati
export const ResultFactory = {
  success: <T>(data?: T): SuccessResult<T> => SuccessResult.create(data),
  error: <T = void>(error: string): ErrorResult<T> => ErrorResult.create(error),
  validationError: <T = void>(
    error: string,
    validationErrors: ValidationError[],
  ): ValidationErrorResult<T> => ValidationErrorResult.create(error, validationErrors),
  businessError: <T = void>(
    error: string,
    businessErrors: BusinessRuleError[],
  ): BusinessRuleErrorResult<T> => BusinessRuleErrorResult.create(error, businessErrors),
}

// Extended Result type che include tutti i possibili risultati
export type ExtendedResult<T = void> =
  | SuccessResult<T>
  | ErrorResult<T>
  | ValidationErrorResult<T>
  | BusinessRuleErrorResult<T>
