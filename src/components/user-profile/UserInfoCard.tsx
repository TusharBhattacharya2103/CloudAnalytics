"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserInfoCardProps = {
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

function displayRole(role: string) {
  return ({
    super_admin: "SuperAdmin",
    admin: "Admin",
    sales_executive: "Sales Executive",
  } as Record<string, string>)[role] ?? role;
}

const inputClass = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function UserInfoCard({ name, email, phone, role }: UserInfoCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ name, email, phone: phone ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setValues({ name, email, phone: phone ?? "" });
  }, [name, email, phone]);

  function cancelEdit() {
    setValues({ name, email, phone: phone ?? "" });
    setError("");
    setMessage("");
    setEditing(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your personal information.");
      setValues({ name: result.name, email: result.email, phone: result.phone ?? "" });
      setMessage(result.message);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your personal information.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ["Full name", values.name],
    ["Email address", values.email],
    ["Phone", values.phone || "Not provided"],
    ["Role", displayRole(role)],
  ];

  return (
    <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Personal Information</h4>
        {!editing && <button type="button" onClick={() => { setMessage(""); setEditing(true); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Edit details</button>}
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full name
              <input required maxLength={160} autoComplete="name" value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address
              <input required type="email" maxLength={254} autoComplete="email" value={values.email} onChange={event => setValues({ ...values, email: event.target.value })} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone
              <input type="tel" maxLength={50} autoComplete="tel" value={values.phone} onChange={event => setValues({ ...values, phone: event.target.value })} className={`${inputClass} mt-1.5`} />
            </label>
            <div className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role
              <p className="mt-1.5 flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">{displayRole(role)} <span className="ml-2 text-xs">Cannot be changed here</span></p>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
            <button type="button" onClick={cancelEdit} disabled={saving} className="h-11 rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
          {message && <p role="status" className="mt-4 text-sm text-green-700 dark:text-green-400">{message}</p>}
        </>
      )}
    </section>
  );
}
