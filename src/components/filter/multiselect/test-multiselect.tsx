"use client";

import MultiSelect from "@/components/filter/multiselect/MultiSelect";
import { Container, Typography } from "@mui/material";
import { useState } from "react";

export default function TestMultiSelectPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const options = ["Apple", "Banana", "Cherry", "Durian"];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Test MultiSelect Component
      </Typography>
      <MultiSelect
        label="Fruits"
        values={options}
        selected={selected}
        onChange={setSelected}
      />
    </Container>
  );
}
