import DefaultPageTile from "@/components/DefaultPageTile";
import PlayerPageTile from "@/components/PlayerPageTile";

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <DefaultPageTile title="Resource" href="/resource" />
      <DefaultPageTile title="Region Overview" href="/region-overview" />
      <DefaultPageTile
        title="Region Production Overview"
        href="/region-production-overview"
      />
      <PlayerPageTile />
    </div>
  );
}
