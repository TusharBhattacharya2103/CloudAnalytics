import { NextRequest } from "next/server";
import { apiError, currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const actor = await currentActor();
    const [rows] = await db.query<Array<{ name: string; email: string; role: string } & import("mysql2").RowDataPacket>>(
      "SELECT name, email, role FROM users WHERE id=? AND is_active=1 LIMIT 1",
      [actor.id],
    );
    if (!rows[0]) throw new Error("Your profile could not be loaded.");
    return Response.json(rows[0]);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await currentActor();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name) throw new Error("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (name.length > 160 || email.length > 254 || phone.length > 50) {
      throw new Error("One or more profile fields are too long.");
    }

    const [existing] = await db.query<Array<{ id: number } & import("mysql2").RowDataPacket>>(
      "SELECT id FROM users WHERE email=? AND id<>? LIMIT 1",
      [email, actor.id],
    );
    if (existing[0]) throw new Error("An account with this email already exists.");

    await db.execute(
      "UPDATE users SET name=?, email=?, phone=? WHERE id=? AND is_active=1",
      [name, email, phone || null, actor.id],
    );
    return Response.json({ name, email, phone: phone || null, message: "Personal information updated." });
  } catch (error) {
    return apiError(error);
  }
}
