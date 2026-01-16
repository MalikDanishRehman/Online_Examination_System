const DEBUG = true;

export const dbg = {
  log: (...args) => {
    if (DEBUG) {
      console.log('[DBG]', ...args);
    }
  }
};