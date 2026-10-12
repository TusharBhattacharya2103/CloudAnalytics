export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Nurture", "Disqualified", "Converted"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export interface Lead {
  id: string; firstName: string; lastName: string; email: string; phone?: string; companyName: string; companyDomain?: string;
  jobTitle?: string; source: string; utmCampaign?: string; utmMedium?: string; status: LeadStatus; disqualificationReason?: string; score: number; assignedUserId: string; assignedUserName: string;
  lastContactedAt?: string; estimatedBudget?: number; decisionMakerIdentified: boolean; timelineMonths?: number; painPoints?: string;
  createdAt: string; updatedAt: string; opportunityId?: string;
}
export type LeadFormData = Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "companyName" | "jobTitle" | "source" | "utmCampaign" | "utmMedium" | "assignedUserId" | "estimatedBudget" | "painPoints">;
