import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, currentActor, type Role } from "@/lib/crm-auth";
import { db } from "@/lib/db";

const roles: Role[] = ["super_admin", "admin", "sales_executive"];
export async function GET() {
  try {
    const actor = await currentActor();
    if (actor.role === "sales_executive") throw new Error("You are not allowed to view team members.");
    const where = actor.role === "admin" ? "WHERE u.team_id=? AND u.role='sales_executive'" : "";
    const params = actor.role === "admin" ? [actor.teamId] : [];
    const [rows] = await db.query(`SELECT u.id,u.name,u.email,u.phone,u.role,u.team_id AS teamId,u.is_active AS isActive,t.name AS teamName FROM users u LEFT JOIN teams t ON t.id=u.team_id ${where} ORDER BY u.name`, params);
    return Response.json(rows);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await currentActor();
    const body = await request.json();
    const role = body.role as Role;
    const teamId = body.teamId == null || body.teamId === "" ? null : Number(body.teamId);
    if (!roles.includes(role) || role === "super_admin" && actor.role !== "super_admin") throw new Error("You are not allowed to create that role.");
    if (!body.name?.trim() || !/^\S+@\S+\.\S+$/.test(body.email || "") || !body.password || body.password.length < 8) throw new Error("Enter a name, valid email, and password with at least 8 characters.");
    if (role !== "super_admin" && !teamId) throw new Error("Choose a team for this account.");
    if (actor.role === "admin" && (role !== "sales_executive" || teamId !== actor.teamId)) throw new Error("You are only allowed to add Sales Executives to your team.");
    if (role === "admin" && actor.role !== "super_admin") throw new Error("Only SuperAdmin can create Admin accounts.");
    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [body.email.trim().toLowerCase()]);
    if ((exists as unknown[]).length) throw new Error("An account with this email already exists.");
    const hash = await bcrypt.hash(body.password, 12);
    const [result] = await db.execute("INSERT INTO users (name,email,password,role,team_id,is_active) VALUES (?,?,?,?,?,1)", [body.name.trim(), body.email.trim().toLowerCase(), hash, role, teamId]);
    return Response.json({ id: (result as { insertId: number }).insertId }, { status: 201 });
  } catch (error) { return apiError(error); }
}
