import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ThermaMorph - Carbon Footprint AI',
  description:
    "AI-powered carbon footprint awareness platform for buildings. Understand, track, and reduce your building's energy impact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
