/**
 * (c) Chris Kirmse, Chad Walker
 */
type Token = number;
export default class Semaphore {
  constructor(max_count: number);
  acquire(): Promise<Token>;
  release(token: Token): void;
  waitIdle(): Promise<null>;
  getCurrentCount(): number;
  getBlockedCount(): number;
  getTotalCount(): number;
  getMaxCount(): number;
  setMaxCount(max_count: number): void;
}
