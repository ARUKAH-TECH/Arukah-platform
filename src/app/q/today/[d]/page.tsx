import type { Metadata } from "next";
import { SharedVerse, sharedMetadata } from "@/app/q/shared";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  return sharedMetadata({ kind: "today" });
}

export default async function Page() {
  return <SharedVerse req={{ kind: "today" }} />;
}
