export const STAGES = ["L1 - Prospects", "L2 - Opportunity", "L3 - Demo", "L4 - Proposal", "L5 - Negotiation", "L6 - Closed", "L7 - Lost"] as const;
export const PIPELINE_STAGES = STAGES;
export type Stage = (typeof STAGES)[number];
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Activity { id: string; type: "created" | "stage" | "note" | "demo"; message: string; at: string; by: string; }
export interface Opportunity {
  id: string; opportunityName: string; companyId: string; companyName: string; contactId: string;
  contactName: string; contactEmail: string; contactPhone: string; description: string; dealValue: number;
  expectedClosingDate?: string; leadSource: string; ownerId: string; ownerName: string; priority: Priority;
  stage: Stage; nextFollowUpDate?: string; nextFollowUpTime?: string; nextAction?: string; followUpNotes?: string;
  createdBy: string; createdAt: string; updatedAt: string; lastActivityAt: string; lostReason?: string;
  activities: Activity[];
  leadId?: string; leadName?: string;
  demoDate?: string; demoTime?: string; demoNotes?: string;
  proposalAmount?: number; proposalSentDate?: string; proposalReference?: string; proposalNotes?: string;
  negotiationStartDate?: string; negotiationNotes?: string;
  closedDate?: string; closedAmount?: number; closedNotes?: string;
}
export interface OpportunityFormData { opportunityName: string; companyId: string; contactId: string; contactEmail: string; contactPhone: string; description: string; dealValue: string; expectedClosingDate: string; leadSource: string; priority: Priority; ownerId: string; nextFollowUpDate: string; nextFollowUpTime: string; nextAction: string; followUpNotes: string; }
export const COMPANIES = [
  { id: "co-1", name: "ABC Technologies", contacts: [{ id: "ct-1", name: "Rahul Sharma", email: "rahul@abctech.in", phone: "+91 98765 43210" }, { id: "ct-2", name: "Ananya Mehta", email: "ananya@abctech.in", phone: "+91 99111 22003" }] },
  { id: "co-2", name: "Northstar Retail", contacts: [{ id: "ct-3", name: "Vikram Rao", email: "vikram@northstar.in", phone: "+91 98220 11445" }] },
  { id: "co-3", name: "Nexus Finance", contacts: [{ id: "ct-4", name: "Priya Nair", email: "priya@nexusfinance.in", phone: "+91 99887 66554" }] },
];
export const LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Email", "Social Media", "Advertisement", "Existing Customer", "Partner", "Other"];
export const LOST_REASONS = ["Price too high", "Competitor", "No requirement", "No response", "Budget issue", "Timing", "Other"];
