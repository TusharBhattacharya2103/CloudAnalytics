import { auth } from "@/auth";
import { db } from "./db";
import type { RowDataPacket } from "mysql2";

export type Role = "super_admin" | "admin" | "sales_executive";
export type Actor = { id: number; role: Role; name: string; teamId: number | null };

export async function currentActor(): Promise<Actor> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("Unauthenticated");
  const [rows] = await db.query<(Actor & RowDataPacket)[]>(
    "SELECT id, role, name, team_id AS teamId FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
    [userId],
  );
  if (!rows[0]) throw new Error("Your account is inactive or is not present in the CRM users table.");
  return { ...rows[0], teamId: rows[0].teamId === null ? null : Number(rows[0].teamId) };
}

export function canAccess(actor: Actor, ownerId: number, ownerTeamId?: number | null) {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return actor.teamId !== null && ownerTeamId === actor.teamId;
  return actor.id === ownerId;
}

export function recordScope(actor: Actor, alias: "l" | "o") {
  if (actor.role === "super_admin") return { sql: "", params: [] as number[] };
  if (actor.role === "admin") {
    if (actor.teamId === null) return { sql: " AND 1=0", params: [] as number[] };
    return { sql: ` AND u.team_id=?`, params: [actor.teamId] };
  }
  return { sql: ` AND ${alias}.assigned_user_id=?`, params: [actor.id] };
}

export function canAssignTo(actor: Actor, userId: number, targetRole?: Role, targetTeamId?: number | null) {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return actor.teamId !== null && targetTeamId === actor.teamId && targetRole === "sales_executive";
  return userId === actor.id;
}

export async function assertCanAssign(actor: Actor, userId: number) {
  const [rows] = await db.query<Array<{ role: Role; team_id: number | null; is_active: number } & RowDataPacket>>(
    "SELECT role, team_id, is_active FROM users WHERE id=? LIMIT 1", [userId],
  );
  const target = rows[0];
  if (!target || !target.is_active || !canAssignTo(actor, userId, target.role, target.team_id === null ? null : Number(target.team_id))) {
    throw new Error("You are not allowed to assign records to that user.");
  }
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message === "Unauthenticated" ? 401 : message.includes("not present") || message.includes("inactive") ? 403 : message.includes("not allowed") || message.includes("cannot") || message.includes("only") ? 403 : 400;
  return Response.json({ error: message }, { status });
}
