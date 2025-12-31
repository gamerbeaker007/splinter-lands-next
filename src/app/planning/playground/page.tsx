"use client";

import dynamic from "next/dynamic";

const PlaygroundPageContent = dynamic(
  () => import("@/components/planning/playground/PlaygroundPageContent"),
  { ssr: false }
);

export default function PlaygroundPage() {
  return <PlaygroundPageContent />;
}
