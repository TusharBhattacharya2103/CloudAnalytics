import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import {
  apiError,
  assertCanAssign,
  canAccess,
  currentActor,
} from "@/lib/crm-auth";
import { db } from "@/lib/db";
import { toOpportunity } from "@/lib/crm-mappers";
import { databaseStageValue } from "@/lib/opportunity-stages";
import { STAGES } from "@/features/opportunities/types";

const select =
  "SELECT o.*, CONCAT(l.first_name, ' ', l.last_name) AS lead_name, u.name AS owner_name FROM opportunities o LEFT JOIN leads l ON l.id = o.lead_id LEFT JOIN users u ON u.id = o.assigned_user_id";

type ActivityType = "note" | "created" | "demo" | "stage";

interface FormattedActivity {
  id: string;
  type: ActivityType;
  message: string;
  at: string;
  by: string;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await currentActor();
    const { id } = await params;

    const [rows] = await db.query<RowDataPacket[]>(
      `${select} WHERE o.id = ?`,
      [id],
    );

    const opportunity = rows[0];
    if (!opportunity) {
      throw new Error("Opportunity not found.");
    }

    const [owners] = await db.query<RowDataPacket[]>(
      "SELECT team_id FROM users WHERE id = ?",
      [opportunity.assigned_user_id],
    );

    const ownerTeamId = owners[0]?.team_id;
    if (
      !canAccess(
        actor,
        Number(opportunity.assigned_user_id),
        ownerTeamId == null ? null : Number(ownerTeamId),
      )
    ) {
      throw new Error("You cannot view this opportunity.");
    }

    const [activities] = await db.query<RowDataPacket[]>(
      `SELECT a.id, a.activity_type, a.message, a.created_at, u.name
       FROM opportunity_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.opportunity_id = ?
       ORDER BY a.created_at DESC`,
      [id],
    );

    const formattedActivities: FormattedActivity[] = activities.map(
      (activity): FormattedActivity => {
        const type: ActivityType =
          activity.activity_type === "demo"
            ? "demo"
            : activity.activity_type === "stage_change"
              ? "stage"
              : "note";

        return {
          id: String(activity.id),
          type,
          message: String(activity.message),
          at: new Date(String(activity.created_at)).toISOString(),
          by: String(activity.name || "System"),
        };
      },
    );

    return Response.json(toOpportunity(opportunity, formattedActivities));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await currentActor();
    const { id } = await params;

    const [existing] = await db.query<RowDataPacket[]>(
      `SELECT o.assigned_user_id, u.team_id
       FROM opportunities o
       LEFT JOIN users u ON u.id = o.assigned_user_id
       WHERE o.id = ?`,
      [id],
    );

    const currentOpportunity = existing[0];
    if (!currentOpportunity) {
      throw new Error("Opportunity not found.");
    }

    if (
      !canAccess(
        actor,
        Number(currentOpportunity.assigned_user_id),
        currentOpportunity.team_id == null
          ? null
          : Number(currentOpportunity.team_id),
      )
    ) {
      throw new Error("You cannot update this opportunity.");
    }

    const body = await request.json();

    if (body.ownerId !== undefined) {
      await assertCanAssign(actor, Number(body.ownerId));

      await db.execute(
        "UPDATE opportunities SET assigned_user_id = ? WHERE id = ?",
        [Number(body.ownerId), id],
      );
      await db.execute(
        "UPDATE leads SET assigned_user_id = ? WHERE opportunity_id = ?",
        [Number(body.ownerId), id],
      );
    }

    const map: Record<string, string> = {
      stage: "stage",
      lostReason: "lost_reason",
      demoDate: "demo_date",
      demoTime: "demo_time",
      demoNotes: "demo_notes",
      proposalAmount: "proposal_amount",
      proposalSentDate: "proposal_sent_date",
      proposalReference: "proposal_reference",
      proposalNotes: "proposal_notes",
      negotiationStartDate: "negotiation_start_date",
      negotiationNotes: "negotiation_notes",
      closedDate: "closed_date",
      closedAmount: "closed_amount",
      closedNotes: "closed_notes",
      nextFollowUpDate: "next_follow_up_date",
      nextFollowUpTime: "next_follow_up_time",
      nextAction: "next_action",
      followUpNotes: "follow_up_notes",
    };

    const entries = Object.entries(map)
      .filter(([key]) => body[key] !== undefined)
      .map(([key, column]) => [column, body[key]]);

    const stageEntry = entries.find(([column]) => column === "stage");
    if (stageEntry) {
      if (!(STAGES as readonly string[]).includes(body.stage)) {
        throw new Error("Choose a valid opportunity stage.");
      }
      stageEntry[1] = await databaseStageValue(body.stage);
    }

    if (!entries.length && body.ownerId === undefined) {
      throw new Error("No changes supplied.");
    }

    if (entries.length) {
      await db.execute(
        `UPDATE opportunities
         SET ${entries.map(([column]) => `${column} = ?`).join(", ")}
         WHERE id = ?`,
        [...entries.map(([, value]) => value || null), id],
      );
    }

    if (body.activity) {
      await db.execute(
        `INSERT INTO opportunity_activities
          (opportunity_id, user_id, activity_type, message)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          actor.id,
          body.activity.type || "note",
          body.activity.message,
        ],
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `${select} WHERE o.id = ?`,
      [id],
    );

    if (!rows[0]) {
      throw new Error("Opportunity not found.");
    }

    return Response.json(toOpportunity(rows[0]));
  } catch (error) {
    return apiError(error);
  }
}