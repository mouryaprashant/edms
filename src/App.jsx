import { useEffect, useMemo, useRef, useState } from "react";
import { useRailwayData } from "./hooks/useRailwayData";
import { useAdmin } from "./hooks/useAdmin";

import Toast from "./components/Toast";
import TopNav from "./components/TopNav";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
import SectionCard from "./components/SectionCard";

import AdminAuthModal from "./components/modals/AdminAuthModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import SectionModal from "./components/modals/SectionModal";
import StationModal from "./components/modals/StationModal";
import VersionHistoryModal from "./components/modals/VersionHistoryModal";
import UserManagementModal from "./components/modals/UserManagementModal";
import DivisionModal from "./components/modals/DivisionModal";

export default function App() {
  const {
    sections,
    status,
    isSyncing,
    fetchData,
    saveSection,
    renameDivision,
    deleteSection,
    saveStation,
    deleteStation,
    moveStation,
    publishNewVersion,
  } = useRailwayData();
  const { isAuthenticated, isAdmin, canEdit, canDelete, role, userEmail, login, logout } = useAdmin();

  const [search, setSearch] = useState("");
  const [activeDivisionFilter, setActiveDivisionFilter] = useState("ALL");
  const [activeSectionFilter, setActiveSectionFilter] = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Station rows are collapsed by default; this tracks which ones are expanded.
  const [openStationIds, setOpenStationIds] = useState(() => new Set());

  const [toast, setToast] = useState({ message: "", isError: false, visible: false });
  const toastTimer = useRef(null);

  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null });
  const [versionModal, setVersionModal] = useState({ open: false, stationId: null, docId: null });
  const [sectionModal, setSectionModal] = useState({ open: false, editingId: null });
  const [divisionModal, setDivisionModal] = useState({ open: false, divisionName: "" });
  const [stationModal, setStationModal] = useState({ open: false, editingSectionId: null, editingStationId: null });

  const showToast = (message, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, isError, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  // ---------- derived / filtered data ----------
  const findStation = (stationId) => {
    for (const sec of sections) {
      const st = sec.stations.find((x) => x.id === stationId);
      if (st) return st;
    }
    return null;
  };

  const findStationAndDoc = (stationId, docId) => {
    const st = findStation(stationId);
    const doc = st?.docs.find((d) => d.id === docId) || null;
    return { station: st, doc };
  };

  const query = search.trim().toLowerCase();
  let totalStationsInFilter = 0;

  // Divisions present across all sections, with a count of sections in each —
  // used for the top-level division filter bar.
  const divisionOrder = [];
  const divisionCounts = {};
  sections.forEach((sec) => {
    const div = sec.division || "Unassigned";
    if (!(div in divisionCounts)) {
      divisionOrder.push(div);
      divisionCounts[div] = 0;
    }
    divisionCounts[div] += 1;
  });
  const divisions = divisionOrder.map((name) => ({ name, count: divisionCounts[name] }));

  // Sections within the currently selected division (or all of them) — this is
  // what the section pill bar below the division tabs should offer to filter by.
  const sectionsInActiveDivision = sections.filter((sec) => activeDivisionFilter === "ALL" || (sec.division || "Unassigned") === activeDivisionFilter);

  const visibleSections = sectionsInActiveDivision
    .filter((sec) => activeSectionFilter === "ALL" || activeSectionFilter === sec.id)
    .map((sec) => {
      totalStationsInFilter += sec.stations.length;
      const filteredStations = sec.stations.filter((st) => {
        const searchStr = `${st.name} ${st.code} ${st.zone} ${sec.name} ${st.docs.map((d) => `${d.label} ${d.version}`).join(" ")}`.toLowerCase();
        return searchStr.includes(query);
      });
      return { section: sec, filteredStations };
    })
    .filter(({ filteredStations }) => !query || filteredStations.length > 0);

  // When showing all divisions, group the rendered list under a division
  // heading so the Division → Section → Station hierarchy reads clearly.
  const groupedByDivision = [];
  if (activeDivisionFilter === "ALL") {
    const groups = new Map();
    visibleSections.forEach((item) => {
      const div = item.section.division || "Unassigned";
      if (!groups.has(div)) groups.set(div, []);
      groups.get(div).push(item);
    });
    divisionOrder.forEach((div) => {
      if (groups.has(div)) groupedByDivision.push({ division: div, items: groups.get(div) });
    });
  }

  const overallStatsText = `${sections.length} Sections | ${totalStationsInFilter} Total Stations`;

  // If the division a filter points to no longer exists (e.g. its last section was deleted), fall back to "All".
  useEffect(() => {
    if (activeDivisionFilter !== "ALL" && !divisions.some((d) => d.name === activeDivisionFilter)) {
      setActiveDivisionFilter("ALL");
    }
  }, [divisions, activeDivisionFilter]);

  // ---------- collapse handlers (station rows only — sections are no longer collapsible; navigation is via the sidebar) ----------
  const allStationIds = () => sections.flatMap((s) => s.stations.map((st) => st.id));

  const toggleStationOpen = (id) => {
    setOpenStationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenStationIds(new Set(allStationIds()));
  const collapseAll = () => setOpenStationIds(new Set());

  const handleDivisionSelect = (division) => {
    setActiveDivisionFilter(division);
    setActiveSectionFilter("ALL"); // section list changes meaning when the division changes
  };

  // Selecting a section directly (from the sidebar) also aligns the division
  // filter to that section's division, so sidebar highlighting stays consistent.
  const handleSelectSection = (sectionId, division) => {
    setActiveDivisionFilter(division || "ALL");
    setActiveSectionFilter(sectionId);
  };

  // ---------- admin ----------
  const handleAdminToggle = async () => {
    if (isAuthenticated) {
      await logout();
      showToast("Logged out");
    } else {
      setAdminAuthOpen(true);
    }
  };
  const handleAdminLoginSubmit = async (email, password) => {
    const res = await login(email, password);
    if (res.ok) {
      setAdminAuthOpen(false);
      showToast("✓ Admin Mode Unlocked!");
    }
    return res;
  };

  // ---------- sections ----------
  const openAddSection = () => setSectionModal({ open: true, editingId: null });
  const openRenameSection = (id) => setSectionModal({ open: true, editingId: id });
  const closeSectionModal = () => setSectionModal({ open: false, editingId: null });

  const openRenameDivision = (divisionName) => setDivisionModal({ open: true, divisionName });
  const closeDivisionModal = () => setDivisionModal({ open: false, divisionName: "" });

  const handleSaveDivision = async (newName) => {
    const oldName = divisionModal.divisionName;
    const res = await renameDivision(oldName, newName);
    if (res.ok) {
      closeDivisionModal();
      if (activeDivisionFilter === oldName) setActiveDivisionFilter(newName);
      showToast("✓ Division renamed!");
    } else {
      showToast("Failed to rename division: " + (res.error?.message || ""), true);
    }
  };

  const handleSaveSection = async (name, division, editingId) => {
    const res = await saveSection(name, division, editingId);
    if (res.ok) {
      closeSectionModal();
      showToast("✓ Section saved!");
    } else {
      showToast("Failed to save section: " + (res.error?.message || ""), true);
    }
  };

  const handleDeleteSection = (id) => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    const msg =
      sec.stations.length > 0
        ? `Delete section "${sec.name}" and all ${sec.stations.length} station(s) inside it?`
        : `Delete section "${sec.name}"?`;
    setConfirmState({
      open: true,
      title: "Delete Section",
      message: msg,
      onConfirm: async () => {
        setConfirmState((c) => ({ ...c, open: false }));
        const res = await deleteSection(id);
        if (res.ok) {
          if (activeSectionFilter === id) setActiveSectionFilter("ALL");
          showToast("✓ Section deleted!");
        } else {
          showToast("Failed to delete section", true);
        }
      },
    });
  };

  // ---------- stations ----------
  const openAddStation = (sectionId = null) => {
    if (sections.length === 0) {
      showToast("Please add at least one Section before adding stations!", true);
      openAddSection();
      return;
    }
    setStationModal({ open: true, editingSectionId: sectionId, editingStationId: null });
  };
  const openEditStation = (sectionId, stationId) => setStationModal({ open: true, editingSectionId: sectionId, editingStationId: stationId });
  const closeStationModal = () => setStationModal({ open: false, editingSectionId: null, editingStationId: null });

  const handleSaveStation = async (payload) => {
    const res = await saveStation(payload);
    if (res.ok) {
      closeStationModal();
      showToast("✓ Station saved!");
    } else {
      showToast("Failed to save station: " + (res.error?.message || ""), true);
    }
  };

  const handleDeleteStation = (sectionId, stationId) => {
    const st = findStation(stationId);
    if (!st) return;
    setConfirmState({
      open: true,
      title: "Delete Station",
      message: `Delete station "${st.name}" (${st.code})?`,
      onConfirm: async () => {
        setConfirmState((c) => ({ ...c, open: false }));
        const res = await deleteStation(stationId);
        showToast(res.ok ? "✓ Station deleted!" : "Failed to delete station", !res.ok);
      },
    });
  };

  const handleMoveStation = async (sectionId, stationId, direction) => {
    const res = await moveStation(sectionId, stationId, direction);
    if (!res.ok && res.error) showToast("Failed to update position", true);
  };

  // ---------- version history ----------
  const openVersionHistory = (stationId, docId) => setVersionModal({ open: true, stationId, docId });
  const closeVersionHistory = () => setVersionModal({ open: false, stationId: null, docId: null });

  const handlePublishNewVersion = async ({ tag, url, note }) => {
    const { stationId, docId } = versionModal;
    const res = await publishNewVersion(stationId, docId, { tag, url, note });
    if (res.ok) {
      closeVersionHistory();
      showToast("✓ New Revision Published Successfully!");
    } else {
      showToast("Failed to update revision: " + (res.error?.message || ""), true);
    }
  };

  const { station: versionStation, doc: versionDoc } = findStationAndDoc(versionModal.stationId, versionModal.docId);
  const editingSectionForModal = sections.find((s) => s.id === sectionModal.editingId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      <Toast message={toast.message} isError={toast.isError} visible={toast.visible} />

      <TopNav
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        role={role}
        userEmail={userEmail}
        onAdminToggle={handleAdminToggle}
        search={search}
        onSearchChange={setSearch}
        onToggleSidebar={() => setSidebarOpen(true)}
        onOpenUserManagement={() => setUserManagementOpen(true)}
      />

      <Toolbar
        status={status}
        isSyncing={isSyncing}
        isAdmin={isAdmin}
        canEdit={canEdit}
        onRefresh={() => fetchData()}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onAddSection={openAddSection}
        onAddStation={() => openAddStation()}
        overallStatsText={overallStatsText}
      />

      <div className="flex-1 flex min-h-0 w-full">
        <Sidebar
          sections={sections}
          divisions={divisions}
          activeDivisionFilter={activeDivisionFilter}
          activeSectionFilter={activeSectionFilter}
          onSelectDivision={handleDivisionSelect}
          onSelectSection={handleSelectSection}
          canEdit={canEdit}
          canDelete={canDelete}
          onEditSection={openRenameSection}
          onRenameDivision={openRenameDivision}
          onDeleteSection={handleDeleteSection}
          onAddStationToSection={openAddStation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="app-grid flex-1 min-w-0 p-3 sm:p-5 lg:p-6 space-y-5">
          {(status.state === "error" || status.state === "unconfigured") && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex justify-between items-center font-medium">
              <span>{status.message}</span>
              <button onClick={() => fetchData()} className="underline font-bold hover:text-amber-950">
                Retry Connection
              </button>
            </div>
          )}

          {sections.length === 0 && status.state === "ready" ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">No Sections Available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">There are currently no sections in the directory.</p>
              {canEdit && (
                <button
                  type="button"
                  onClick={openAddSection}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5 shadow"
                >
                  + Add First Section
                </button>
              )}
            </div>
          ) : activeDivisionFilter === "ALL" ? (
            groupedByDivision.map(({ division, items }) => (
              <div key={division} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{division}</span>
                  <div className="flex-1 h-px bg-slate-300" />
                </div>
                <div className="space-y-4">
                  {items.map(({ section, filteredStations }) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      filteredStations={filteredStations}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEditStation={openEditStation}
                      onDeleteStation={handleDeleteStation}
                      onMoveStation={handleMoveStation}
                      onViewHistory={openVersionHistory}
                      openStationIds={openStationIds}
                      onToggleStation={toggleStationOpen}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            visibleSections.map(({ section, filteredStations }) => (
              <SectionCard
                key={section.id}
                section={section}
                filteredStations={filteredStations}
                canEdit={canEdit}
                canDelete={canDelete}
                onEditStation={openEditStation}
                onDeleteStation={handleDeleteStation}
                onMoveStation={handleMoveStation}
                onViewHistory={openVersionHistory}
                openStationIds={openStationIds}
                onToggleStation={toggleStationOpen}
              />
            ))
          )}
        </main>
      </div>

      <VersionHistoryModal
        open={versionModal.open}
        station={versionStation}
        doc={versionDoc}
        canEdit={canEdit}
        onClose={closeVersionHistory}
        onPublish={handlePublishNewVersion}
      />

      <AdminAuthModal open={adminAuthOpen} onClose={() => setAdminAuthOpen(false)} onSubmit={handleAdminLoginSubmit} />

      <UserManagementModal open={userManagementOpen && isAdmin} onClose={() => setUserManagementOpen(false)} onToast={showToast} />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((c) => ({ ...c, open: false }))}
        onConfirm={() => confirmState.onConfirm && confirmState.onConfirm()}
      />

      <DivisionModal
        open={divisionModal.open}
        divisionName={divisionModal.divisionName}
        sectionCount={sections.filter((s) => (s.division || "Unassigned") === divisionModal.divisionName).length}
        onClose={closeDivisionModal}
        onSave={handleSaveDivision}
      />

      <SectionModal open={sectionModal.open} editingSection={editingSectionForModal} allSections={sections} onClose={closeSectionModal} onSave={handleSaveSection} />

      <StationModal
        open={stationModal.open}
        sections={sections}
        editingSectionId={stationModal.editingSectionId}
        editingStationId={stationModal.editingStationId}
        onClose={closeStationModal}
        onSave={handleSaveStation}
        onNeedsSectionFirst={() => {
          closeStationModal();
          showToast("Please add at least one Section before adding stations!", true);
          openAddSection();
        }}
      />
    </div>
  );
}
