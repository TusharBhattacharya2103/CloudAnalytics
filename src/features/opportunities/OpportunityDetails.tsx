"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LOST_REASONS, PIPELINE_STAGES, type Opportunity, type Stage } from "./types";
import { getOpportunity, stale, updateOpportunity } from "./store";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const date = (value?: string) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not set";
const input = "mt-1.5 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900";

export default function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [item, setItem] = useState<Opportunity>();
  const [notice, setNotice] = useState("");
  const [lost, setLost] = useState(false);
  const [reason, setReason] = useState("");
  const [nextStage, setNextStage] = useState<Stage>();
  const [savingStage, setSavingStage] = useState(false);

  useEffect(() => {
    const requestedStage = params.get("stage");
    getOpportunity(id).then((found) => {
      setItem(found);
      if (["L3 - Demo", "L4 - Proposal", "L5 - Negotiation", "L6 - Closed"].includes(requestedStage || "")) setNextStage(requestedStage as Stage);
      if (requestedStage === "L7 - Lost") setLost(true);
    }).catch((error) => setNotice(error.message));
    if (params.get("created")) setNotice("Opportunity created successfully and added to L1 - Prospects.");
  }, [id, params]);

  if (!item) return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">Loading opportunity…</div>;
  const currentItem = item;

  async function saveStageDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !nextStage) return;
    const form = new FormData(event.currentTarget);
    const details: Partial<Opportunity> = {};
    if (nextStage === "L3 - Demo") {
      details.demoDate = String(form.get("demoDate") || "");
      details.demoTime = String(form.get("demoTime") || "");
      details.demoNotes = String(form.get("demoNotes") || "");
    } else if (nextStage === "L4 - Proposal") {
      details.proposalAmount = Number(form.get("proposalAmount"));
      details.proposalSentDate = String(form.get("proposalSentDate") || "");
      details.proposalReference = String(form.get("proposalReference") || "");
      details.proposalNotes = String(form.get("proposalNotes") || "");
    } else if (nextStage === "L5 - Negotiation") {
      details.negotiationStartDate = String(form.get("negotiationStartDate") || "");
      details.negotiationNotes = String(form.get("negotiationNotes") || "");
    } else if (nextStage === "L6 - Closed") {
      details.closedDate = String(form.get("closedDate") || "");
      details.closedAmount = Number(form.get("closedAmount"));
      details.closedNotes = String(form.get("closedNotes") || "");
    }
    setSavingStage(true);
    const message = `Stage changed to ${nextStage}`;
    try {
      const updated = await updateOpportunity(item.id, { ...details, stage: nextStage, activity: { type: "stage_change", message } });
      const activity = { id: crypto.randomUUID(), type: "stage" as const, message, at: new Date().toISOString(), by: item.ownerName };
      setItem({ ...updated, activities: [activity, ...item.activities] });
      setNotice(`${message}. Details saved and added to the activity timeline.`);
      setNextStage(undefined);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update the opportunity stage.");
    } finally {
      setSavingStage(false);
    }
  }

  async function saveDirectStage(stage: Stage) {
    if (stage === currentItem.stage) return;
    const message = `Stage changed to ${stage}`;
    try {
      const updated = await updateOpportunity(currentItem.id, { stage, activity: { type: "stage_change", message } });
      const activity = { id: crypto.randomUUID(), type: "stage" as const, message, at: new Date().toISOString(), by: currentItem.ownerName };
      setItem({ ...updated, activities: [activity, ...currentItem.activities] });
      setNotice(`${message}. Activity timeline updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update opportunity stage.");
    }
  }

  async function confirmLost() {
    if (!reason) return;
    const message = `Opportunity marked lost: ${reason}`;
    try {
      const updated = await updateOpportunity(currentItem.id, { stage: "L7 - Lost", lostReason: reason, activity: { type: "lost", message } });
      const activity = { id: crypto.randomUUID(), type: "stage" as const, message, at: new Date().toISOString(), by: currentItem.ownerName };
      setItem({ ...updated, activities: [activity, ...currentItem.activities] });
      setNotice("Opportunity marked lost.");
      setLost(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update opportunity.");
    }
  }

  const stageSummary = item.stage === "L3 - Demo" ? `Demo: ${item.demoDate ? `${date(item.demoDate)} at ${item.demoTime || "time not set"}` : "Not scheduled"}`
    : item.stage === "L4 - Proposal" ? `Proposal: ${item.proposalAmount ? money(item.proposalAmount) : "Amount not set"}`
    : item.stage === "L5 - Negotiation" ? `Negotiation started: ${date(item.negotiationStartDate)}`
    : item.stage === "L6 - Closed" ? `Closed: ${item.closedAmount ? money(item.closedAmount) : "Amount not set"}`
    : item.stage === "L7 - Lost" ? `Lost: ${item.lostReason || "Reason not set"}` : "No stage details yet";

  return <div className="space-y-6">
    {notice && <div role="status" className="flex justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
    <div className="flex items-center gap-3 text-sm text-gray-500"><Link href="/opportunities" className="hover:text-brand-600">← Opportunities</Link><span>/</span><span className="truncate">{item.opportunityName}</span></div>

    <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{item.stage}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{item.priority} priority</span>{stale(item) && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Stale</span>}</div><h1 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{item.opportunityName}</h1><p className="mt-1 text-sm text-gray-500">{item.companyName} · Owner: {item.ownerName}</p></div><p className="text-2xl font-semibold text-gray-900 dark:text-white">{money(item.dealValue)}</p></div>
      <div className="mt-6 flex items-center gap-1 overflow-x-auto">{PIPELINE_STAGES.map((stage, index) => <div key={stage} className="flex min-w-max items-center"><button onClick={() => { if (stage === "L7 - Lost") setLost(true); else if (["L3 - Demo", "L4 - Proposal", "L5 - Negotiation", "L6 - Closed"].includes(stage)) setNextStage(stage); else void saveDirectStage(stage); }} className={`rounded-lg px-3 py-2 text-xs font-medium ${stage === item.stage ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800"}`}>{stage.replace(" - ", " ")}</button>{index < PIPELINE_STAGES.length - 1 && <span className="mx-1 text-gray-300">→</span>}</div>)}</div>
      <p className="mt-3 text-sm text-gray-500">{stageSummary}</p>
    </header>

    {lost && <section className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Why was this opportunity lost?</p><div className="mt-3 flex flex-col gap-3 sm:flex-row"><select value={reason} onChange={(event) => setReason(event.target.value)} className={input}><option value="">Select a lost reason</option>{LOST_REASONS.map((value) => <option key={value}>{value}</option>)}</select><button disabled={!reason} onClick={() => void confirmLost()} className="rounded-lg bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50">Confirm lost</button><button onClick={() => setLost(false)} className="px-3 text-sm text-gray-600">Cancel</button></div></section>}
``
    <div className="grid items-start gap-5 xl:grid-cols-3">
      <div className="grid gap-5 md:grid-cols-2 xl:col-span-2">
        <Card title="Customer information"><Info label="Company" value={item.companyName}/><Info label="Contact person" value={item.contactName}/><Info label="Email" value={item.contactEmail}/><Info label="Phone" value={item.contactPhone}/></Card>
        <Card title="Deal information"><Info label="Deal value" value={money(item.dealValue)}/><Info label="Expected closing date" value={date(item.expectedClosingDate)}/><Info label="Lead source" value={item.leadSource}/><Info label="Owner" value={item.ownerName}/><Info label="Created" value={date(item.createdAt)}/><Info label="Last updated" value={date(item.updatedAt)}/><Info label="Current stage details" value={stageSummary}/></Card>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs md:col-span-2 dark:border-gray-800 dark:bg-white/[0.03]"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next action</p><p className="mt-2 font-semibold text-gray-800 dark:text-white">{item.nextAction || "No next action scheduled"}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Follow-up: {date(item.nextFollowUpDate)} {item.nextFollowUpTime && `· ${item.nextFollowUpTime}`}</p>{item.followUpNotes && <p className="mt-2 text-sm text-gray-500">{item.followUpNotes}</p>}</section>
        {item.lostReason && <section className="rounded-xl border border-red-200 bg-red-50 p-5 md:col-span-2"><p className="text-xs font-semibold uppercase text-red-600">Lost reason</p><p className="mt-2 font-medium text-red-800">{item.lostReason}</p></section>}
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs xl:sticky xl:top-5 dark:border-gray-800 dark:bg-white/[0.03]"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800 dark:text-white">Activity timeline</h2><span className="text-xs text-gray-400">{item.activities.length} updates</span></div>{item.activities.length ? <div className="mt-5 max-h-[70vh] space-y-4 overflow-y-auto pr-1">{item.activities.map((activity) => <div key={activity.id} className="relative border-l-2 border-brand-300 pb-1 pl-4 last:border-transparent"><span className="absolute -left-[5px] top-0 size-2 rounded-full bg-brand-500"/><p className="text-sm font-medium text-gray-800 dark:text-white">{activity.message}</p><p className="mt-1 text-xs text-gray-500">{date(activity.at)} · {activity.by}</p></div>)}</div> : <p className="mt-5 text-sm text-gray-500">No activity recorded yet.</p>}</section>
    </div>

    {nextStage && <StageTransitionModal key={`${item.id}-${nextStage}`} stage={nextStage} opportunity={item} saving={savingStage} onClose={() => setNextStage(undefined)} onSubmit={saveStageDetails}/>}
  </div>;
}

function StageTransitionModal({ stage, opportunity, saving, onClose, onSubmit }: { stage: Stage; opportunity: Opportunity; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const base = "fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-[1px]";
  return <div className={base} role="dialog" aria-modal="true" aria-labelledby="stage-modal-title"><form onSubmit={onSubmit} className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-theme-xl sm:p-6 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800"><div><p className="text-sm font-medium text-brand-500">Move opportunity</p><h2 id="stage-modal-title" className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{stage}</h2><p className="mt-1 text-sm text-gray-500">Add the key details now. They’ll be saved with the stage change.</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100" aria-label="Close">×</button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {stage === "L3 - Demo" && <><Field label="Demo date *"><input name="demoDate" required type="date" defaultValue={opportunity.demoDate || ""} className={input}/></Field><Field label="Demo time *"><input name="demoTime" required type="time" defaultValue={opportunity.demoTime || ""} className={input}/></Field><Field label="Demo notes" wide><textarea name="demoNotes" rows={3} defaultValue={opportunity.demoNotes || ""} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900" placeholder="Agenda, attendees, or preparation notes"/></Field></>}
      {stage === "L4 - Proposal" && <><Field label="Proposal amount (INR) *"><input name="proposalAmount" required min="1" step="1" type="number" defaultValue={opportunity.proposalAmount || ""} className={input}/></Field><Field label="Sent date *"><input name="proposalSentDate" required type="date" defaultValue={opportunity.proposalSentDate || ""} className={input}/></Field><Field label="Reference number"><input name="proposalReference" defaultValue={opportunity.proposalReference || ""} className={input}/></Field><Field label="Proposal notes" wide><textarea name="proposalNotes" rows={3} defaultValue={opportunity.proposalNotes || ""} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"/></Field></>}
      {stage === "L5 - Negotiation" && <><Field label="Negotiation start date *"><input name="negotiationStartDate" required type="date" defaultValue={opportunity.negotiationStartDate || ""} className={input}/></Field><Field label="Negotiation notes" wide><textarea name="negotiationNotes" rows={4} defaultValue={opportunity.negotiationNotes || ""} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900" placeholder="Terms, objections, and next steps"/></Field></>}
      {stage === "L6 - Closed" && <><Field label="Closed date *"><input name="closedDate" required type="date" defaultValue={opportunity.closedDate || ""} className={input}/></Field><Field label="Final deal amount (INR) *"><input name="closedAmount" required min="1" step="1" type="number" defaultValue={opportunity.closedAmount || ""} className={input}/></Field><Field label="Closure notes" wide><textarea name="closedNotes" rows={3} defaultValue={opportunity.closedNotes || ""} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"/></Field></>}
    </div>
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium dark:border-gray-700">Cancel</button><button disabled={saving} className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving…" : `Save details and move to ${stage.split(" - ")[0]}`}</button></div>
  </form></div>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) { return <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>; }
function Card({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><h2 className="mb-4 font-semibold text-gray-800 dark:text-white">{title}</h2><div className="grid gap-4">{children}</div></section>; }
function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">{value || "Not set"}</p></div>; }
