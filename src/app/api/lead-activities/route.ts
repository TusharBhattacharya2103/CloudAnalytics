import type { RowDataPacket } from "mysql2";
import { NextRequest } from "next/server";
import { apiError, canAccess, currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";

interface LeadOwnerRow extends RowDataPacket {
  assigned_user_id: number | null;
  team_id: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await currentActor();
    const leadId = Number(request.nextUrl.searchParams.get("leadId"));

    const [owners] = await db.query<LeadOwnerRow[]>(
      `SELECT l.assigned_user_id, u.team_id
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_user_id
       WHERE l.id = ?`,
      [leadId],
    );

    const owner = owners[0];
    if (
      !owner ||
      !canAccess(
        actor,
        Number(owner.assigned_user_id),
        owner.team_id == null ? null : Number(owner.team_id),
      )
    ) {
      throw new Error("You cannot view these activities.");
    }

    const [rows] = await db.query(
      `SELECT a.*, u.name AS user_name
       FROM lead_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.lead_id = ?
       ORDER BY a.created_at DESC`,
      [leadId],
    );

    return Response.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await currentActor();
    const body = await request.json();
    const leadId = Number(body.leadId);

    const [owners] = await db.query<LeadOwnerRow[]>(
      `SELECT l.assigned_user_id, u.team_id
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_user_id
       WHERE l.id = ?`,
      [leadId],
    );

    const owner = owners[0];
    if (
      !owner ||
      !canAccess(
        actor,
        Number(owner.assigned_user_id),
        owner.team_id == null ? null : Number(owner.team_id),
      )
    ) {
      throw new Error("You cannot add an activity to this lead.");
    }

    await db.execute(
      `INSERT INTO lead_activities
        (lead_id, user_id, activity_type, message)
       VALUES (?, ?, ?, ?)`,
      [leadId, actor.id, body.activityType || "note", body.message],
    );

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}