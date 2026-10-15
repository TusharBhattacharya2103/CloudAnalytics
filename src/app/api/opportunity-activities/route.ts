import type { RowDataPacket } from "mysql2";
import { NextRequest } from "next/server";
import { apiError, canAccess, currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";

interface OpportunityOwnerRow extends RowDataPacket {
  assigned_user_id: number | null;
  team_id: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await currentActor();
    const opportunityId =
      request.nextUrl.searchParams.get("opportunityId");

    if (!opportunityId) {
      throw new Error("Opportunity ID is required.");
    }

    const [owners] = await db.query<OpportunityOwnerRow[]>(
      `SELECT o.assigned_user_id, u.team_id
       FROM opportunities o
       LEFT JOIN users u ON u.id = o.assigned_user_id
       WHERE o.id = ?`,
      [opportunityId],
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
       FROM opportunity_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.opportunity_id = ?
       ORDER BY a.created_at DESC`,
      [opportunityId],
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
    const opportunityId = String(body.opportunityId ?? "");

    if (!opportunityId) {
      throw new Error("Opportunity ID is required.");
    }

    const [owners] = await db.query<OpportunityOwnerRow[]>(
      `SELECT o.assigned_user_id, u.team_id
       FROM opportunities o
       LEFT JOIN users u ON u.id = o.assigned_user_id
       WHERE o.id = ?`,
      [opportunityId],
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
      throw new Error("You cannot add an activity to this opportunity.");
    }

    await db.execute(
      `INSERT INTO opportunity_activities
        (opportunity_id, user_id, activity_type, message)
       VALUES (?, ?, ?, ?)`,
      [
        opportunityId,
        actor.id,
        body.activityType || "note",
        body.message,
      ],
    );

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}