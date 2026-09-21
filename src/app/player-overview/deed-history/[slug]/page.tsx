import DeedHistoryDashboard from "@/components/player-overview/deed-history/DeedHistoryDashboard";
import DeedSelector from "@/components/player-overview/deed-history/DeedSelector";
import { getDeedHistory } from "@/lib/backend/actions/deed/deed-history-actions";
import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import { Suspense } from "react";

/**
 * Placeholder slug that only exists to give this route one concrete param.
 *
 * Cache Components requires `generateStaticParams` to return at least one
 * result, and a dynamic route built without it is emitted as a PPR *fallback
 * shell* carrying a postponed state (see the build's prerender-manifest:
 * `routeType: "shell"`). At request time the same route also carries fallback
 * route params, and Next throws `InvariantError` E592 — "postponed state
 * should not be provided when fallback params are provided" — when both meet
 * on a resume. Giving the route one concrete param makes Next build it as a
 * plain blocking page with no shell and no postponed state, so the two can
 * never collide.
 *
 * The slug is not a valid deed uid, so it 404s before any data is fetched —
 * the build never calls the Splinterlands API for it.
 *
 * Remove once vercel/next.js#98647 is fixed.
 */
const SHELL_PLACEHOLDER_SLUG = "__shell__";

export function generateStaticParams(): { slug: string }[] {
  return [{ slug: SHELL_PLACEHOLDER_SLUG }];
}

/**
 * The deed uid is the whole content of this page, so there is nothing worth
 * prerendering ahead of it. Reading `params` at the top level makes the route
 * blocking, which — together with the concrete param above — is what makes
 * Next emit it as a plain page instead of a postponed fallback shell.
 */
export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function DeedHistoryContent({ deedUid }: { deedUid: string }) {
  const { projects, harvests } = await getDeedHistory(deedUid);

  return (
    <DeedHistoryDashboard projects={projects.data} harvests={harvests.data} />
  );
}

function DeedHistoryLoading() {
  return (
    <Box sx={{ padding: 2 }}>
      <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="rectangular" height={300} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={300} sx={{ flex: 1 }} />
      </Box>
    </Box>
  );
}

export default async function DeedHistoryPage({ params }: PageProps) {
  const { slug: deedUid } = await params;

  if (deedUid === SHELL_PLACEHOLDER_SLUG) notFound();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h4">Deed History</Typography>
        <Typography variant="body2" color="text.secondary">
          {deedUid}
        </Typography>
        <DeedSelector currentDeedUid={deedUid} />
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        This history includes all data from the deed&apos;s lifetime, including
        actions by previous owners. The API does not provide information about
        which player harvested resources or made project changes.
      </Alert>

      <Suspense fallback={<DeedHistoryLoading />}>
        <DeedHistoryContent deedUid={deedUid} />
      </Suspense>
    </Box>
  );
}
