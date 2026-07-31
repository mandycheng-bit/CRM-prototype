import { AlertTriangle } from 'lucide-react';

export interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

// Generic "something unexpected happened" dialog — for failures that aren't a
// normal validation problem (those get an inline banner instead) and don't
// have a more specific message of their own. One consistent fallback rather
// than a bespoke error message per call site.
export function ErrorDialog(props: ErrorDialogProps) {
  const { open, title = 'Something went wrong', message = "Sorry, we couldn't complete that action. Please try again.", onClose } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
