/**
 * (c) Chris Kirmse, Chad Walker
 */

import Semaphore from './semaphore';

class Mutex extends Semaphore {
  constructor() {
    super(1);
  }
}

export default Mutex;
