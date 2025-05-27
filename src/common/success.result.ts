// eslint-disable-next-line import/no-cycle
import { IResult } from '@/common/result'

export class SuccessResult<T = void> implements IResult<T> {
  readonly success = true

  readonly data?: T

  readonly error = undefined

  constructor(data?: T) {
    this.data = data
  }

  static create<T>(data?: T): SuccessResult<T> {
    return new SuccessResult(data)
  }

  static empty(): SuccessResult<void> {
    return new SuccessResult()
  }
}
