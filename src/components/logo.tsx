
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("relative", className)}>
    <Image
      src="https://www.dropbox.com/scl/fi/v5wt3p3hjeg8zgl9y1vrv/tienda_facil_logo-removebg.png?rlkey=i75kyfbtb89wvb1zcopf06p69&raw=1"
      alt="Tienda Facil Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);
