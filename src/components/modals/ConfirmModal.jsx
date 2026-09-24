export default function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 relative">
        <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 shadow-sm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
