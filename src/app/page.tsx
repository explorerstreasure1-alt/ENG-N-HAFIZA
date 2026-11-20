import EnginHafizaApp from "@/components/EnginHafizaApp";
import { getPublications } from "@/lib/publications";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const publications = await getPublications();
  return <EnginHafizaApp initialPublications={publications} />;
}
