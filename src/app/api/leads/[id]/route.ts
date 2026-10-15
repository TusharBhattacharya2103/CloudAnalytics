import { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import {
  apiError,
  assertCanAssign,
  canAccess,
  currentActor,
} from "@/lib/crm-auth";
import { db } from "@/lib/db";
import { toLead } from "@/lib/crm-mappers";

const select =
  "SELECT l.*, u.name assigned_user_name FROM leads l LEFT JOIN users u ON u.id=l.assigned_user_id";

interface LeadAccessRow extends RowDataPacket {
  assigned_user_id: number | string | null;
  team_id: number | string | null;
}

interface LinkedLeadRow extends RowDataPacket {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  lead_source: string | null;
  core_pain_points: string | null;
  assigned_user_id: number | string | null;
}

type SqlValue = string | number | null;

function toSqlValue(value: unknown): SqlValue {
  if (value === null || typeof value === "string") return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  throw new Error("A lead field has an invalid value.");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    const actor = await currentActor();
    const { id } = await params;
    const parsedBody: unknown = await request.json();

    if (
      parsedBody === null ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      throw new Error("Invalid request body.");
    }

    const body = parsedBody as Record<string, unknown>;

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

    const entries = Object.entries(fields).filter(
      ([, value]) => value !== undefined,
    );

    if (entries.length === 0) {
      throw new Error("No changes supplied.");
    }

    const updateValues: SqlValue[] = entries.map(([, value]) =>
      value === "" ? null : toSqlValue(value),
    );

    await connection.beginTransaction();
    transactionStarted = true;

    const [before] = await connection.query<LeadAccessRow[]>(
      "SELECT l.assigned_user_id, u.team_id FROM leads l LEFT JOIN users u ON u.id=l.assigned_user_id WHERE l.id=? FOR UPDATE",
      [id],
    );

    const existingLead = before[0];

    if (!existingLead) {
      throw new Error("Lead not found.");
    }

    if (
      !canAccess(
        actor,
        Number(existingLead.assigned_user_id),
        existingLead.team_id == null ? null : Number(existingLead.team_id),
      )
    ) {
      throw new Error("You cannot update this lead.");
    }

    if (body.assignedUserId !== undefined) {
      await assertCanAssign(actor, Number(body.assignedUserId));
    }

    const updateSql = `UPDATE leads SET ${entries
      .map(([column]) => `${column}=?`)
      .join(", ")} WHERE id=?`;

    await connection.execute(updateSql, [...updateValues, id]);

    // Refresh the opportunity's customer details if this lead has one.
    const [linkedLeads] = await connection.query<LinkedLeadRow[]>(
      "SELECT first_name, last_name, email, phone, company_name, lead_source, core_pain_points, assigned_user_id FROM leads WHERE id=?",
      [id],
    );

    const lead = linkedLeads[0];

    if (!lead) {
      throw new Error("Lead not found after update.");
    }

    await connection.execute(
      "UPDATE opportunities SET company_name=?, contact_name=?, contact_email=?, contact_phone=?, lead_source=?, description=?, assigned_user_id=? WHERE lead_id=?",
      [
        lead.company_name,
        [lead.first_name, lead.last_name].filter(Boolean).join(" "),
        lead.email,
        lead.phone,
        lead.lead_source,
        lead.core_pain_points,
        lead.assigned_user_id == null ? null : Number(lead.assigned_user_id),
        id,
      ],
    );

    const reason =
      typeof body.disqualificationReason === "string"
        ? body.disqualificationReason.trim()
        : "";

    await connection.execute(
      "INSERT INTO lead_activities (lead_id,user_id,activity_type,message) VALUES (?,?,?,?)",
      [
        id,
        actor.id,
        "status_change",
        reason ? `Lead disqualified: ${reason}` : "Lead updated",
      ],
    );

    const [rows] = await connection.query<RowDataPacket[]>(
      `${select} WHERE l.id=?`,
      [id],
    );

    const updatedLead = rows[0];

    if (!updatedLead) {
      throw new Error("Lead not found after update.");
    }

    await connection.commit();
    transactionStarted = false;

    return Response.json(toLead(updatedLead));
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    return apiError(error);
  } finally {
    connection.release();
  }
}