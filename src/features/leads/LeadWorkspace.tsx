"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LeadDetailsModal from "./LeadDetailsModal";
import LeadImportModal from "./LeadImportModal";
import { getLeads, updateLead } from "./store";
import { LEAD_STATUSES, Lead, LeadFormData, LeadStatus } from "./types";

const badge: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-violet-50 text-violet-700",
  Qualified: "bg-emerald-50 text-emerald-700",
  Nurture: "bg-amber-50 text-amber-700",
  Disqualified: "bg-red-50 text-red-700",
  Converted: "bg-gray-100 text-gray-600",
};

const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
        new Date(value),
      )
    : "—";

const filterSelectClass =
  "filter-select h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function LeadWorkspace() {
  const [items, setItems] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [owner, setOwner] = useState("All");
  const [notice, setNotice] = useState("");
  const [pendingDisqualification, setPendingDisqualification] = useState<Lead>();
  const [selectedLead, setSelectedLead] = useState<Lead>();
  const [disqualificationReason, setDisqualificationReason] = useState("");
  const [otherDisqualificationReason, setOtherDisqualificationReason] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const createdNotice = sessionStorage.getItem("crm:new-lead-notice");
    if (createdNotice) {
      setNotice(createdNotice);
      sessionStorage.removeItem("crm:new-lead-notice");
    }

    getLeads().then(setItems).catch((error) => setNotice(error.message));
    fetch("/api/assignable-users")
      .then((response) => response.json())
      .then(setAssignableUsers)
      .catch(() => setAssignableUsers([]));
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (lead) =>
          `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.companyName}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "All" || lead.status === status) &&
          (owner === "All" || String(lead.assignedUserId) === owner),
      ),
    [items, query, status, owner],
  );

  const totals = useMemo(
    () => ({
      total: items.length,
      qualified: items.filter((lead) => lead.status === "Qualified").length,
      followUps: items.filter(
        (lead) => lead.status === "Contacted" || lead.status === "Nurture",
      ).length,
      converted: items.filter((lead) => lead.status === "Converted").length,
    }),
    [items],
  );

  const replace = (updated: Lead) =>
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));

  async function changeStatus(lead: Lead, next: LeadStatus) {
    if (next === "Converted" && !lead.opportunityId) {
      setNotice("Use Convert to opportunity for qualified leads. This creates the linked deal safely.");
      return;
    }
    if (next === "Disqualified") {
      setPendingDisqualification(lead);
      setDisqualificationReason(lead.disqualificationReason || "");
      return;
    }
    try {
      replace(await updateLead(lead.id, { status: next, disqualificationReason: undefined }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update lead.");
    }
  }

  async function confirmDisqualification() {
    let reason = disqualificationReason;
    if (reason === "Other") {
      reason =
        window.prompt("Enter the other disqualification reason:", otherDisqualificationReason)?.trim() ||
        "";
      setOtherDisqualificationReason(reason);
    }
    if (!pendingDisqualification || !reason) return;

    try {
      replace(
        await updateLead(pendingDisqualification.id, {
          status: "Disqualified",
          disqualificationReason: reason,
        }),
      );
      setPendingDisqualification(undefined);
      setDisqualificationReason("");
      setOtherDisqualificationReason("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to disqualify lead.");
    }
  }

  async function saveLeadDetails(changes: LeadFormData) {
    if (!selectedLead) return;
    const updated = await updateLead(selectedLead.id, changes);
    replace(updated);
    setNotice(`Lead details updated for ${updated.firstName} ${updated.lastName}.`);
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className="flex justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700"
          role="status"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(undefined)}
          onSave={saveLeadDetails}
        />
      )}

      {importOpen && (
        <LeadImportModal
          leads={items}
          owners={assignableUsers}
          onClose={() => setImportOpen(false)}
          onImported={(created, message) => {
            setItems((current) => [...created, ...current]);
            setNotice(message);
          }}
        />
      )}

      {pendingDisqualification && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">
            Why is {pendingDisqualification.firstName} {pendingDisqualification.lastName} being
            disqualified?
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              value={disqualificationReason}
              onChange={(event) => setDisqualificationReason(event.target.value)}
              className="h-10 flex-1 rounded-lg border border-red-200 bg-white px-3 text-sm text-gray-900"
            >
              <option value="">Select a reason</option>
              {["No Budget", "Bad ICP Fit", "Competitor", "Unresponsive", "No requirement", "Other"].map(
                (reason) => (
                  <option key={reason}>{reason}</option>
                ),
              )}
            </select>
            <button
              disabled={!disqualificationReason}
              onClick={confirmDisqualification}
              className="rounded-lg bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Confirm disqualified
            </button>
            <button
              onClick={() => setPendingDisqualification(undefined)}
              className="px-3 text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-brand-500">Sales workspace</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Qualify interest before creating a deal in the pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            Import from Excel
          </button>
          <Link
            href="/leads/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
          >
            + New lead
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total leads", totals.total],
          ["Qualified", totals.qualified],
          ["Follow-ups", totals.followUps],
          ["Converted", totals.converted],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or company..."
            className="h-10 flex-1 rounded-lg border border-white-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white-400"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={filterSelectClass}
          >
            <option value="All">All statuses</option>
            {LEAD_STATUSES.map((leadStatus) => (
              <option key={leadStatus} value={leadStatus}>
                {leadStatus}
              </option>
            ))}
          </select>
          <select
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className={filterSelectClass}
          >
            <option value="All">All executives</option>
            {Array.from(
              new Map(items.map((lead) => [lead.assignedUserId, lead.assignedUserName])).entries(),
            ).map(([id, name]) => (
              <option key={id} value={String(id)}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
            <tr>
              {[
                "Lead ID",
                "Name & email",
                "Company",
                "Status",
                "Disqualification reason",
                "Sales executive",
                "Last contact",
                "Action",
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="px-4 py-4 font-mono text-xs text-gray-500">{lead.id}</td>
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-800 dark:text-white">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{lead.email}</p>
                </td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{lead.companyName}</td>
                <td className="px-4 py-4">
                  <select
                    value={lead.status}
                    onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[lead.status]}`}
                  >
                    {LEAD_STATUSES.map((leadStatus) => (
                      <option key={leadStatus}>{leadStatus}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500">
                  {lead.disqualificationReason || "—"}
                </td>
                <td className="px-4 py-4 text-gray-500">{lead.assignedUserName}</td>
                <td className="px-4 py-4 text-gray-500">{date(lead.lastContactedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      View / edit
                    </button>
                    {lead.status === "Qualified" && !lead.opportunityId ? (
                      <Link
                        href={`/leads/${lead.id}/convert`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Convert to opportunity
                      </Link>
                    ) : lead.opportunityId ? (
                      <Link
                        href={`/opportunities/${lead.opportunityId}`}
                        className="text-sm font-medium text-emerald-600"
                      >
                        View opportunity
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Qualify to convert</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-12 text-center text-sm text-gray-500">No leads match these filters.</p>
        )}
      </div>
    </div>
  );
}
