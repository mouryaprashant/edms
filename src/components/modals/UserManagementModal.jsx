import { useEffect, useMemo, useState } from "react";
import { manageUsers } from "../../utils/userManagement";

const ROLE_OPTIONS = ["viewer", "editor", "admin"];

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function RoleBadge({ role }) {
  const style = {
    admin: "bg-violet-50 text-violet-700 border-violet-200",
    editor: "bg-blue-50 text-blue-700 border-blue-200",
    viewer: "bg-slate-100 text-slate-700 border-slate-200",
  }[role] || "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${style}`}>{role}</span>;
}

export default function UserManagementModal({ open, onClose, onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [showPassword, setShowPassword] = useState(false);

  const activeCount = useMemo(() => users.filter((u) => !u.disabled).length, [users]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await manageUsers("list");
    setLoading(false);
    if (!result.ok) {
      onToast?.(result.error, true);
      return;
    }
    setUsers(result.data.users || []);
  };

  useEffect(() => {
    if (open) loadUsers();
  }, [open]);

  if (!open) return null;

  const createUser = async (event) => {
    event.preventDefault();
    setSavingId("create");
    const result = await manageUsers("create", { email, password, role });
    setSavingId(null);
    if (!result.ok) {
      onToast?.(result.error, true);
      return;
    }
    setEmail("");
    setPassword("");
    setRole("viewer");
    setCreateOpen(false);
    onToast?.("✓ User created successfully");
    loadUsers();
  };

  const changeRole = async (user, nextRole) => {
    if (nextRole === user.role) return;
    setSavingId(user.id);
    const result = await manageUsers("set_role", { userId: user.id, role: nextRole });
    setSavingId(null);
    if (!result.ok) {
      onToast?.(result.error, true);
      return;
    }
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role: nextRole } : item));
    onToast?.("✓ Role updated");
  };

  const toggleStatus = async (user) => {
    const nextDisabled = !user.disabled;
    if (!window.confirm(`${nextDisabled ? "Disable" : "Enable"} ${user.email}?`)) return;
    setSavingId(user.id);
    const result = await manageUsers("set_status", { userId: user.id, disabled: nextDisabled });
    setSavingId(null);
    if (!result.ok) {
      onToast?.(result.error, true);
      return;
    }
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, disabled: nextDisabled } : item));
    onToast?.(nextDisabled ? "User disabled" : "User enabled");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m8-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1v6m3-3h-6" /></svg>
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">User Management</h2>
                <p className="text-[11px] text-slate-500">Create users and manage Viewer, Editor and Admin access.</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label="Close">✕</button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-800">{users.length}</span> users
              <span className="text-slate-300">•</span>
              <span><span className="font-bold text-emerald-700">{activeCount}</span> active</span>
            </div>
            <button type="button" onClick={() => setCreateOpen((v) => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-slate-800">
              <span className="text-base leading-none">+</span> Add User
            </button>
          </div>

          {createOpen && (
            <form onSubmit={createUser} className="mt-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-[1.3fr_1fr_180px_auto] md:items-end">
              <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="user@office.com" /></label>
              <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Temporary password</span><div className="relative"><input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input pr-16" placeholder="Minimum 8 characters" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">{showPassword ? "Hide" : "Show"}</button></div></label>
              <label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Role</span><select value={role} onChange={(e) => setRole(e.target.value)} className="form-input"><option value="viewer">Viewer</option><option value="editor">Editor</option></select></label>
              <button disabled={savingId === "create"} type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-500 disabled:opacity-50">{savingId === "create" ? "Creating…" : "Create User"}</button>
            </form>
          )}
        </div>

        <div className="max-h-[58vh] overflow-auto">
          <table className="min-w-[760px] w-full text-left">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 sm:px-6">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Last sign in</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-xs text-slate-500">Loading users…</td></tr> : users.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-xs text-slate-500">No users found.</td></tr> : users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                  <td className="px-5 py-3 sm:px-6"><div className="font-bold text-sm text-slate-800">{user.email}</div><div className="mt-0.5 text-[10px] text-slate-400">Created {formatDate(user.created_at)}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><RoleBadge role={user.role} /><select disabled={savingId === user.id} value={user.role} onChange={(e) => changeRole(user, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 outline-none focus:border-blue-400"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.disabled ? "text-rose-600" : "text-emerald-700"}`}><span className={`h-2 w-2 rounded-full ${user.disabled ? "bg-rose-500" : "bg-emerald-500"}`} />{user.disabled ? "Disabled" : "Active"}</span></td>
                  <td className="px-4 py-3 text-right sm:px-6"><button disabled={savingId === user.id || user.role === "admin"} type="button" onClick={() => toggleStatus(user)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">{user.disabled ? "Enable" : "Disable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-[10px] leading-4 text-slate-500 sm:px-6">
          <strong className="text-slate-700">Security:</strong> user creation and role changes are performed by the protected Supabase Edge Function. The service-role key never reaches the browser. The last administrator cannot be removed through this screen.
        </div>
      </div>
    </div>
  );
}
