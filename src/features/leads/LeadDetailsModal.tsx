"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Lead, LeadFormData } from "./types";

const input =
  "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:text-white";

const sources = [
  "Website",
  "Referral",
  "Cold Outreach",
  "Event",
  "Partner",
  "LinkedIn",
  "Manual",
  "Excel Import",
  "CSV Import",
];

function toForm(lead: Lead): LeadFormData {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone || "",
    companyName: lead.companyName,
    jobTitle: lead.jobTitle || "",
    source: lead.source,
    utmCampaign: lead.utmCampaign || "",
    utmMedium: lead.utmMedium || "",
    assignedUserId: lead.assignedUserId,
    estimatedBudget: lead.estimatedBudget,
    painPoints: lead.painPoints || "",
  };
}

export default function LeadDetailsModal({
  lead,
  onClose,
  onSave,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (changes: LeadFormData) => Promise<void>;
}) {
  // The modal remounts using key={selectedLead.id} in LeadWorkspace.
  // Therefore this initial state always belongs to the selected lead.
  const [form, setForm] = useState<LeadFormData>(() => toForm(lead));
  const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/assignable-users").then((response) => response.json()).then(setOwners).catch(() => setOwners([]));
  }, []);

  const set = <K extends keyof LeadFormData>(
    key: K,
    value: LeadFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.companyName.trim() ||
      !/^\S+@\S+\.\S+$/.test(form.email)
    ) {
      setError("Enter a first name, last name, company, and valid email.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(form);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save changes.",
      );
      setSaving(false);
    }
  }

  const value = (text?: string | number) => (text ? String(text) : "—");

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-details-title"
    > 
      <form
        onSubmit={submit}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-theme-xl sm:p-6 dark:bg-gray-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-brand-500">Lead details</p>
            <h2
              id="lead-details-title"
              className="mt-1 text-xl font-semibold text-gray-900 dark:text-white"
            >
              {editing ? "Edit lead" : `${lead.firstName} ${lead.lastName}`}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {editing ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="First name *">
              <input
                className={input}
                value={form.firstName}
                onChange={(event) => set("firstName", event.target.value)}
              />
            </Field>

            <Field label="Last name *">
              <input
                className={input}
                value={form.lastName}
                onChange={(event) => set("lastName", event.target.value)}
              />
            </Field>

            <Field label="Email *">
              <input
                className={input}
                type="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
              />
            </Field>

            <Field label="Phone">
              <input
                className={input}
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </Field>

            <Field label="Company *">
              <input
                className={input}
                value={form.companyName}
                onChange={(event) => set("companyName", event.target.value)}
              />
            </Field>

            <Field label="Job title">
              <input
                className={input}
                value={form.jobTitle}
                onChange={(event) => set("jobTitle", event.target.value)}
              />
            </Field>

            <Field label="Lead source">
              <select
                className={input}
                value={form.source}
                onChange={(event) => set("source", event.target.value)}
              >
                {sources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </Field>

            <Field label="Sales executive">
              <select
                className={input}
                value={form.assignedUserId}
                onChange={(event) =>
                  set("assignedUserId", event.target.value)
                }
              >
                {owners.map((owner) => (
                  <option key={owner.id} value={String(owner.id)}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="UTM campaign">
              <input
                className={input}
                value={form.utmCampaign}
                onChange={(event) => set("utmCampaign", event.target.value)}
              />
            </Field>

            <Field label="UTM medium">
              <input
                className={input}
                value={form.utmMedium}
                onChange={(event) => set("utmMedium", event.target.value)}
              />
            </Field>

            <Field label="Estimated budget (INR)">
              <input
                className={input}
                inputMode="numeric"
                value={form.estimatedBudget || ""}
                onChange={(event) =>
                  set(
                    "estimatedBudget",
                    event.target.value
                      ? Number(event.target.value.replace(/\D/g, ""))
                      : undefined,
                  )
                }
              />
            </Field>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Requirement / pain points
              <textarea
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700"
                value={form.painPoints}
                onChange={(event) => set("painPoints", event.target.value)}
              />
            </label>
          </div>
        ) : (
          <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm md:grid-cols-2">
            <Detail label="Email" value={lead.email} />
            <Detail label="Phone" value={value(lead.phone)} />
            <Detail label="Company" value={lead.companyName} />
            <Detail label="Job title" value={value(lead.jobTitle)} />
            <Detail label="Lead source" value={lead.source} />
            <Detail label="Sales executive" value={lead.assignedUserName} />
            <Detail label="UTM campaign" value={value(lead.utmCampaign)} />
            <Detail label="UTM medium" value={value(lead.utmMedium)} />
            <Detail
              label="Estimated budget"
              value={
                lead.estimatedBudget
                  ? `₹${lead.estimatedBudget.toLocaleString("en-IN")}`
                  : "—"
              }
            />
            <Detail
              label="Requirement / pain points"
              value={value(lead.painPoints)}
            />
          </dl>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
          >
            Close
          </button>

          {editing ? (
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                // The dialog is mounted in a portal. Keep this interaction
                // inside it so parent click handlers cannot clear the selected lead.
                event.preventDefault();
                event.stopPropagation();
                setEditing(true);
              }}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Edit lead
            </button>
          )}
        </div>
      </form>
    </div>,
    document.body,
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">
        {value}
      </dd>
    </div>
  );
}
