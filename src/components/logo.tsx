"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";

const DEFAULT_LOGO_URL = "/tienda_facil_logo.svg";

export const Logo = ({ className }: { className?: string }) => {
  const { settings } = useSettings();
  const logoUrl = settings?.logoUrl || DEFAULT_LOGO_URL;

  return (
    <div className={cn("relative", className)}>
      <Image
        src={logoUrl}
        alt={settings?.name || "Tienda Facil Logo"}
        fill
        className="object-contain"
        priority
      />
    </div>
  );
};
