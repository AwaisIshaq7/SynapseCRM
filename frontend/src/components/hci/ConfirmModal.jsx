import Modal from '../Modal'

/** Modal panel for critical decisions (HCI #11). */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) {
  const confirmClass = variant === 'danger' ? 'btn-danger' : 'btn-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onClose} className="btn-secondary">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className={confirmClass}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
