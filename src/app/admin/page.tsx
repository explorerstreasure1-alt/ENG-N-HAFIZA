import { getPublications } from "@/lib/publications";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const publications = await getPublications();
  return <AdminPanel initialPublications={publications} />;
}
