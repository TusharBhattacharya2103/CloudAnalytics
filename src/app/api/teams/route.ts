import { NextRequest } from "next/server";
import { apiError, currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const actor = await currentActor();
    if (actor.role === "sales_executive") throw new Error("You are not allowed to view teams.");
    const [rows] = actor.role === "super_admin"
      ? await db.query("SELECT id,name FROM teams ORDER BY name")
      : await db.query("SELECT id,name FROM teams WHERE id=?", [actor.teamId]);
    return Response.json(rows);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await currentActor();
    if (actor.role !== "super_admin") throw new Error("Only SuperAdmin can create teams.");
    const { name } = await request.json();
    if (!name?.trim()) throw new Error("Enter a team name.");
    const [result] = await db.execute("INSERT INTO teams (name) VALUES (?)", [name.trim()]);
    return Response.json({ id: (result as { insertId: number }).insertId, name: name.trim() }, { status: 201 });
  } catch (error) { return apiError(error); }
}
