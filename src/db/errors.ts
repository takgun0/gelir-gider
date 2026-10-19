// DB işlemlerinin reddettiği durumlar. Arayüz bunları formda önceden yakalar;
// buradaki kontroller veri bütünlüğü için son savunma hattıdır.

export type DbErrorCode =
  | 'notFound'
  | 'invalidAmount'
  | 'invalidDate'
  | 'futureDate'
  | 'invalidText'
  | 'categoryMissing'
  | 'typeMismatch'
  | 'invalidDay'
  | 'invalidEnd'
  | 'emptyName'
  | 'nameTooLong'
  | 'duplicateName'
  | 'systemCategory'
  | 'alreadyRecurring';

export class DbError extends Error {
  readonly code: DbErrorCode;

  constructor(code: DbErrorCode) {
    super(code);
    this.name = 'DbError';
    this.code = code;
  }
}

export function isConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'ConstraintError';
}
