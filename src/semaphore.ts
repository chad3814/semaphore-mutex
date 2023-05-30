/**
 * (c) Chris Kirmse, Chad Walker
 */

type Token = number;

interface Task {
  resolve: (token: Token) => void;
  reject: (err: Error) => void;
}

class Semaphore {
  private maxCount: number;
  private currentCount = 0;
  private currentSet = new Set<Token>();
  private nextToken = 1;
  private waitIdlePromise: Promise<void> | null = null;
  private waitIdleResolve: null | (() => void) = null;
  private tasks: Task[] = [];
  private pendingTaskCount = 0;
  private log: (level: string, ...message: any[]) => void;

  constructor(maxCount: number) {
    this.maxCount = maxCount;

    this.log = (level, ...message) => {
      /* nop */
    };
  }

  _schedule() {
    if (this.currentCount >= this.maxCount) {
      return;
    }
    const task = this.tasks.shift();
    if (!task) {
      return;
    }

    this.currentCount++;
    const token = this.nextToken++;
    this.log('debug', 'creating token', token);
    this.currentSet.add(token);

    this.log('debug', 'scheduled', this.currentCount);
    task.resolve(token);
  }

  async acquire() {
    this.pendingTaskCount++;
    return new Promise((resolve, reject) => {
      this.pendingTaskCount--;
      this.tasks.push({
        resolve,
        reject,
      });
      setImmediate(() => {
        this._schedule();
      });
    });
  }

  release(token: Token) {
    if (!this.currentSet.has(token)) {
      this.log('error', 'release on a semaphore with invalid token, this is very bad', token);
      return;
    }
    this.currentSet.delete(token);
    this.log('debug', 'releasing token', token, this.currentSet.size);
    this.currentCount--;
    this.log('debug', 'released', this.currentCount);
    this._schedule();

    if (this.currentCount === 0 && this.waitIdlePromise) {
      const resolve = this.waitIdleResolve!;
      this.waitIdlePromise = null;
      this.waitIdleResolve = null;
      resolve();
    }
  }

  async waitIdle() {
    this.log('debug', 'waitIdle called with current count', this.currentCount);

    if (this.currentCount === 0) {
      return null;
    }
    if (this.waitIdlePromise) {
      return this.waitIdlePromise;
    }
    this.waitIdlePromise = new Promise((resolve, reject) => {
      this.waitIdleResolve = resolve;
    });
    return this.waitIdlePromise;
  }

  getCurrentCount() {
    return this.currentCount;
  }

  getBlockedCount() {
    return this.tasks.length;
  }

  getTotalCount() {
    return this.currentCount + this.tasks.length + this.pendingTaskCount;
  }

  getMaxCount() {
    return this.maxCount;
  }

  setMaxCount(maxCount: number) {
    if (!maxCount) {
      this.log('error', 'invalid semaphore max count', maxCount);
      throw new Error('InvalidSemaphoreMaxCount');
    }
    this.maxCount = maxCount;
  }
}

export default Semaphore;
