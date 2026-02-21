import { CoverCreator } from "@/components/cover/CoverCreator"
import { akazukinStory } from "@/lib/story/akazukin"
import { momotaroStory } from "@/lib/story/momotaro"
import { notFound } from "next/navigation"

const stories: Record<string, typeof akazukinStory> = {
  akazukin: akazukinStory,
  momotaro: momotaroStory,
}

export default async function CoverPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params
  const story = stories[bookId]
  if (!story) notFound()

  return <CoverCreator story={story} />
}
