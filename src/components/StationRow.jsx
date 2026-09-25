import { useEffect, useMemo, useState } from "react";
import DocBadge from "./DocBadge";

export default function StationRow({ station, index, isFirst, isLast, canEdit, canDelete, isOpen, onToggle, onViewHistory, onEdit, onDelete, onMove }) {
  const docCount = station.docs.length;
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = useMemo(() => [...new Set(station.docs.map((d) => d.category || "General"))], [station.docs]);
  useEffect(() => { if (!isOpen) setActiveCategory("All"); else if (activeCategory !== "All" && !categories.includes(activeCategory)) setActiveCategory("All"); }, [isOpen, categories, activeCategory]);
  const visibleDocs = activeCategory === "All" ? station.docs : station.docs.filter((d) => (d.category || "General") === activeCategory);

  return <>
    <tr className="group cursor-pointer transition-colors hover:bg-blue-50/35" onClick={() => onToggle(station.id)}>
      <td className="px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${isOpen ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-400 group-hover:border-blue-200"}`}><svg className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" /></svg></span>
          <span className="w-5 text-[10px] font-bold text-slate-300">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0"><div className="truncate text-xs font-extrabold text-slate-800 sm:text-sm">{station.name}</div><div className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{station.zone || "Indian Railways"}</div></div>
        </div>
      </td>
      <td className="px-5 py-4 sm:px-6"><span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-extrabold tracking-wide text-slate-700">{station.code.toUpperCase()}</span></td>
      <td className="px-5 py-4 sm:px-6">{docCount ? <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{docCount} document{docCount !== 1 ? "s" : ""}</span> : <span className="text-[10px] italic text-slate-400">No documents linked</span>}</td>
      {canEdit && <td className="px-5 py-4 text-right sm:px-6" onClick={(e) => e.stopPropagation()}><div className="inline-flex items-center gap-1.5 opacity-80 transition group-hover:opacity-100">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm"><button type="button" disabled={isFirst} onClick={() => onMove(station.id, "up")} className="rounded-l-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:text-slate-200" title="Move up">↑</button><button type="button" disabled={isLast} onClick={() => onMove(station.id, "down")} className="rounded-r-lg border-l border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:text-slate-200" title="Move down">↓</button></div>
        <button type="button" onClick={() => onEdit(station.id)} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-100">Edit</button>
        {canDelete && <button type="button" onClick={() => onDelete(station.id)} className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 text-[10px] font-extrabold text-rose-600 hover:bg-rose-100" title="Delete station">Delete</button>}
      </div></td>}
    </tr>
    {isOpen && <tr className="bg-slate-50/75"><td colSpan={canEdit ? 4 : 3} className="px-5 pb-5 pt-1 sm:px-6">
      <div className="ml-10 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Linked documents</div><div className="mt-0.5 text-xs font-bold text-slate-700">{station.name} <span className="font-normal text-slate-400">· {docCount} total</span></div></div>{categories.length > 1 && <div className="flex flex-wrap gap-1">{["All", ...categories].map((cat) => <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>{cat}{cat === "All" ? ` (${docCount})` : ` (${station.docs.filter((d) => (d.category || "General") === cat).length})`}</button>)}</div>}</div>
        {docCount === 0 ? <p className="py-3 text-center text-xs italic text-slate-400">No documents linked to this station yet.</p> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><div className="min-w-[960px]"><div className="grid grid-cols-[minmax(0,1.45fr)_minmax(140px,1.2fr)_90px_minmax(90px,0.8fr)_minmax(130px,1fr)_auto] gap-3 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400 sm:px-4"><div>Document</div><div>Description</div><div>Revision</div><div>Category</div><div>Last Updated</div><div className="text-right">Actions</div></div>{visibleDocs.map((d) => <DocBadge key={d.id} doc={d} onViewHistory={() => onViewHistory(station.id, d.id)} />)}</div></div>}
      </div>
    </td></tr>}
  </>;
}
