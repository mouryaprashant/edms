import { useEffect, useState } from "react";
import { safeDocumentUrl } from "../../utils/urlSecurity";

export default function VersionHistoryModal({ open, station, doc, canEdit, onClose, onPublish }) {
  const [tag, setTag] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTag("");
      setUrl("");
      setNote("");
    }
  }, [open, doc?.id]);

  if (!open || !station || !doc) return null;

  const handlePublish = (e) => {
    e.preventDefault();
    if (!tag.trim() || !url.trim()) return;
    onPublish({ tag: tag.trim(), url: url.trim(), note: note.trim() });
  };

  const history = doc.history || [];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel modal-panel-lg max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{doc.label} - Revision Logs</h3>
            <p className="text-xs text-slate-500">
              {station.name} ({station.code})
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="my-4 overflow-y-auto custom-scrollbar space-y-4 flex-1 pr-1">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-900 bg-blue-200 px-2 py-0.5 rounded">ACTIVE REVISION</span>
                <span className="text-xs font-bold text-slate-700 font-mono">{doc.version}</span>
                <span className="text-[11px] text-slate-500">Updated: {doc.last_updated}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Main document currently serving station operations.</p>
            </div>
            <a
              href={safeDocumentUrl(doc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0"
            >
              <span>Open Active File</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {canEdit && (
            <div className="bg-slate-50 border border-dashed border-amber-300 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Publish New Revision / Alt Sheet
              </h4>
              <form onSubmit={handlePublish} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Version / Tag *</label>
                    <input
                      type="text"
                      required
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="e.g. Alt-D or v3.0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Google Drive URL *</label>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revision Notes / Reason for Change</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Lengthened Loop Line 2 & changed signal layout"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-sm transition-colors">
                    Update to New Revision
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Previous Revisions Timeline</h4>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No archived revisions recorded. This is the initial version ({doc.version}).
                </p>
              ) : (
                history
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 hover:bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{h.version}</span>
                          <span className="text-xs text-slate-500 font-medium">{h.updated_at || "Archived"}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{h.note || "No revision comments."}</p>
                      </div>
                      <a
                        href={safeDocumentUrl(h.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                      >
                        <span>View Archived File</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
