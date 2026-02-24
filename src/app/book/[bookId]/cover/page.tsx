import { CoverCreator } from "@/components/cover/CoverCreator"
import { akazukinStory } from "@/lib/story/akazukin"
import { momotaroStory } from "@/lib/story/momotaro"
import { wizardOfOzStory } from "@/lib/story/wizard-of-oz"
import { notFound } from "next/navigation"

const stories: Record<string, typeof akazukinStory> = {
  akazukin: akazukinStory,
  momotaro: momotaroStory,
  'wizard-of-oz': wizardOfOzStory,
}

export default async function CoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>
  searchParams: Promise<{ session?: string }>
}) {
  const { bookId } = await params
  const { session } = await searchParams
  const story = stories[bookId]
  if (!story) notFound()

  return <CoverCreator story={story} sessionId={session} />
}
