import { X, Upload } from 'lucide-react';

export default function BalanceUploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Upload Balance Data</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-orange-300 transition-colors cursor-pointer">
          <Upload size={32} className="text-gray-300" />
          <div className="text-sm font-medium">Drop Excel / CSV here</div>
          <div className="text-xs">or click to browse</div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold">Upload</button>
        </div>
      </div>
    </div>
  );
}
