let popupCallback = null;

export const subscribePopup = (callback) => {
  popupCallback = callback;
  return () => {
    popupCallback = null;
  };
};

export const showPopup = (data) => {
  if (popupCallback) {
    popupCallback(data);
  }
};