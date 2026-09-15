export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'تایید', danger = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div className="text-muted">{message}</div>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>بازگشت</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
