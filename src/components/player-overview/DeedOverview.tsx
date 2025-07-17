"use client";

import DeedOverviewTile from "@/components/player-overview/deed-overview-tile/DeedOverviewTile";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { SplCardDetails } from "@/types/splCardDetails";
import { Alert, Box, LinearProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeedCount from "./deed-overview-tile/deed-count/DeedCount";
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
    if (!filters || !player) return;

    const run = async () => {
      try {
        setData([]);
        setProgress(0);
        setTotal(0);
        setWarning(null);
        setLoadingText("Loading deeds...");

        const res = await fetch("/api/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters, player }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const enrichedDeeds: DeedComplete[] = [];

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              const parsed = JSON.parse(line);

              if (parsed.type === "warning") {
                setWarning(parsed.warning);
                continue;
              }

              if (parsed.type === "deed") {
                enrichedDeeds.push(parsed.deed);
                setData([...enrichedDeeds]); // trigger re-render
                setProgress(parsed.index);
                setTotal(parsed.total);
                setLoadingText(
                  `Loading deeds... ${parsed.index} / ${parsed.total}`,
                );
              }
            }
          }
        }

        setLoadingText(null);
      } catch (err) {
        console.error("Failed to load deed data", err);
        setLoadingText("An error occurred while loading deeds.");
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
          {data && data.length > 0 ? (
            <DeedCount deedCount={data?.length ?? 0} />
          ) : (
            <></>
          )}

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
