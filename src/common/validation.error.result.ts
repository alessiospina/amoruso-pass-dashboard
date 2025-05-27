import { IResult, ValidationError } from '@/common/result'

export class ValidationErrorResult<T = void> implements IResult<T> {
  readonly success = false

  readonly data = undefined

  readonly error: string

  readonly validationErrors: ValidationError[]

  constructor(error: string, validationErrors: ValidationError[]) {
    this.error = error
    this.validationErrors = validationErrors
  }

  static create<T = void>(
    error: string,
    validationErrors: ValidationError[],
  ): ValidationErrorResult<T> {
    return new ValidationErrorResult<T>(error, validationErrors)
  }

  static fromZodError<T = void>(zodError: any): ValidationErrorResult<T> {
    const validationErrors: ValidationError[] = []

    if (zodError.errors && Array.isArray(zodError.errors)) {
      zodError.errors.forEach((err: any) => {
        validationErrors.push({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
          code: err.code,
        })
      })
    }

    return new ValidationErrorResult<T>(
      'Errori di validazione',
      validationErrors,
    )
  }
}
