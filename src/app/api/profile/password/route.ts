import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { currentActor, apiError } from "@/lib/crm-auth";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const actor = await currentActor();
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (newPassword.length < 8) throw new Error("Your new password must be at least 8 characters.");
    if (newPassword === currentPassword) throw new Error("Choose a password you have not used for this account.");

    const [rows] = await db.query<Array<{ password: string }>>(
      "SELECT password FROM users WHERE id=? AND is_active=1 LIMIT 1",
      [actor.id],
    );
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password))) {
      throw new Error("Your current password is incorrect.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.execute("UPDATE users SET password=? WHERE id=? AND is_active=1", [passwordHash, actor.id]);
    return Response.json({ message: "Your password was updated." });
  } catch (error) {
    return apiError(error);
  }
}
