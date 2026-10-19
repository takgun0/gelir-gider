// DB işlemleri saati ve kimlik üreticiyi dışarıdan alır; testler sabit değer verir.
import { systemClock, toDateStr, type Clock } from '../domain/date';
import type { DateStr } from '../domain/types';

export interface OpContext {
  /** epoch ms */
  now: number;
  /** Yerel "bugün" */
  today: DateStr;
  newId: () => string;
}

export function contextFrom(clock: Clock = systemClock): OpContext {
  const date = clock();
  return { now: date.getTime(), today: toDateStr(date), newId: () => crypto.randomUUID() };
}

/**
 * Sekmeler arası tekilleştirme (Gereksinimler §5.3). navigator.locks yoksa doğrudan çalışır;
 * yine de unique index ve ConstraintError yakalama mükerrer kaydı engeller.
 */
export async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  if (!locks?.request) return fn();
  return locks.request(name, { mode: 'exclusive' }, fn);
}
