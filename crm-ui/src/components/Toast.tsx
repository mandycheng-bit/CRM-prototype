import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

// Same toast convention already used in ProductsConfiguration.tsx (top-right,
// dark, auto-dismisses after 3s) — extracted here so other modules can share
// it instead of re-implementing the same pattern with slightly different copy.
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, showToast: setToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
      <Check size={14} className="text-orange-500 shrink-0" />
      <span className="font-semibold leading-normal">{message}</span>
    </div>
  );
}
