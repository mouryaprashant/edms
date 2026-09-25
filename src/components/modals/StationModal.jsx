import { useEffect, useMemo, useRef, useState } from "react";
import { makeId, DEFAULT_DOC_CATEGORIES, DEFAULT_DOCUMENT_NAMES } from "../../utils/normalize";
import { uploadDocumentToDrive } from "../../utils/googleDrive";
import { isSafeDocumentUrl } from "../../utils/urlSecurity";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GDRIVE_ROOT_FOLDER_ID = import.meta.env.VITE_GDRIVE_ROOT_FOLDER_ID || "";
const DRIVE_UPLOAD_CONFIGURED = Boolean(GOOGLE_CLIENT_ID && GDRIVE_ROOT_FOLDER_ID);

function defaultDocRows() {
  return [
    { rowId: makeId("row"), id: makeId("doc"), label: "SIP", description: "", category: "Plans", url: "", version: "Alt-A", history: [] },
    { rowId: makeId("row"), id: makeId("doc"), label: "ESP", description: "", category: "Plans", url: "", version: "Alt-A", history: [] },
    { rowId: makeId("row"), id: makeId("doc"), label: "RSP", description: "", category: "Plans", url: "", version: "Alt-A", history: [] },
  ];
}

export default function StationModal({ open, sections, editingSectionId, editingStationId, onClose, onSave, onNeedsSectionFirst }) {
  const [sectionId, setSectionId] = useState("");
  const [position, setPosition] = useState("END");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zone, setZone] = useState("");
  const [docRows, setDocRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({}); // rowId -> { state: 'uploading'|'error', message }
  const fileInputRef = useRef(null);
  const pendingUploadRowId = useRef(null);

  const editingStation = useMemo(() => {
    if (!editingStationId) return null;
    for (const sec of sections) {
      const st = sec.stations.find((x) => x.id === editingStationId);
      if (st) return st;
    }
    return null;
  }, [sections, editingStationId]);

  useEffect(() => {
    if (!open) return;

    if (sections.length === 0) {
      onNeedsSectionFirst();
      return;
    }

    if (editingStation) {
      // find the section that owns this station
      const owningSection = sections.find((s) => s.stations.some((st) => st.id === editingStationId));
      setSectionId(owningSection?.id || editingSectionId || sections[0].id);
      // Default to leaving the station where it is — only recompute order if
      // the admin explicitly picks a different position below.
      setPosition("KEEP");
      setName(editingStation.name);
      setCode(editingStation.code);
      setZone(editingStation.zone || "");
      setDocRows(
        editingStation.docs.length > 0
          ? editingStation.docs.map((d) => ({
              rowId: makeId("row"),
              id: d.id,
              label: d.label,
              description: d.description || "",
              category: d.category || "General",
              url: d.url,
              version: d.version,
              last_updated: d.last_updated,
              history: d.history,
            }))
          : defaultDocRows()
      );
    } else {
      setSectionId(editingSectionId || sections[0].id);
      setPosition("END");
      setName("");
      setCode("");
      setZone("");
      setDocRows(defaultDocRows());
    }
  }, [open, editingStation, editingSectionId, editingStationId, sections, onNeedsSectionFirst]);

  // Which section currently owns the station being edited (before any section change in the form).
  const owningSectionId = useMemo(() => {
    if (!editingStationId) return null;
    return sections.find((s) => s.stations.some((st) => st.id === editingStationId))?.id || null;
  }, [sections, editingStationId]);

  const positionOptions = useMemo(() => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return [];
    const opts = [];
    // "Keep current position" only makes sense if we're still in the station's original section.
    if (editingStationId && sectionId === owningSectionId) {
      opts.push({ value: "KEEP", label: "Keep current position (no reordering)" });
    }
    opts.push({ value: "END", label: "At the end of section" });
    opts.push({ value: "START", label: "At the beginning of section" });
    sec.stations.forEach((st) => {
      if (st.id !== editingStationId) {
        opts.push({ value: `AFTER_${st.id}`, label: `Insert after ${st.name} (${st.code})` });
      }
    });
    return opts;
  }, [sections, sectionId, editingStationId, owningSectionId]);

  // If the admin switches sections (so "Keep current position" no longer applies)
  // and the current selection isn't valid anymore, fall back to a sane default.
  useEffect(() => {
    if (positionOptions.length > 0 && !positionOptions.some((o) => o.value === position)) {
      setPosition(positionOptions[0].value);
    }
  }, [positionOptions, position]);

  // Category suggestions: presets plus any custom categories already used elsewhere in the directory.
  const categorySuggestions = useMemo(() => {
    const set = new Set(DEFAULT_DOC_CATEGORIES);
    sections.forEach((s) => s.stations.forEach((st) => st.docs.forEach((d) => set.add(d.category || ""))));
    return Array.from(set).filter(Boolean);
  }, [sections]);

  if (!open) return null;

  const updateRow = (rowId, field, value) => {
    setDocRows((rows) => rows.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  };

  const removeRow = (rowId) => {
    setDocRows((rows) => rows.filter((r) => r.rowId !== rowId));
  };

  const addRow = () => {
    setDocRows((rows) => [...rows, { rowId: makeId("row"), id: makeId("doc"), label: "", description: "", category: "Plans", url: "", version: "Alt-A", history: [] }]);
  };

  const triggerUpload = (rowId) => {
    pendingUploadRowId.current = rowId;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const rowId = pendingUploadRowId.current;
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !rowId) return;

    setUploadStatus((s) => ({ ...s, [rowId]: { state: "uploading", message: "Starting..." } }));
    try {
      const { url } = await uploadDocumentToDrive({
        clientId: GOOGLE_CLIENT_ID,
        rootFolderId: GDRIVE_ROOT_FOLDER_ID,
        stationCode: code,
        file,
        onStatus: (message) => setUploadStatus((s) => ({ ...s, [rowId]: { state: "uploading", message } })),
      });
      updateRow(rowId, "url", url);
      setUploadStatus((s) => ({ ...s, [rowId]: { state: "done", message: "Uploaded" } }));
      setTimeout(() => setUploadStatus((s) => ({ ...s, [rowId]: undefined })), 2500);
    } catch (err) {
      setUploadStatus((s) => ({ ...s, [rowId]: { state: "error", message: err.message || "Upload failed" } }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const invalidUrl = docRows.some((r) => r.url.trim() && !isSafeDocumentUrl(r.url.trim()));
    if (invalidUrl) {
      alert("Please enter only valid HTTP/HTTPS document URLs.");
      return;
    }
    const docs = docRows
      .filter((r) => r.label.trim() || r.url.trim())
      .map((r) => {
        const trimmedUrl = r.url.trim();
        const trimmedVersion = r.version.trim() || "Alt-A";
        const original = editingStation?.docs.find((d) => d.id === r.id);
        // Only stamp today's date if this document is new, or its version/URL
        // actually changed — editing an unrelated field (label, category) or
        // just re-saving the form shouldn't bump every document's "Updated" date.
        const changed = !original || original.version !== trimmedVersion || original.url !== trimmedUrl;
        return {
          id: r.id,
          label: r.label.trim() || "Document",
          description: r.description?.trim() || "",
          category: r.category?.trim() || "General",
          url: trimmedUrl,
          version: trimmedVersion,
          last_updated: changed ? today : original.last_updated,
          history: r.history || [],
        };
      });

    onSave({
      editingStationId: editingStationId || null,
      sectionId,
      name: name.trim(),
      code: code.trim(),
      zone: zone.trim(),
      docs,
      position,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel modal-panel-lg max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{editingStationId ? "Edit Station Details" : "Add New Station"}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Section *</label>
              <select
                required
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Geographical Position *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {positionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Station Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SGO"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Station Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saugor"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zone / Division</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="e.g. West Central Railway"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Station Documents (with Category, Version &amp; Drive Link)</p>
              <button
                type="button"
                onClick={addRow}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Another Document
              </button>
            </div>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileSelected} />
              {/* Presets are offered through native dropdowns; selecting Custom opens a free-text field. */}
              {docRows.map((row) => {
                const status = uploadStatus[row.rowId];
                return (
                  <div key={row.rowId} className="doc-input-row space-y-1">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Document</label>
                          <select
                            value={DEFAULT_DOCUMENT_NAMES.includes(row.label) ? row.label : "__CUSTOM__"}
                            onChange={(e) => updateRow(row.rowId, "label", e.target.value === "__CUSTOM__" ? "" : e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            {DEFAULT_DOCUMENT_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                            <option value="__CUSTOM__">Custom name...</option>
                          </select>
                          {!DEFAULT_DOCUMENT_NAMES.includes(row.label) && (
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => updateRow(row.rowId, "label", e.target.value)}
                              placeholder="Enter custom document name"
                              className="mt-1.5 w-full px-2.5 py-1.5 border border-blue-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30"
                              autoFocus={row.label === ""}
                            />
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Description</label>
                          <input
                            type="text"
                            value={row.description || ""}
                            onChange={(e) => updateRow(row.rowId, "description", e.target.value)}
                            placeholder="Short description"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Category</label>
                          <select
                            value={DEFAULT_DOC_CATEGORIES.includes(row.category) ? row.category : "__CUSTOM__"}
                            onChange={(e) => updateRow(row.rowId, "category", e.target.value === "__CUSTOM__" ? "" : e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            {DEFAULT_DOC_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="__CUSTOM__">Custom name...</option>
                          </select>
                          {!DEFAULT_DOC_CATEGORIES.includes(row.category) && (
                            <input
                              type="text"
                              value={row.category || ""}
                              onChange={(e) => updateRow(row.rowId, "category", e.target.value)}
                              placeholder="Enter custom category"
                              className="mt-1.5 w-full px-2.5 py-1.5 border border-blue-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30"
                            />
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Revision</label>
                          <input
                            type="text"
                            value={row.version}
                            onChange={(e) => updateRow(row.rowId, "version", e.target.value)}
                            placeholder="Alt-A"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="url"
                          value={row.url}
                          onChange={(e) => updateRow(row.rowId, "url", e.target.value)}
                          placeholder="Google Drive URL"
                          className="w-full flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => triggerUpload(row.rowId)}
                          disabled={!DRIVE_UPLOAD_CONFIGURED || status?.state === "uploading"}
                          title={DRIVE_UPLOAD_CONFIGURED ? "Upload a PDF to Google Drive and fill in the link automatically" : "Google Drive upload not configured"}
                          className="w-full sm:w-auto whitespace-nowrap flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-md border border-emerald-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M7 10l5-5 5 5M12 5v12" />
                          </svg>
                          {status?.state === "uploading" ? "Uploading..." : "Upload"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row.rowId)}
                          title="Remove Document"
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {status && (
                      <p className={`text-[11px] pl-1 ${status.state === "error" ? "text-rose-600" : "text-slate-500"}`}>
                        {status.state === "error" ? `⚠ ${status.message}` : status.message}
                      </p>
                    )}
                  </div>
                );
              })}
              {!DRIVE_UPLOAD_CONFIGURED && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                  Direct Drive upload isn't configured yet — set VITE_GOOGLE_CLIENT_ID and VITE_GDRIVE_ROOT_FOLDER_ID in
                  your .env to enable it. Manual URL entry still works.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">
              Save Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
