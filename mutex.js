/**
 * (c) Athenascope, Inc. Confidential and proprietary.
 */

import Semaphore from './semaphore.js';

class Mutex extends Semaphore {
  constructor() {
    super(1);
  }
}

export default Mutex;
