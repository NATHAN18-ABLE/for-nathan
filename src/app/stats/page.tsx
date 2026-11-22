import { TestStatsPage } from "@/components/TestStats";

// Not in the menu and kept out of search results: share the address with the team.
export const metadata = { title: "Test statistics · Seoul, Curated", robots: { index: false, follow: false } };

export default function Page() {
  return <TestStatsPage />;
}
