import type { Lead, LeadFormData } from "./types";

const API_URL = "/api/leads";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const responseText = await response.text();
  let result: { error?: string } | T | undefined;
  try {
    result = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    result = undefined;
  }

  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result
      ? result.error
      : undefined;
    throw new Error(message || `The server could not complete the request (HTTP ${response.status}). Check the database connection and server logs.`);
  }

  if (result === undefined) {
    throw new Error("The server returned an empty response. Check the database connection and server logs.");
  }

  return result as T;
}

// GET all leads
export async function getLeads(): Promise<Lead[]> {
  return request<Lead[]>(API_URL);
}

// POST a new lead
export async function createLead(form: LeadFormData): Promise<Lead> {
  return request<Lead>(API_URL, {
    method: "POST",
    body: JSON.stringify(form),
  });
}

// PATCH lead status, disqualification reason, assignment, etc.
export async function updateLead(
  id: string,
  changes: Partial<Lead>
): Promise<Lead> {
  return request<Lead>(`${API_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

// Convert a Qualified lead into an Opportunity
export async function convertLead(
  leadId: string,
  details: {
    opportunityName: string;
    dealValue: number;
    expectedClosingDate?: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
  }
): Promise<{ lead: Lead; opportunityId: string }> {
  return request(`${API_URL}/${leadId}/convert`, {
    method: "POST",
    body: JSON.stringify(details),
  });
}
