// Column width constants for deed grid
export const COLUMN_WIDTHS = {
  MEDIUM: "120px",
  SMALL: "50px",
  LARGE: "250px",
  EXTRA_LARGE: "250px",
  MEDIUM_PLUS: "80px",
  LARGE_MINUS: "100px",
  MEDIUM_MINUS: "90px",
} as const;

// Calculate total minimum width: 120 + 50 + 50 + 80 + 50 + 100 + 90 + 90 + 90 + 90 + (250*5) + 250 = 2060px
export const TOTAL_MIN_WIDTH = "2060px";
