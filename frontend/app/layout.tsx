import "./globals.css";

export const metadata = {
  title: "Horse Farm Management",
  description: "Staff scheduling and lesson balance management"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
