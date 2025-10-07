
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("relative", className)}>
    <Image
      src="https://i.imgur.com/kS40G2s.png"
      alt="Tienda Facil Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);
