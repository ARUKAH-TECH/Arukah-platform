import type { Metadata } from "next";
import { SharedVerse, sharedMetadata, verseRequest } from "@/app/q/shared";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/q/v/[b]/[c]/[vs]/[t]">): Promise<Metadata> {
  return sharedMetadata(verseRequest(await params));
}

export default async function Page({ params }: PageProps<"/q/v/[b]/[c]/[vs]/[t]">) {
  return <SharedVerse req={verseRequest(await params)} />;
}
