
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSettings } from "@/contexts/settings-context";

const DEFAULT_LOGO_URL = "https://www.dropbox.com/scl/fi/apl8e6ymm6wel3coa10a9/tienda_facil_logo.svg?rlkey=jn7j3dezgn1ovbl35vapk5ap5&raw=1";

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
        unoptimized // Important for external URLs that are not in next.config.js
      />
    </div>
  );
};
