
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("relative", className)}>
    <Image
      src="https://www.dropbox.com/scl/fi/apl8e6ymm6wel3coa10a9/tienda_facil_logo.svg?rlkey=jn7j3dezgn1ovbl35vapk5ap5&raw=1"
      alt="Tienda Facil Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);

    