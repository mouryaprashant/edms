import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { normalizeDoc } from "../utils/normalize";

// status.state: "unconfigured" | "loading" | "ready" | "error"
export function useRailwayData() {
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState({ state: "loading", message: "Connecting to database..." });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus({
        state: "unconfigured",
        message:
          "Supabase setup required: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
      });
      return { ok: false };
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .select("*, stations(*)")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((sec) => ({
        id: sec.id,
        name: sec.name,
        division: sec.division || "Unassigned",
        stations: (sec.stations || [])
          .slice()
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map((st) => ({
            id: st.id,
            name: st.name,
            code: st.code,
            zone: st.zone,
            docs: (st.docs || []).map(normalizeDoc),
            display_order: st.display_order || 0,
          })),
      }));

      setSections(mapped);
      setStatus({ state: "ready", message: "Database Ready" });
      return { ok: true };
    } catch (err) {
      setStatus({ state: "error", message: err.message || "Failed to load." });
      return { ok: false, error: err };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSection = useCallback(
    async (name, division, editingId) => {
      if (!supabase) return { ok: false };
      const payload = { name, division: division || "Unassigned" };
      const query = editingId
        ? supabase.from("sections").update(payload).eq("id", editingId)
        : supabase.from("sections").insert([payload]);
      const { error } = await query;
      if (error) return { ok: false, error };
      await fetchData();
      return { ok: true };
    },
    [fetchData]
  );

  const deleteSection = useCallback(
    async (id) => {
      if (!supabase) return { ok: false };
      const { error } = await supabase.from("sections").delete().eq("id", id);
      if (error) return { ok: false, error };
      await fetchData();
      return { ok: true };
    },
    [fetchData]
  );

  const saveStation = useCallback(
    async ({ editingStationId, sectionId, name, code, zone, docs, position }) => {
      if (!supabase) return { ok: false };
      const targetSec = sections.find((s) => s.id === sectionId);
      let order = 0;

      if (position === "KEEP" && editingStationId) {
        // Leave the station's existing order untouched — this is the default
        // when just editing details, so a save doesn't silently reshuffle rows.
        const current = targetSec?.stations.find((st) => st.id === editingStationId);
        order = current ? current.display_order ?? 0 : 0;
      } else if (position === "START") {
        order = 0;
      } else if (position?.startsWith("AFTER_")) {
        const afterId = position.replace("AFTER_", "");
        const afterIdx = targetSec ? targetSec.stations.findIndex((st) => st.id === afterId) : -1;
        order = afterIdx !== -1 ? (targetSec.stations[afterIdx].display_order || 0) + 1 : 999;
      } else {
        order =
          targetSec && targetSec.stations.length > 0
            ? Math.max(...targetSec.stations.map((s) => s.display_order || 0)) + 1
            : 0;
      }

      const payload = { section_id: sectionId, name, code, zone, docs, display_order: order };
      const query = editingStationId
        ? supabase.from("stations").update(payload).eq("id", editingStationId)
        : supabase.from("stations").insert([payload]);

      const { error } = await query;
      if (error) return { ok: false, error };
      await fetchData();
      return { ok: true };
    },
    [sections, fetchData]
  );

  const deleteStation = useCallback(
    async (id) => {
      if (!supabase) return { ok: false };
      const { error } = await supabase.from("stations").delete().eq("id", id);
      if (error) return { ok: false, error };
      await fetchData();
      return { ok: true };
    },
    [fetchData]
  );

  const moveStation = useCallback(
    async (sectionId, stationId, direction) => {
      if (!supabase) return { ok: false };
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec) return { ok: false };

      const idx = sec.stations.findIndex((st) => st.id === stationId);
      if (idx === -1) return { ok: false };

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sec.stations.length) return { ok: false };

      const current = sec.stations[idx];
      const target = sec.stations[targetIdx];
      const currentOrder = current.display_order ?? idx;
      const targetOrder = target.display_order ?? targetIdx;

      try {
        await Promise.all([
          supabase.from("stations").update({ display_order: targetOrder }).eq("id", current.id),
          supabase.from("stations").update({ display_order: currentOrder }).eq("id", target.id),
        ]);
        await fetchData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error };
      }
    },
    [sections, fetchData]
  );

  const publishNewVersion = useCallback(
    async (stationId, docId, { tag, url, note }) => {
      if (!supabase) return { ok: false };
      let targetSt = null;
      sections.forEach((sec) => {
        const st = sec.stations.find((x) => x.id === stationId);
        if (st) targetSt = st;
      });
      if (!targetSt) return { ok: false };

      const updatedDocs = targetSt.docs.map((doc) => {
        if (doc.id !== docId) return doc;
        const archivedEntry = {
          version: doc.version,
          url: doc.url,
          updated_at: doc.last_updated,
          note: note || "Replaced by newer revision",
        };
        return {
          ...doc,
          version: tag,
          url,
          last_updated: new Date().toISOString().split("T")[0],
          history: [...(doc.history || []), archivedEntry],
        };
      });

      const { error } = await supabase.from("stations").update({ docs: updatedDocs }).eq("id", stationId);
      if (error) return { ok: false, error };
      await fetchData();
      return { ok: true };
    },
    [sections, fetchData]
  );

  return {
    sections,
    status,
    isSyncing,
    fetchData,
    saveSection,
    deleteSection,
    saveStation,
    deleteStation,
    moveStation,
    publishNewVersion,
  };
}
