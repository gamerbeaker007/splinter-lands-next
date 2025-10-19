import { useFilters } from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { useState, useEffect } from "react";

export const useTractDeedData = (
  selectedRegion: number | "",
  selectedTract: number | "",
) => {
  const [deeds, setDeeds] = useState<DeedComplete[] | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters || !selectedRegion || !selectedTract) {
      setDeeds(null);
      return;
    }

    const fetchData = async () => {
      setError(null);
      setWarning(null);
      setProgress(0);
      setTotal(0);
      setLoadingText("Loading tract deed data...");

      try {
        const updatedFilters = {
          ...filters,
          filter_regions: [selectedRegion],
          filter_tracts: [selectedTract],
        };

        const response = await fetch("/api/region/tract-deed-overview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFilters),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is streaming (has a body reader)
        const reader = response.body?.getReader();

        if (reader) {
          // Handle streaming response with progress indication
          const decoder = new TextDecoder();
          let buffer = "";
          const enrichedDeeds: DeedComplete[] = [];

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const parsed = JSON.parse(line);

                if (parsed.type === "warning") {
                  setWarning(parsed.warning);
                  continue;
                }

                if (parsed.type === "deed") {
                  enrichedDeeds.push(parsed.deed);
                  setDeeds([...enrichedDeeds]); // trigger re-render with current progress
                  setProgress(parsed.index);
                  setTotal(parsed.total);
                  setLoadingText(
                    `Loading tract deed data... ${parsed.index} / ${parsed.total}`,
                  );
                }
              } catch (parseError) {
                console.warn(
                  "Failed to parse streaming response line:",
                  line,
                  parseError,
                );
              }
            }
          }
        } else {
          // Handle non-streaming response (fallback)
          const data = await response.json();
          setDeeds(data);
        }

        setLoadingText(null);
      } catch (err) {
        console.error("Failed to load tract deed data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoadingText(null);
        setDeeds(null);
      }
    };

    fetchData();
  }, [filters, selectedRegion, selectedTract]);

  return {
    deeds,
    loadingText,
    total,
    error,
    warning,
    setDeeds,
    progressPercentage: total > 0 ? (progress / total) * 100 : 0,
  };
};
