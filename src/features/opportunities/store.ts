"use client";
import { COMPANIES, Opportunity, OpportunityFormData } from "./types";
const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const responseText = await response.text();
  let result: { error?: string } | T | undefined;
  try { result = responseText ? JSON.parse(responseText) : undefined; } catch { result = undefined; }
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result ? result.error : undefined;
    throw new Error(message || `The server could not complete the request (HTTP ${response.status}). Check the database connection and server logs.`);
  }
  if (result === undefined) throw new Error("The server returned an empty response. Check the database connection and server logs.");
  return result as T;
};
export const getOpportunities = () => request<Opportunity[]>("/api/opportunities");
export const getOpportunity = (id: string) => request<Opportunity>(`/api/opportunities/${id}`);
export async function createOpportunity(form: OpportunityFormData) { const company = COMPANIES.find(x => x.id === form.companyId); const contact = company?.contacts.find(x => x.id === form.contactId); return request<{ id: string }>("/api/opportunities", { method: "POST", body: JSON.stringify({ ...form, companyName: company?.name || "", contactName: contact?.name || "", dealValue: Number(form.dealValue) }) }); }
export const updateOpportunity = (id: string, changes: Partial<Opportunity> & { activity?: { type: string; message: string } }) => request<Opportunity>(`/api/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
export function stale(item: Opportunity) { return Date.now() - new Date(item.lastActivityAt).getTime() > 7 * 86400000; }
