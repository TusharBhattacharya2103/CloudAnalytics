"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lead } from "@/features/leads/types";
import type { Opportunity } from "@/features/opportunities/types";

export default function DashboardWorkspace({ role, name }: { role: string; name: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([fetch("/api/leads"), fetch("/api/opportunities")]).then(async ([l, o]) => { const lj = await l.json(); const oj = await o.json(); if (!l.ok) throw new Error(lj.error || "Could not load leads."); if (!o.ok) throw new Error(oj.error || "Could not load opportunities."); setLeads(lj); setOpportunities(oj); }).catch(e => setError(e.message)); }, []);
  const active = opportunities.filter(x => !["L6 - Closed", "L7 - Lost"].includes(x.stage));
  const upcoming = opportunities.filter(x => x.nextFollowUpDate && new Date(x.nextFollowUpDate) <= new Date(Date.now() + 7 * 86400000));
  const cards = [["Leads", leads.length], ["Qualified leads", leads.filter(x => x.status === "Qualified").length], ["Open opportunities", active.length], ["Pipeline value", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(active.reduce((n, x) => n + x.dealValue, 0))], ["Follow-ups this week", upcoming.length]];
  return <div className="space-y-6"><header><p className="text-sm font-medium text-brand-500">{role.replaceAll("_", " ")}</p><h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {name}</h1><p className="mt-1 text-sm text-gray-500">Your CRM summary reflects the records you’re allowed to access.</p></header>{error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label,value]) => <article key={String(label)} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p></article>)}</section><section className="flex flex-wrap gap-3"><Link className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white" href="/leads">View leads</Link><Link className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium" href="/opportunities">View pipeline</Link></section></div>;
}
