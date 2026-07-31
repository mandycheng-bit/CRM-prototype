import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  // 'danger' is for destructive/discard actions (red); 'primary' for everything else.
  confirmVariant?: 'danger' | 'primary';
  // Disables both buttons while the confirmed action is in flight, so a slow
  // save/delete can't be double-submitted by an impatient second click.
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Single reusable confirm dialog for every "are you sure" moment in the app —
// unsaved-changes guards, Delete, Archive — so the copy and button styling
// stay consistent instead of each call site rolling its own.
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, message, confirmLabel, cancelLabel = 'Cancel', confirmVariant = 'primary', disabled, onConfirm, onClose } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3">
            {confirmVariant === 'danger' && (
              <div className="shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-black text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-1.5 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
