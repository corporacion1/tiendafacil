
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("relative", className)}>
    <Image
      src="https://www.dropbox.com/scl/fi/kuewv83r2uycd7zg6eahk/tienda_facil_logo-off.png?rlkey=hr4mnu9gdwm38zkj1jqhs96ln&raw=1"
      alt="Tienda Facil Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);
