"use client";

import {
  formatNumber,
  toPascalCaseLabel,
} from "@/scripts/lib/utils/string_util";
import {
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_grain_farm_icon_url,
  land_keep_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
  land_under_construction_icon_url,
} from "@/scripts/statics_icon_urls";
import Image from "next/image";
import { useEffect, useState } from "react";

const worksiteTypeMapping: { [key: string]: string } = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
  KEEP: land_keep_icon_url,
  CASTLE: land_castle_icon_url,
  Undeveloped: land_under_construction_icon_url,
};

export default function WorksiteTypeTile() {
  const [worksiteType, setWorksiteType] = useState<JSON | null>(null);

  useEffect(() => {
    fetch("/api/deed")
      .then((res) => res.json())
      .then(setWorksiteType)
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="card bg-accent-content rounded-3xl shadow-md p-4">
        {worksiteType ? (
          <div className="flex flex-wrap gap-4 justify-start">
            {Object.entries(worksiteType).map(([type, count]) => {
              const imageUrl =
                worksiteTypeMapping[type] ?? worksiteTypeMapping["Undeveloped"];
              return (
                <div
                  key={type}
                  className="w-[100px] h-[200px] border rounded-lg shadow-md p-4 bg-base-100 flex flex-col justify-between"
                  title={type ? type : "Undeveloped"}
                >
                  <div className="relative w-full aspect-[1/1] h-24 mb-2 rounded overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={type}
                      fill
                      className="object-contain"
                      sizes="100px"
                    />
                  </div>
                  <div className="font-bold text-center text-s h-15 flex items-start justify-center">
                    {toPascalCaseLabel(type)}
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Count: {formatNumber(count)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-center text-gray-500">
            Loading worksite data...
          </span>
        )}
      </div>
    </>
  );
}
