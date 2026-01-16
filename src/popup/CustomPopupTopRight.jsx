import { useEffect } from "react";
import "../styles/popup.css";

export default function CustomPopupTopRight({ title, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-topright">
      <div className="popup-topright-card">
        <h4>{title}</h4>
        <p>{message}</p>
        <button className="popup-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}