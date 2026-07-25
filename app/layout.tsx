import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchoVerse — AI Audio Drama Studio",
  description: "Turn a sentence into a scene you can feel. AI audio drama, generated with OpenAI voices and ElevenLabs atmosphere.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
