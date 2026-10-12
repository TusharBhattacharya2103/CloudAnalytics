import { NextRequest } from "next/server";
import { apiError, currentActor, type Role } from "@/lib/crm-auth";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await currentActor();
    const { id } = await params;
    const body = await request.json();
    const [found] = await db.query<Array<{ role: Role; team_id: number | null; is_active: number } & import("mysql2").RowDataPacket>>("SELECT role,team_id,is_active FROM users WHERE id=?", [id]);
    const target = found[0];
    if (!target) throw new Error("User not found.");
    if (actor.id === Number(id) && (body.role !== undefined || body.teamId !== undefined)) throw new Error("You cannot change your own role or team.");
    if (actor.role !== "super_admin" && !(actor.role === "admin" && target.role === "sales_executive" && Number(target.team_id) === actor.teamId)) throw new Error("You are not allowed to manage this account.");
    if (actor.id === Number(id) && body.isActive === false) throw new Error("You cannot deactivate your own account.");
    const role = (body.role ?? target.role) as Role;
    if (!["super_admin", "admin", "sales_executive"].includes(role)) throw new Error("Choose a valid account role.");
    const teamId = body.teamId === undefined ? target.team_id : body.teamId == null || body.teamId === "" ? null : Number(body.teamId);
    if (role === "super_admin" && actor.role !== "super_admin") throw new Error("Only SuperAdmin can assign the SuperAdmin role.");
    if (actor.role === "admin" && (role !== "sales_executive" || teamId !== actor.teamId)) throw new Error("You can only keep Sales Executives in your team.");
    if (role !== "super_admin" && !teamId) throw new Error("Choose a team for this account.");
    await db.execute("UPDATE users SET role=?,team_id=?,is_active=? WHERE id=?", [role, teamId, body.isActive === undefined ? target.is_active : body.isActive ? 1 : 0, id]);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
