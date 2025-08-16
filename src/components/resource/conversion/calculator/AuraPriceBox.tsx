import { Box, Typography, Stack, Avatar, Divider } from "@mui/material";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";

type Prices = Record<string, number>;

type AuraPriceBoxProps = {
  prices: Prices;
};

const AURA_SOURCES = [
  { key: "aura", label: "Midnight Potion", icon: "MIDNIGHTPOT" },
  { key: "aura_am", label: "Auction Mark", icon: "AM" },
  { key: "aura_ft", label: "Fortune Ticket", icon: "FT" },
  { key: "aura_wagonkit", label: "Wagon Repair Kit", icon: "WAGONKIT" },
];

export default function AuraPriceBox({ prices }: AuraPriceBoxProps) {
  return (
    <Box
      sx={{
        border: "1px solid #ccc",
        borderRadius: 2,
        p: 2,
        width: "100%",
        maxWidth: 360,
        textAlign: "center",
        backgroundColor: "background.paper",
      }}
    >
      {/* Top: AURA Icon */}
      <Stack spacing={1} alignItems="center" mb={2}>
        <Avatar
          src={RESOURCE_ICON_MAP["AURA"]}
          alt="AURA"
          sx={{ width: 48, height: 48 }}
        />
        <Typography variant="h6">AURA Price Sources</Typography>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {/* Each Source Row */}
      <Stack spacing={1}>
        {AURA_SOURCES.map(({ key, label, icon }) => (
          <Stack
            key={key}
            direction="row"
            alignItems="center"
            spacing={2}
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                src={RESOURCE_ICON_MAP[icon]}
                alt={icon}
                sx={{ width: 28, height: 28 }}
              />
              <Typography variant="body2">{label}</Typography>
            </Stack>
            <Box
              display={"flex"}
              flexWrap={"wrap"}
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Typography variant="body2" fontWeight="bold">
                {prices[key]?.toFixed(3) ?? "N/A"}
              </Typography>
              <Avatar
                src={RESOURCE_ICON_MAP["DEC"]}
                alt="AURA"
                sx={{ width: 25, height: 25 }}
              />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
