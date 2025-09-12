import { Alert, Container, Stack } from "@mui/material";

type Props = {
  title: string;
};

export default function ErrorComponent({ title }: Props) {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack spacing={3}>
        <Alert severity="error">{title}</Alert>
      </Stack>
    </Container>
  );
}
