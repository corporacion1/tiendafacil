
"use client";

import { Footer } from "@/components/footer";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
