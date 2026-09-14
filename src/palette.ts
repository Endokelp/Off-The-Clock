// Colors and the contrast math that checks them. Kept apart from theme.ts so the contrast
// assertions in palette.test.ts can run without loading react-native.

// One accent, used for the money figure and the primary action and nowhere else.
export const dark = {
  money: '#6FE3A0',
  onMoney: '#04301C',
  background: '#101418',
  surface: '#161B21',
  surfaceVariant: '#1E242B',
  onSurface: '#E6EBF0',
  onSurfaceVariant: '#C2CAD2',
  outline: '#3A434C',
  error: '#FF8A80',
  // Material 3 fills selected chips and similar controls with the secondary container. Left at
  // the Paper default it arrives as purple, a second accent competing with the money figure.
  selected: '#2A343D',
  onSelected: '#E6EBF0',
};

export const light = {
  money: '#046B3F',
  onMoney: '#FFFFFF',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceVariant: '#EDF1F4',
  onSurface: '#111619',
  onSurfaceVariant: '#434C55',
  outline: '#C3CBD3',
  error: '#B3261E',
  selected: '#DCE3E9',
  onSelected: '#111619',
};

const channel = (value: number) =>
  value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const relativeLuminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5].map((offset) =>
    channel(parseInt(hex.slice(offset, offset + 2), 16) / 255),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (foreground: string, background: string) => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
};

// The 8dp grid. Every margin and padding in the app comes from here rather than a literal.
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
