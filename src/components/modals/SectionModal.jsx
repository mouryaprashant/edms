import { useEffect, useMemo, useState } from "react";
import { DEFAULT_DIVISIONS } from "../../utils/normalize";

export default function SectionModal({ open, editingSection, allSections, onClose, onSave }) {
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");

  useEffect(() => {
    if (open) {
      setName(editingSection?.name || "");
      setDivision(editingSection?.division && editingSection.division !== "Unassigned" ? editingSection.division : "");
    }
  }, [open, editingSection]);

  const divisionSuggestions = useMemo(() => {
    const set = new Set(DEFAULT_DIVISIONS);
    (allSections || []).forEach((s) => {
      if (s.division && s.division !== "Unassigned") set.add(s.division);
    });
    return Array.from(set);
  }, [allSections]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, division.trim(), editingSection?.id || null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{editingSection ? "Edit Section" : "Add New Section"}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ET-KTE Section"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
            <input
              type="text"
              list="division-suggestions"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="e.g. JBP Division"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <datalist id="division-suggestions">
              {divisionSuggestions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-400 mt-1">Leave blank to keep this section as "Unassigned".</p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 shadow-sm">
              Save Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
