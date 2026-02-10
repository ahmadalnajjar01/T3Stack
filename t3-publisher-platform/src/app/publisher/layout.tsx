import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function PublisherLayout({ children }: { children: React.ReactNode }) {
  const session = (await auth()) as any;

  if (!session?.user) redirect("/login");
  if (session.user.role !== "PUBLISHER") redirect("/feed");

  return <>{children}</>;
}
