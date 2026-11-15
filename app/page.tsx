import Home from "@/components/Home";
import { getDeckSummaries } from "@/lib/decks";

export default function Page() {
  return <Home decks={getDeckSummaries()} />;
}
