export const colors = {
  background: "#FFFFFF",
  surface: "#F7F7F7",
  surfaceMuted: "#EEEEEE",
  border: "#D1D1D1",
  text: "#111111",
  textMuted: "#666666",
  textSubtle: "#999999",
  inverse: "#FFFFFF",
  inverseBackground: "#111111",
} as const;

export const fonts = {
  display: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
  body: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

export const typography = {
  heading1: { fontFamily: fonts.display.bold, fontSize: 26, lineHeight: 32 },
  heading2: { fontFamily: fonts.display.bold, fontSize: 22, lineHeight: 28 },
  heading3: { fontFamily: fonts.display.semibold, fontSize: 20, lineHeight: 24 },
  heading4: { fontFamily: fonts.display.semibold, fontSize: 19, lineHeight: 24 },
  heading5: { fontFamily: fonts.display.semibold, fontSize: 18, lineHeight: 24 },
  heading6: { fontFamily: fonts.display.semibold, fontSize: 16, lineHeight: 24 },
  paragraphLarge: { fontFamily: fonts.body.regular, fontSize: 16, lineHeight: 24 },
  paragraphSmall: { fontFamily: fonts.body.regular, fontSize: 14, lineHeight: 20 },
} as const;
