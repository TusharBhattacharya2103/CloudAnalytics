"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Priority } from "../opportunities/types";
import { convertLead, getLeads } from "./store";
import type { Lead } from "./types";

const input =
  "mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700";

export default function LeadConversion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | undefined>(undefined);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [error, setError] = useState("");

  useEffect(() => {
    getLeads()
      .then((leads) => {
        const found = leads.find((item) => item.id === id);
        setLead(found);

        if (found) {
          setName(`${found.companyName} opportunity`);
          setValue(found.estimatedBudget ? String(found.estimatedBudget) : "");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to load lead.");
      });
  }, [id]);

  if (!lead) {
    return <div className="p-8 text-gray-500">Loading qualified lead…</div>;
  }

  if (lead.status !== "Qualified") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Only qualified leads can be converted to opportunities.
      </div>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // This guard is needed inside the submit handler too.
    if (!lead) return;

    if (!name.trim() || Number(value) <= 0) {
      setError("Provide an opportunity name and deal value.");
      return;
    }

    try {
      await convertLead(lead.id, {
        opportunityName: name,
        dealValue: Number(value),
        expectedClosingDate: date || undefined,
        priority,
      });

      router.push("/opportunities");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to convert lead.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-500">Qualified lead</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Convert to opportunity
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Creates an L1 - Prospects opportunity linked to {lead.firstName}{" "}
          {lead.lastName} at {lead.companyName}.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Opportunity name *
            <input
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Deal value (INR) *
            <input
              className={input}
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            />
          </label>

          <label className="block text-sm font-medium">
            Expected closing date
            <input
              className={input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Priority
            <select
              className={input}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {["Low", "Medium", "High", "Urgent"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 rounded-lg border border-gray-300 px-5 text-sm font-medium"
        >
          Cancel
        </button>
        <button className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white">
          Convert and view in pipeline
        </button>
      </div>
    </form>
  );
}