import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reflection Pool — Embed",
};

export default function EmbedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, background: "transparent" }}>{children}</body>
    </html>
  );
}
