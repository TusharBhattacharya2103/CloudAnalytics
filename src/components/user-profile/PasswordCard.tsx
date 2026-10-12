"use client";

import { FormEvent, useState } from "react";

export default function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  return (
    <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="mb-5">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Password</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Change your sign-in password. Your current password is required.</p>
      </div>
      <form onSubmit={changePassword} className="max-w-2xl space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current password
          <input required autoComplete="current-password" type={showPasswords ? "text" : "password"} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New password
          <input required minLength={8} autoComplete="new-password" type={showPasswords ? "text" : "password"} value={newPassword} onChange={event => setNewPassword(event.target.value)} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password
          <input required minLength={8} autoComplete="new-password" type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={showPasswords} onChange={event => setShowPasswords(event.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
          Show password fields
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="text-sm text-green-600">{message}</p>}
        <button type="submit" disabled={saving} className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white disabled:opacity-60">{saving ? "Updating…" : "Update password"}</button>
      </form>
    </section>
  );
}
