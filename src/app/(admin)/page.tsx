import { currentActor } from "@/lib/crm-auth";
import DashboardWorkspace from "@/features/users/DashboardWorkspace";

export default async function Dashboard() {
  const actor = await currentActor();
  return <DashboardWorkspace role={actor.role} name={actor.name} />;
}
