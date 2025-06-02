import DefaultPageTile from "@/components/DefaultPageTile";
import PlayerPageTile from "@/components/PlayerPageTile";

const temp_image =
  "https://files.peakd.com/file/peakd-hive/beaker007/23uFPdKf8W8ZX71NBX84EzrbuDWKc44PmSAcGwNRzkmS25BuzUm5ySwCMfrXsDdoAMTYK.png";

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <DefaultPageTile title="Resource" href="/resource" image={temp_image} />
      <DefaultPageTile
        title="Region Overview"
        href="/region-overview"
        image={temp_image}
      />
      <DefaultPageTile
        title="Region Production Overview"
        href="/region-production-overview"
        image={temp_image}
      />
      <PlayerPageTile />
    </div>
  );
}
