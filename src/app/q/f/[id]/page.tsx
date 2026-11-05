import type { Metadata } from "next";
import { SharedVerse, sharedMetadata } from "@/app/q/shared";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/q/f/[id]">): Promise<Metadata> {
  return sharedMetadata({ kind: "founder", id: (await params).id });
}

export default async function Page({ params }: PageProps<"/q/f/[id]">) {
  return <SharedVerse req={{ kind: "founder", id: (await params).id }} />;
}
