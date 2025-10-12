
"use client";

// This layout is now simpler, as the parent layout handles the footer.
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
