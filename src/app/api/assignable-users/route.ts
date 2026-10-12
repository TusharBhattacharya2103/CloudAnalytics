import { currentActor, apiError } from "@/lib/crm-auth";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const actor = await currentActor();
    if (actor.role === "sales_executive") return Response.json([{ id: actor.id, name: actor.name }]);
    const [rows] = actor.role === "super_admin"
      ? await db.query("SELECT id,name FROM users WHERE role='sales_executive' AND is_active=1 ORDER BY name")
      : await db.query("SELECT id,name FROM users WHERE role='sales_executive' AND team_id=? AND is_active=1 ORDER BY name", [actor.teamId]);
    return Response.json(rows);
  } catch (error) { return apiError(error); }
}
