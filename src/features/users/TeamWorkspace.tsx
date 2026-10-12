"use client";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/crm-auth";

type Team = { id: number; name: string };
type User = { id: number; name: string; email: string; role: Role; teamId: number | null; teamName: string | null; isActive: number };

export default function TeamWorkspace({ role }: { role: Role }) {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [notice, setNotice] = useState("");
  const [teamName, setTeamName] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales_executive" as Role, teamId: "" });
  const load = async () => {
    const [u, t] = await Promise.all([fetch("/api/users"), fetch("/api/teams")]);
    const uj = await u.json(); const tj = await t.json();
    if (!u.ok) throw new Error(uj.error || "Could not load users.");
    if (!t.ok) throw new Error(tj.error || "Could not load teams.");
    setUsers(uj); setTeams(tj);
  };
  useEffect(() => { load().catch(e => setNotice(e.message)); }, []);
  async function submitUser(e: React.FormEvent) {
    e.preventDefault(); setNotice("");
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json(); if (!response.ok) { setNotice(result.error || "Could not create account."); return; }
    setForm({ name: "", email: "", password: "", role: "sales_executive", teamId: "" }); setNotice("Account created."); await load();
  }
  async function createTeam(e: React.FormEvent) {
    e.preventDefault(); const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teamName }) });
    const result = await response.json(); if (!response.ok) { setNotice(result.error || "Could not create team."); return; }
    setTeamName(""); setNotice("Team created."); await load();
  }
  async function toggle(user: User) {
    const response = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !user.isActive }) });
    const result = await response.json(); if (!response.ok) { setNotice(result.error || "Could not update account."); return; }
    await load();
  }
  return <div className="space-y-6">
    <header><p className="text-sm font-medium text-brand-500">Access management</p><h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{role === "super_admin" ? "Teams and users" : "My team"}</h1><p className="mt-1 text-sm text-gray-500">{role === "super_admin" ? "Create teams and control account roles." : "Manage the Sales Executives in your team."}</p></header>
    {notice && <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">{notice}</p>}
    {role === "super_admin" && <form onSubmit={createTeam} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"><input required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="New team name" className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"/><button className="rounded-lg bg-brand-500 px-4 text-sm font-medium text-white">Create team</button></form>}
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"><h2 className="font-semibold">Create account</h2><form onSubmit={submitUser} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"/><input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"/><input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"/><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role, teamId: e.target.value === "super_admin" ? "" : form.teamId })} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400">{role === "super_admin" && <><option value="super_admin">SuperAdmin</option><option value="admin">Admin</option></>}<option value="sales_executive">Sales Executive</option></select><select required={form.role !== "super_admin"} disabled={form.role === "super_admin"} value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"><option value="">Choose team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white md:col-span-2 xl:col-span-5">Create account</button></form></section>
    <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400"><tr>{["Name", "Email", "Role", "Team", "Status", "Action"].map(x => <th key={x} className="px-4 py-3 text-gray-700 dark:text-gray-200">{x}</th>)}</tr></thead><tbody>{users.map(u => <tr key={u.id} className="border-b border-gray-100 text-gray-700 last:border-0 dark:border-gray-800 dark:text-gray-200"><td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.name}</td><td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.email}</td><td className="px-4 py-3 text-gray-700 dark:text-gray-200">{{ super_admin: "SuperAdmin", admin: "Admin", sales_executive: "Sales Executive" }[u.role]}</td><td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.teamName || "—"}</td><td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-gray-700 dark:text-gray-200"><button onClick={() => toggle(u)} className="font-medium text-brand-600">{u.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></section>
  </div>;
}


