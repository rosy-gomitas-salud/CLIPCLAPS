import "./globals.css";
export const metadata = {
  title: "CLIPCLAPS — Mira, disfruta y gana",
  description: "Videos cortos, comunidad y recompensas de prueba en CLIPCLAPS.",
  manifest: "/manifest.webmanifest",
  themeColor: "#090b14"
};
export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}
