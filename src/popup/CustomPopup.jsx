import "../styles/popup.css";

export default function CustomPopup({ title, message, onClose }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <pre>{message}</pre>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}