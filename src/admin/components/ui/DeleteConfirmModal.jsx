const DeleteConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title       = 'Are you sure?',
  message     = 'This record will be permanently removed. You will not be able to recover the deleted record!',
  confirmText = 'Yes, Delete It!',
  cancelText  = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="dcm-overlay" onClick={onCancel}>
      <div className="dcm-card" onClick={e => e.stopPropagation()}>

        {/* Warning icon */}
        <div className="dcm-icon-wrap">
          <span className="dcm-icon">!</span>
        </div>

        <h2 className="dcm-title">{title}</h2>
        <p className="dcm-message">{message}</p>

        <div className="dcm-actions">
          <button className="dcm-btn dcm-btn--confirm" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="dcm-btn dcm-btn--cancel" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;