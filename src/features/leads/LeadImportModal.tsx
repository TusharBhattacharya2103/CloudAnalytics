"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { Lead, LeadFormData } from "./types";
import { createLead } from "./store";

type Owner = { id: number; name: string };
type ImportRow = LeadFormData & { rowNumber: number; error?: string };

const headerAliases: Record<string, keyof LeadFormData> = {
  first_name: "firstName", firstname: "firstName", first: "firstName",
  last_name: "lastName", lastname: "lastName", last: "lastName",
  email: "email", email_address: "email", phone: "phone", mobile: "phone",
  company: "companyName", company_name: "companyName", companyname: "companyName",
  job_title: "jobTitle", jobtitle: "jobTitle", title: "jobTitle",
  source: "source", lead_source: "source", utm_campaign: "utmCampaign",
  utm_medium: "utmMedium", estimated_budget: "estimatedBudget", budget: "estimatedBudget",
  pain_points: "painPoints", requirement: "painPoints", requirement_pain_points: "painPoints",
};
const normalize = (value: unknown) => String(value ?? "").trim();
const keyFor = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function LeadImportModal({
  leads,
  owners,
  onClose,
  onImported,
}: {
  leads: Lead[];
  owners: Owner[];
  onClose: () => void;
  onImported: (created: Lead[], message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [ownerId, setOwnerId] = useState(owners.length === 1 ? String(owners[0].id) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    if (!ownerId && owners.length === 1) setOwnerId(String(owners[0].id));
  }, [ownerId, owners]);

  const validRows = useMemo(() => rows.filter((row) => !row.error), [rows]);

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["First Name", "Last Name", "Email", "Phone", "Company", "Job Title", "Lead Source", "UTM Campaign", "UTM Medium", "Estimated Budget", "Requirement / Pain Points"],
      ["Aarav", "Sharma", "aarav@example.com", "+91 98765 43210", "Example Technologies", "Operations Head", "Referral", "Q4 Outreach", "email", 250000, "Looking to improve team workflows"],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Leads");
    XLSX.writeFile(book, "lead-import-template.xlsx");
  }

  async function readFile(file?: File) {
    if (!file) return;
    setError("");
    setRows([]);
    setFileName(file.name);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("Choose an Excel workbook (.xlsx or .xls) or a CSV file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("This file is over 10 MB. Split it into smaller files and try again.");
      return;
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The workbook does not contain a sheet.");
      const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
      if (!sourceRows.length) throw new Error("The first sheet has no lead rows.");
      if (sourceRows.length > 500) throw new Error("Import up to 500 leads at a time.");

      const seen = new Set<string>();
      const parsed = sourceRows.map((source, index): ImportRow => {
        const mapped: Partial<LeadFormData> = {};
        for (const [header, value] of Object.entries(source)) {
          const field = headerAliases[keyFor(header)];
          if (field) (mapped as Record<string, unknown>)[field] = value;
        }
        const email = normalize(mapped.email);
        const duplicate = Boolean(email) && (seen.has(email.toLowerCase()) || leads.some((lead) => lead.email.toLowerCase() === email.toLowerCase()));
        if (email) seen.add(email.toLowerCase());
        const budgetText = normalize(mapped.estimatedBudget).replace(/[^\d.]/g, "");
        const budget = budgetText ? Number(budgetText) : undefined;
        let rowError = "";
        if (!normalize(mapped.firstName) || !normalize(mapped.lastName) || !normalize(mapped.companyName) || !/^\S+@\S+\.\S+$/.test(email)) rowError = "Add first name, last name, company, and a valid email.";
        else if (duplicate) rowError = "Email already exists in this CRM or appears more than once in the file.";
        else if (budget !== undefined && !Number.isFinite(budget)) rowError = "Estimated budget must be a number.";
        return {
          firstName: normalize(mapped.firstName), lastName: normalize(mapped.lastName), email,
          phone: normalize(mapped.phone), companyName: normalize(mapped.companyName), jobTitle: normalize(mapped.jobTitle),
          source: normalize(mapped.source) || (file.name.toLowerCase().endsWith(".csv") ? "CSV Import" : "Excel Import"), utmCampaign: normalize(mapped.utmCampaign), utmMedium: normalize(mapped.utmMedium),
          assignedUserId: ownerId, estimatedBudget: budget, painPoints: normalize(mapped.painPoints), rowNumber: index + 2, error: rowError || undefined,
        };
      });
      setRows(parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read this workbook.");
    }
  }

  async function importRows() {
    if (!ownerId && owners.length !== 1) {
      setError(owners.length ? "Choose a sales executive to assign these leads to." : "No sales executives are available for assignment. Ask an administrator to add one.");
      return;
    }
    setBusy(true);
    setError("");
    const created: Lead[] = [];
    const failures: { rowNumber: number; message: string }[] = [];
    for (let start = 0; start < validRows.length; start += 5) {
      const batch = validRows.slice(start, start + 5);
      const results = await Promise.all(batch.map(async ({ rowNumber, error: _rowError, ...data }) => {
        try {
          return { rowNumber, lead: await createLead({ ...data, assignedUserId: ownerId || data.assignedUserId }) };
        } catch (cause) {
          return { rowNumber, error: cause instanceof Error ? cause.message : "Unable to create lead." };
        }
      }));
      for (const result of results) {
        if (result.lead) created.push(result.lead);
        else failures.push({ rowNumber: result.rowNumber, message: result.error || "Unable to create lead." });
      }
      setProgress(`Imported ${Math.min(start + batch.length, validRows.length)} of ${validRows.length}…`);
    }
    setBusy(false);
    const message = `${created.length} lead${created.length === 1 ? "" : "s"} imported${failures.length ? `; ${failures.length} failed` : ""}.`;
    if (created.length) onImported(created, message);
    if (failures.length) {
      const failureByRow = new Map(failures.map((failure) => [failure.rowNumber, failure.message]));
      setRows((current) => current.filter((row) => failureByRow.has(row.rowNumber)).map((row) => ({ ...row, error: failureByRow.get(row.rowNumber) })));
      setError("The remaining rows could not be imported. Review the messages below, correct the data, then choose the file again to retry.");
      setProgress("");
    } else onClose();
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="import-leads-title">
      <section className="my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-theme-xl sm:p-6 dark:bg-gray-900">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div><p className="text-sm font-medium text-brand-500">Bulk import</p><h2 id="import-leads-title" className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Import leads from Excel</h2><p className="mt-1 text-sm text-gray-500">Upload, review each row, then import the valid leads.</p></div>
          <button type="button" onClick={onClose} disabled={busy} className="grid size-9 place-items-center rounded-lg text-2xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50" aria-label="Close">×</button>
        </header>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="font-medium text-gray-800 dark:text-white">1. Prepare your sheet</p><p className="mt-1 text-sm text-gray-500">Use the first row for column headings. First name, last name, email, and company are required.</p><button onClick={downloadTemplate} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">Download Excel template</button></div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="font-medium text-gray-800 dark:text-white">2. Upload your file</p><p className="mt-1 text-sm text-gray-500">Excel .xlsx / .xls or CSV, up to 10 MB and 500 rows.</p><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { void readFile(event.target.files?.[0]); event.currentTarget.value = ""; }} className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700" />{fileName && <p className="mt-2 truncate text-xs text-gray-500">{fileName}</p>}</div>
        </div>

        {owners.length > 1 && <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign imported leads to<select value={ownerId} onChange={(event) => { setOwnerId(event.target.value); setRows((current) => current.map((row) => ({ ...row, assignedUserId: event.target.value }))); }} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"><option value="">Choose a sales executive</option>{owners.map((owner) => <option key={owner.id} value={String(owner.id)}>{owner.name}</option>)}</select></label>}

        {rows.length > 0 && <section className="mt-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold text-gray-900 dark:text-white">3. Review import</h3><p className="text-sm text-gray-500">{validRows.length} ready · {rows.length - validRows.length} need attention</p></div><button onClick={importRows} disabled={busy || !validRows.length} className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-50">{busy ? progress : `Import ${validRows.length} leads`}</button></div>
          <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800"><table className="w-full min-w-[650px] text-left text-sm"><thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-gray-800"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Review</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber} className="border-t border-gray-100 dark:border-gray-800"><td className="px-3 py-2 text-gray-500">{row.rowNumber}</td><td className="px-3 py-2">{row.firstName} {row.lastName}</td><td className="px-3 py-2">{row.email || "—"}</td><td className="px-3 py-2">{row.companyName || "—"}</td><td className={`px-3 py-2 text-xs ${row.error ? "text-red-600" : "text-emerald-700"}`}>{row.error || "Ready"}</td></tr>)}</tbody></table></div>
        </section>}

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <footer className="mt-5 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800"><button onClick={onClose} disabled={busy} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium disabled:opacity-50">Cancel</button></footer>
      </section>
    </div>
  );
}
