import PasswordCard from "@/components/user-profile/PasswordCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";
import { currentActor } from "@/lib/crm-auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default async function Profile() {
  const actor = await currentActor();
  const [users] = await db.query<Array<{ name: string; email: string; phone: string | null; role: string }>>(
    "SELECT name, email, phone, role FROM users WHERE id=? AND is_active=1 LIMIT 1",
    [actor.id],
  );
  const profile = users[0];

  if (!profile) throw new Error("Your profile could not be loaded.");

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard name={profile.name} email={profile.email} role={profile.role} />
          <UserInfoCard name={profile.name} email={profile.email} phone={profile.phone} role={profile.role} />
          <PasswordCard />
        </div>
      </div>
    </div>
  );
}
