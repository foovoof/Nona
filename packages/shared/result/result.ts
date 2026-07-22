export type Result<T, E> = Ok<T> | Fail<E>;

export class Ok<T> {
  readonly ok = true as const;
  constructor(readonly value: T) {}
}

export class Fail<E> {
  readonly ok = false as const;
  constructor(readonly error: E) {}
}

export const ok = <T>(value: T): Result<T, never> => new Ok(value);
export const fail = <E>(error: E): Result<never, E> => new Fail(error);
