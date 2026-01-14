import { dbg } from "../utils/debugger";

export default function CustomPopup({ title, message, onClose }) {
  dbg.log("Render CustomPopup:", title);

  return (
    <div className="popup-overlay">
      <div className="popup-modal">
        <span className="popup-close" onClick={onClose}>✖</span>
        <h2>{title}</h2>
        <pre className="popup-message">{message}</pre>
      </div>
    </div>
  );
}
