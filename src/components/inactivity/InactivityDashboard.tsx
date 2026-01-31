"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { InactivityAnalysis } from "@/types/inactivity";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface InactivityDashboardProps {
  data: InactivityAnalysis;
}

export default function InactivityDashboard({
  data,
}: InactivityDashboardProps) {
  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Deed Inactivity Analysis
      </Typography>

      {/* Summary Cards */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        sx={{ mb: 4 }}
        flexWrap="wrap"
      >
        <Card sx={{ flex: "1 1 250px" }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Deeds
            </Typography>
            <Typography variant="h4">
              {formatNumberWithSuffix(data.totalDeeds)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 250px" }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              With Rewards
            </Typography>
            <Typography variant="h4">
              {formatNumberWithSuffix(data.totalWithRewards)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {((data.totalWithRewards / data.totalDeeds) * 100).toFixed(1)}% of
              total
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 250px", bgcolor: "success.dark" }}>
          <CardContent>
            <Typography color="text.secondary">Active Deeds</Typography>
            <Typography color="text.secondary" fontSize={10}>
              (last operation &lt; 2 weeks)
            </Typography>
            <Typography variant="h4">
              {formatNumberWithSuffix(data.activeDeeds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {((data.activeDeeds / data.totalWithRewards) * 100).toFixed(1)}%
              of deeds with rewards
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 250px", bgcolor: "error.dark" }}>
          <CardContent>
            <Typography color="text.secondary">Inactive Deeds</Typography>
            <Typography color="text.secondary" fontSize={10}>
              (last operation &gt; 2 weeks)
            </Typography>
            <Typography variant="h4">
              {formatNumberWithSuffix(data.inactiveDeeds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {((data.inactiveDeeds / data.totalWithRewards) * 100).toFixed(1)}%
              of deeds with rewards
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Inactivity Buckets */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Inactivity Distribution
        </Typography>
        <Box height={500}>
          <FullscreenPlotWrapper
            data={[
              {
                x: data.buckets.map((b) => b.label),
                y: data.buckets.map((b) => b.count),
                type: "bar",
                name: "Inactive Deeds",
                marker: {
                  color: data.buckets.map((b) => {
                    // Color gradient based on age
                    if (b.minWeeks < 8) return "#FF6B6B"; // Recent inactive (red)
                    if (b.minWeeks < 24) return "#FFA500"; // Medium inactive (orange)
                    if (b.minWeeks < 48) return "#FFD700"; // Long inactive (yellow)
                    return "#8B0000"; // Very long inactive (dark red)
                  }),
                },
                text: data.buckets.map(
                  (b) =>
                    `${formatNumberWithSuffix(b.count)}<br>${((b.count / data.inactiveDeeds) * 100).toFixed(1)}%`
                ),
                textposition: "auto",
                hovertemplate: "<b>%{x}</b><br>" + "Count: %{y}<br>",
              },
            ]}
            layout={{
              title: { text: "Inactive Deed Distribution by Time Period" },
              xaxis: {
                title: { text: "Inactivity Period" },
                // tickangle: -45,
              },
              yaxis: {
                title: { text: "Number of Deeds" },
              },
              hovermode: "closest",
              showlegend: false,
              margin: { t: 50, l: 50, r: 50, b: 100 },
            }}
          />
        </Box>
      </Box>

      {/* Player Rankings */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Top 50 Players by Inactive Deeds
        </Typography>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Total Deeds</TableCell>
                <TableCell align="right">Inactive Deeds</TableCell>
                <TableCell align="right">Inactive %</TableCell>
                <TableCell align="right">Avg Inactive (weeks)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.playerRankings.slice(0, 50).map((ranking, index) => (
                <TableRow key={ranking.player} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {ranking.player}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{ranking.totalDeeds}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={ranking.inactiveDeeds}
                      color="error"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {(
                      (ranking.inactiveDeeds / ranking.totalDeeds) *
                      100
                    ).toFixed(1)}
                    %
                  </TableCell>
                  <TableCell align="right">
                    {ranking.averageInactiveWeeks.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Incorrect Deeds */}
      {data.incorrectDeeds.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Incorrect Deed Configurations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deeds where worksite resource doesn&apos;t match deed resource
            (likely not updated since Land 1.75)
          </Typography>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                <strong>{data.incorrectDeeds.length}</strong> incorrect deeds
                found
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Deed UID</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Plot ID</TableCell>
                      <TableCell>Deed Resource</TableCell>
                      <TableCell>Worksite Resource</TableCell>
                      <TableCell align="right">Hours Inactive</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.incorrectDeeds.map((deed) => (
                      <TableRow key={deed.deed_uid} hover>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {deed.deed_uid.substring(0, 12)}...
                          </Typography>
                        </TableCell>
                        <TableCell>{deed.player || "N/A"}</TableCell>
                        <TableCell>{deed.region_name || "N/A"}</TableCell>
                        <TableCell>{deed.plot_id}</TableCell>
                        <TableCell>
                          <Chip
                            label={deed.deed_resource_symbol || "N/A"}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={deed.worksite_resource_token || "N/A"}
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {deed.hours_since_last_op
                            ? formatNumberWithSuffix(deed.hours_since_last_op)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      {/* Detailed Bucket Data */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Detailed Inactive Deed Lists
        </Typography>
        {data.buckets
          .filter((bucket) => bucket.count > 0)
          .map((bucket) => (
            <Accordion key={bucket.label}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  <strong>{bucket.label}</strong> - {bucket.count} deeds
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Region</TableCell>
                        <TableCell>Plot</TableCell>
                        <TableCell>Resource</TableCell>
                        <TableCell>Weeks Inactive</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bucket.deeds.slice(0, 100).map((deed) => (
                        <TableRow key={deed.deed_uid} hover>
                          <TableCell>{deed.player || "N/A"}</TableCell>
                          <TableCell>{deed.region_name || "N/A"}</TableCell>
                          <TableCell>{deed.plot_id}</TableCell>
                          <TableCell>{deed.resource_symbol || "N/A"}</TableCell>
                          <TableCell>
                            {deed.weeks_inactive.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {bucket.deeds.length > 100 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Showing 100 of {bucket.count} deeds
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
      </Paper>
    </Container>
  );
}
