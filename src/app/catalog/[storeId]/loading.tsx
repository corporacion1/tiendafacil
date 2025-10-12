"use client"

import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search } from "lucide-react";

export default function CatalogLoading() {
  return (
    <div className="w-full min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Skeleton className="w-32 h-10" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="text-center mb-12">
          <Skeleton className="h-10 md:h-16 w-3/4 mx-auto" />
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Skeleton className="w-full pl-12 pr-4 py-3 text-base rounded-full h-12" />
            </div>
            <div className="w-full sm:w-auto">
              <Skeleton className="h-12 rounded-full text-base sm:w-[220px]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="overflow-hidden group flex flex-col border rounded-lg">
                <div className="p-0 flex flex-col items-center justify-center aspect-square relative bg-muted">
                    <Package className="w-16 h-16 text-muted-foreground/50" />
                </div>
                <div className="p-2 bg-background/80 mt-auto">
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
