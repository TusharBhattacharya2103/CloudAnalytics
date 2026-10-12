import { currentActor } from "@/lib/crm-auth";
import TeamWorkspace from "@/features/users/TeamWorkspace";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const actor = await currentActor();
  if (actor.role === "sales_executive") redirect("/");
  return <TeamWorkspace role={actor.role} />;
}
