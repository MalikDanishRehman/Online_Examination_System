import { useEffect } from "react";
import { dbg } from "../utils/debugger";

export default function CustomPopupTopRight({ title, message, onClose }) {
  dbg.log("Render CustomPopupTopRight:", title);

  useEffect(() => {
    dbg.log("TopRight popup auto-dismiss timer started");

    const timer = setTimeout(() => {
      dbg.log("TopRight popup auto-dismissed");
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-topright">
      <span className="popup-close" onClick={onClose}>✖</span>
      <strong>{title}</strong>
      <pre className="popup-message">{message}</pre>
    </div>
  );
}
