import { useEffect, useState } from "react";
import { dbg } from "../utils/debugger";
import { subscribePopup } from "../utils/popup";
import CustomPopup from "./CustomPopup";
import CustomPopupTopRight from "./CustomPopupTopRight";

export default function PopupHost() {
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    dbg.log("PopupHost mounted");

    const unsubscribe = subscribePopup((data) => {
      dbg.log("PopupHost received popup:", data);
      setPopup(data);
    });

    return () => {
      dbg.log("PopupHost unmounted");
      unsubscribe();
    };
  }, []);

  if (!popup) return null;

  const close = () => {
    dbg.log("Popup closed");
    setPopup(null);
  };

  if (popup.type === "topright") {
    return (
      <CustomPopupTopRight
        title={popup.title}
        message={popup.message}
        onClose={close}
      />
    );
  }

  return (
    <CustomPopup
      title={popup.title}
      message={popup.message}
      onClose={close}
    />
  );
}
