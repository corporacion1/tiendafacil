"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";
import { Settings } from "@/lib/types";

const DEFAULT_LOGO_URL = "/tienda_facil_logo.svg";

export const Logo = ({ className, settings: propSettings }: { className?: string; settings?: Settings | null }) => {
  const { settings: contextSettings } = useSettings();
  const settings = propSettings !== undefined ? propSettings : contextSettings;
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
