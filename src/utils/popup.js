import { dbg } from './debugger';

let listeners = [];

export const showPopup = (payload) => {
  dbg.log("popup.showPopup:", payload);

  if (!payload || !payload.title) {
    dbg.log("popup.showPopup: invalid payload", payload);
    return;
  }

  listeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      dbg.log("popup listener error:", err);
    }
  });
};

export const subscribePopup = (cb) => {
  dbg.log("popup.subscribePopup: added");
  listeners.push(cb);

  return () => {
    dbg.log("popup.subscribePopup: removed");
    listeners = listeners.filter((l) => l !== cb);
  };
};
