type UserMetaCardProps = {
  name: string;
  email: string;
  role: string;
};

function displayRole(role: string) {
  return ({
    super_admin: "SuperAdmin",
    admin: "Admin",
    sales_executive: "Sales Executive",
  } as Record<string, string>)[role] ?? role;
}

export default function UserMetaCard({ name, email, role }: UserMetaCardProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {initials}
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{name}</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{displayRole(role)}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{email}</p>
        </div>
      </div>
    </section>
  );
}
