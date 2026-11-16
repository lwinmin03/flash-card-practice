import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudySession from "@/components/StudySession";
import { getDeck } from "@/lib/decks";
import type { StudyMode } from "@/lib/types";

type StudyPageProps = {
  params: Promise<{ level: string }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

function parseMode(mode: string | string[] | undefined): StudyMode {
  return mode === "review" ? "review" : "all";
}

export async function generateMetadata({
  params,
}: StudyPageProps): Promise<Metadata> {
  const { level } = await params;
  const deck = getDeck(level);

  if (!deck) return { title: "Deck not found" };

  return {
    title: deck.title,
    description: `Study ${deck.cards.length} ${deck.level} cards.`,
  };
}

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const { level } = await params;
  const deck = getDeck(level);

  if (!deck) notFound();

  const query = await searchParams;

  return <StudySession deck={deck} initialMode={parseMode(query.mode)} />;
}
