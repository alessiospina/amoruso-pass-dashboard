import { BusinessRuleError, IResult } from '@/common/result'

export class BusinessRuleErrorResult<T = void> implements IResult<T> {
  readonly success = false

  readonly data = undefined

  readonly error: string

  readonly businessErrors: BusinessRuleError[]

  constructor(error: string, businessErrors: BusinessRuleError[]) {
    this.error = error
    this.businessErrors = businessErrors
  }

  static create<T = void>(
    error: string,
    businessErrors: BusinessRuleError[],
  ): BusinessRuleErrorResult<T> {
    return new BusinessRuleErrorResult<T>(error, businessErrors)
  }

  static fromMessages<T = void>(messages: string[]): BusinessRuleErrorResult<T> {
    const businessErrors: BusinessRuleError[] = messages.map((message, index) => ({
      rule: `business_rule_${index}`,
      message,
    }))

    return new BusinessRuleErrorResult<T>(
      'Violazione regole business',
      businessErrors,
    )
  }
}
