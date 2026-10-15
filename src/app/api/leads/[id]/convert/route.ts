import type { RowDataPacket } from "mysql2";
import { NextRequest } from "next/server";
import {
  apiError,
  assertCanAssign,
  canAccess,
  currentActor,
} from "@/lib/crm-auth";
import { db } from "@/lib/db";
import { databaseStageValue } from "@/lib/opportunity-stages";

interface LeadConversionRow extends RowDataPacket {
  assigned_user_id: number | null;
  team_id: number | null;
  lead_status: string;
  opportunity_id: string | null;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string | null;
  core_pain_points: string | null;
  lead_source: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    const actor = await currentActor();
    const { id } = await params;
    const body = await request.json();

    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.query<LeadConversionRow[]>(
      `SELECT l.*, u.team_id
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_user_id
       WHERE l.id = ?
       FOR UPDATE`,
      [id],
    );

    const lead = rows[0];

    if (!lead) {
      throw new Error("Lead not found.");
    }

    if (
      !canAccess(
        actor,
        Number(lead.assigned_user_id),
        lead.team_id === null ? null : Number(lead.team_id),
      )
    ) {
      throw new Error("You cannot convert this lead.");
    }

    if (lead.lead_status !== "Qualified") {
      throw new Error("Only qualified leads can be converted.");
    }

    if (lead.opportunity_id) {
      throw new Error("This lead has already been converted.");
    }

    const opportunityId = `opp-${crypto.randomUUID()}`;
    const owner = Number(lead.assigned_user_id);

    await assertCanAssign(actor, owner);

    const contactName = `${lead.first_name} ${lead.last_name}`;
    const initialStage = await databaseStageValue("L1 - Prospects");

    await connection.execute(
      `INSERT INTO opportunities
        (id, lead_id, opportunity_name, company_name, contact_name,
         contact_email, contact_phone, description, deal_value,
         expected_closing_date, lead_source, priority, stage,
         assigned_user_id, next_action)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opportunityId,
        id,
        body.opportunityName,
        lead.company_name,
        contactName,
        lead.email,
        lead.phone,
        lead.core_pain_points,
        body.dealValue,
        body.expectedClosingDate || null,
        lead.lead_source,
        body.priority || "Medium",
        initialStage,
        owner,
        "Contact qualified lead",
      ],
    );

    await connection.execute(
      `UPDATE leads
       SET lead_status = 'Converted', opportunity_id = ?, converted_at = NOW()
       WHERE id = ?`,
      [opportunityId, id],
    );

    await connection.execute(
      `INSERT INTO lead_activities
        (lead_id, user_id, activity_type, message)
       VALUES (?, ?, ?, ?)`,
      [id, actor.id, "converted", `Converted to opportunity ${opportunityId}`],
    );

    await connection.execute(
      `INSERT INTO opportunity_activities
        (opportunity_id, user_id, activity_type, message)
       VALUES (?, ?, ?, ?)`,
      [
        opportunityId,
        actor.id,
        "created",
        `Opportunity converted from lead ${id}`,
      ],
    );

    await connection.commit();
    transactionStarted = false;

    return Response.json({ opportunityId });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    return apiError(error);
  } finally {
    connection.release();
  }
}