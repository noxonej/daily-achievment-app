import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-300 mb-5">{message}</p>
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-2.5 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 rounded-xl text-white font-semibold py-2.5 active:scale-95 transition-transform ${
            danger ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
