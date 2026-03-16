import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tachyon Auth Sample",
  description: "OAuth2/OIDC integration sample with Tachyon Auth Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0a0a",
          color: "#ededed",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
