"use client";

import DeedOverviewTile from "@/components/player-overview/deed-overview-tile/DeedOverviewTile";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { SplCardDetails } from "@/types/splCardDetails";
import { Alert, Box, LinearProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeedCount from "./deed-overview-tile/deed-count/DeedCount";

const DEED_LIMIT = 200;

type Props = {
  player: string;
};

export default function DeedOverview({ player }: Props) {
  const [data, setData] = useState<DeedComplete[] | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);

  const [cardDetails, setCardDetails] = useState<SplCardDetails[] | null>(null);

  const { filters } = useFilters();
  useEffect(() => {
    fetch("/api/card-details", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setCardDetails)
      .catch(console.error);
  }, [filters, player]);

  useEffect(() => {
    if (!filters) return;
    if (!player || player == "") {
      setData(null);
      setLoadingText(null);
      return;
    }

    const run = async () => {
      try {
        setLoadingText("Fetching base player data...");
        setData(null);
        setProgress(0);
        setTotal(0);
        setWarning(null);

        const baseDeeds = await fetchBaseDeeds(player, filters);

        if (baseDeeds.length > 0) {
          if (baseDeeds.length > DEED_LIMIT) {
            setWarning(
              `Showing only ${DEED_LIMIT} of ${baseDeeds.length} deeds due to performance limits.`,
            );
          }

          const deedsToEnrich = baseDeeds.slice(0, DEED_LIMIT);
          const enrichedDeeds = await streamEnrichedDeeds(
            deedsToEnrich,
            setProgress,
            setTotal,
            setLoadingText,
          );

          setData(enrichedDeeds);
          setLoadingText(null);
        } else {
          setWarning(`No data found for player: ${player}`);
          setData(null);
          setLoadingText(null);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    };

    run();
  }, [filters, player]);

  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
          {total > 0 && (
            <LinearProgress
              variant="determinate"
              value={(progress / total) * 100}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      ) : (
        <>
          {warning && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              {warning}
            </Alert>
          )}
          <DeedCount deedCount={data?.length ?? 0} />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1, // space between tiles
              // justifyContent: "center",
            }}
          >
            {cardDetails && data && data.length > 0 ? (
              data.map((deed) => (
                <Box
                  key={deed.deed_uid}
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    padding: 1,
                    minWidth: 250,
                  }}
                >
                  <DeedOverviewTile data={deed} cardDetails={cardDetails} />
                </Box>
              ))
            ) : (
              <Typography>No data</Typography>
            )}
          </Box>
        </>
      )}
    </>
  );
}

async function fetchBaseDeeds(
  player: string,
  filters: FilterInput,
): Promise<DeedComplete[]> {
  const res = await fetch("/api/player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters: filters, player: player }),
  });
  return await res.json();
}

async function streamEnrichedDeeds(
  deeds: DeedComplete[],
  setProgress: (val: number) => void,
  setTotal: (val: number) => void,
  setLoadingText: (msg: string | null) => void,
): Promise<DeedComplete[]> {
  setLoadingText("Loading staked assets...");

  const enriched: DeedComplete[] = [];
  const res = await fetch("/api/player/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deeds }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        try {
          const { index, total: totalCount, deed } = JSON.parse(chunk);
          enriched.push(deed);
          setProgress(index);
          setTotal(totalCount);
          setLoadingText(`Loading staked assets... ${index} / ${totalCount}`);
        } catch (err) {
          console.error("Failed to parse chunk:", chunk, err);
        }
      }
    }
  }

  return enriched;
}
