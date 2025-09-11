import { CircularProgress, Container, Stack, Typography } from "@mui/material";

type Props = {
  title: string;
};

export default function LoadingComponent({ title }: Props) {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        minHeight="40vh"
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
    </Container>
  );
}
