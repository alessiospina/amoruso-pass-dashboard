import { IResult } from '@/common/result'

export class ErrorResult<T = void> implements IResult<T> {
  readonly success = false

  readonly data = undefined

  readonly error: string

  constructor(error: string) {
    this.error = error
  }

  static create<T = void>(error: string): ErrorResult<T> {
    return new ErrorResult<T>(error)
  }
}
