import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function RedirectPage() {
  const session = (await auth()) as any;

  if (!session?.user) redirect("/login");

  if (session.user.role === "PUBLISHER") {
    redirect("/publisher/dashboard");
  }

  redirect("/feed");
}
