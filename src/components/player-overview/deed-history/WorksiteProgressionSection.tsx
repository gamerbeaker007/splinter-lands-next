"use client";

import { SplDeedProject } from "@/types/deedProjects";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

interface WorksiteProgressionSectionProps {
  projects: SplDeedProject[];
}

export default function WorksiteProgressionSection({
  projects,
}: WorksiteProgressionSectionProps) {
  // Sort projects by project number
  const sortedProjects = [...projects].sort(
    (a, b) => a.project_number - b.project_number
  );

  const getWorksiteLabel = (project: SplDeedProject) => {
    if (project.is_construction) {
      return `${project.token_symbol} Construction`;
    }
    return project.worksite_type || project.project_type;
  };

  const getStatusChip = (project: SplDeedProject) => {
    if (project.is_active) {
      return <Chip label="Active" color="success" size="small" />;
    }
    if (project.destroyed_date) {
      return <Chip label="Destroyed" color="error" size="small" />;
    }
    if (project.completed_date) {
      return <Chip label="Completed" color="info" size="small" />;
    }
    return <Chip label="Inactive" color="default" size="small" />;
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Worksite Progression History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Shows the progression of worksites on this deed over time
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>PP Staked</TableCell>
              <TableCell>PP Spent</TableCell>
              <TableCell>Elapsed Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow
                key={project.id}
                sx={{
                  backgroundColor: project.is_active
                    ? "rgba(76, 175, 80, 0.1)"
                    : "inherit",
                }}
              >
                <TableCell>{project.project_number}</TableCell>
                <TableCell>{getWorksiteLabel(project)}</TableCell>
                <TableCell>
                  <Chip
                    label={project.token_symbol}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{getStatusChip(project)}</TableCell>
                <TableCell>{formatDate(project.start_date)}</TableCell>
                <TableCell>
                  {project.completed_date
                    ? formatDate(project.completed_date)
                    : project.destroyed_date
                      ? formatDate(project.destroyed_date)
                      : "-"}
                </TableCell>
                <TableCell>{project.pp_staked.toLocaleString()}</TableCell>
                <TableCell>{project.pp_spent.toLocaleString()}</TableCell>
                <TableCell>{project.elapsed_hours.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Current Active Project Info */}
      {sortedProjects.find((p) => p.is_active) && (
        <Box
          sx={{
            mt: 2,
            padding: 2,
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            <strong>Current Active Worksite:</strong>
          </Typography>
          {sortedProjects
            .filter((p) => p.is_active)
            .map((project) => (
              <Box key={project.id}>
                <Typography variant="body2">
                  <strong>Project #{project.project_number}:</strong>{" "}
                  {getWorksiteLabel(project)} ({project.token_symbol})
                </Typography>
                <Typography variant="body2">
                  Rewards/Hour: {project.rewards_per_hour.toFixed(3)}{" "}
                  {project.token_symbol}
                </Typography>
                <Typography variant="body2">
                  Grain Required/Hour: {project.grain_req_per_hour.toFixed(1)}
                </Typography>
                {project.projected_amount_received > 0 && (
                  <Typography variant="body2">
                    Ready to Harvest:{" "}
                    {project.projected_amount_received.toFixed(3)}{" "}
                    {project.token_symbol}
                  </Typography>
                )}
              </Box>
            ))}
        </Box>
      )}
    </Paper>
  );
}
