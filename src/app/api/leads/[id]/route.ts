import { NextRequest } from "next/server";
import { apiError, assertCanAssign, canAccess, currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";
import { toLead } from "@/lib/crm-mappers";

const select = "SELECT l.*, u.name assigned_user_name FROM leads l LEFT JOIN users u ON u.id=l.assigned_user_id";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const connection = await db.getConnection();

  try {
    const actor = await currentActor();
    const { id } = await params;
    const body = await request.json();
    const fields: Record<string, unknown> = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      company_name: body.companyName,
      job_title: body.jobTitle,
      lead_source: body.source,
      utm_campaign: body.utmCampaign,
      utm_medium: body.utmMedium,
      lead_status: body.status,
      disqualification_reason: body.disqualificationReason,
      assigned_user_id: body.assignedUserId,
      last_contacted_at: body.lastContactedAt,
      estimated_budget: body.estimatedBudget,
      core_pain_points: body.painPoints,
    };
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
    if (!entries.length) throw new Error("No changes supplied.");

    await connection.beginTransaction();
    const [before] = await connection.query<Record<string, unknown>[]>("SELECT l.assigned_user_id,u.team_id FROM leads l LEFT JOIN users u ON u.id=l.assigned_user_id WHERE l.id=? FOR UPDATE", [id]);
    if (!before[0]) throw new Error("Lead not found.");
    if (!canAccess(actor, Number(before[0].assigned_user_id), before[0].team_id === null ? null : Number(before[0].team_id))) throw new Error("You cannot update this lead.");
    if (body.assignedUserId !== undefined) await assertCanAssign(actor, Number(body.assignedUserId));

    await connection.execute(
      `UPDATE leads SET ${entries.map(([key]) => `${key}=?`).join(", ")} WHERE id=?`,
      [...entries.map(([, value]) => value || null), id],
    );

    // Opportunities created from a lead keep a snapshot of its customer details.
    // Refresh that snapshot in the same transaction so every CRM view stays current.
    const [linkedLeads] = await connection.query<Record<string, unknown>[]>(
      "SELECT id, first_name, last_name, email, phone, company_name, lead_source, core_pain_points, assigned_user_id FROM leads WHERE id=?",
      [id],
    );
    const lead = linkedLeads[0];
    await connection.execute(
      `UPDATE opportunities SET company_name=?, contact_name=?, contact_email=?, contact_phone=?, lead_source=?, description=?, assigned_user_id=? WHERE lead_id=?`,
      [
        lead.company_name,
        `${lead.first_name} ${lead.last_name}`,
        lead.email,
        lead.phone || null,
        lead.lead_source || null,
        lead.core_pain_points || null,
        lead.assigned_user_id || null,
        id,
      ],
    );

    await connection.execute(
      "INSERT INTO lead_activities (lead_id,user_id,activity_type,message) VALUES (?,?,?,?)",
      [id, actor.id, "status_change", body.disqualificationReason ? `Lead disqualified: ${body.disqualificationReason}` : "Lead updated"],
    );
    const [rows] = await connection.query<Record<string, unknown>[]>(`${select} WHERE l.id=?`, [id]);
    await connection.commit();
    return Response.json(toLead(rows[0]));
  } catch (error) {
    await connection.rollback();
    return apiError(error);
  } finally {
    connection.release();
  }
}
