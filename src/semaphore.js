/**
 * (c) Chris Kirmse, Chad Walker
 */

class Semaphore {
  constructor(max_count) {
    this.setMaxCount(max_count);

    this.current_count = 0;

    this.current_set = new Set();

    this.next_token = 1;

    this.wait_idle_promise = null;
    this.wait_idle_resolve = null;

    this.tasks = [];
    this.pending_task_count = 0;

    this.log = (level, ...message) => {};
  }

  _schedule() {
    if (this.tasks.length === 0 || this.current_count >= this.max_count) {
      return;
    }
    const task = this.tasks.shift();
    this.current_count++;
    const token = this.next_token++;
    this.log('debug', 'creating token', token);
    this.current_set.add(token);

    this.log('debug', 'scheduled', this.current_count);
    task.resolve(token);
  }

  async acquire() {
    this.pending_task_count++;
    return new Promise((resolve, reject) => {
      this.pending_task_count--;
      this.tasks.push({
        resolve,
        reject,
      });
      setImmediate(() => {
        this._schedule();
      });
    });
  }

  release(token) {
    if (!this.current_set.has(token)) {
      this.log('error',
        'release on a semaphore with invalid token, this is very bad',
        token,
      );
      return;
    }
    this.current_set.delete(token);
    this.log('debug', 'releasing token', token, this.current_set.size);
    this.current_count--;
    this.log('debug', 'released', this.current_count);
    this._schedule();

    if (this.current_count === 0 && this.wait_idle_promise) {
      const resolve = this.wait_idle_resolve;
      this.wait_idle_promise = null;
      this.wait_idle_resolve = null;
      resolve();
    }
  }

  async waitIdle() {
    this.log('debug', 'waitIdle called with current count', this.current_count);

    if (this.current_count === 0) {
      return null;
    }
    if (this.wait_idle_promise) {
      return this.wait_idle_promise;
    }
    this.wait_idle_promise = new Promise((resolve, reject) => {
      this.wait_idle_resolve = resolve;
    });
    return this.wait_idle_promise;
  }

  getCurrentCount() {
    return this.current_count;
  }

  getBlockedCount() {
    return this.tasks.length;
  }

  getTotalCount() {
    return this.current_count + this.tasks.length + this.pending_task_count;
  }

  getMaxCount() {
    return this.max_count;
  }

  setMaxCount(max_count) {
    if (!max_count) {
      this.log('error', 'invalid semaphore max count', max_count);
      throw new Error('InvalidSemaphoreMaxCount');
    }
    this.max_count = max_count;
  }
}

export default Semaphore;
