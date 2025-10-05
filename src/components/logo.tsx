
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 500 500"
    className={cn("fill-current", className)}
  >
    <path
      d="M249.77,0A250,250,0,0,0,84.4,451.35V161.42H249.77Z"
      style={{
        fill: "hsl(var(--primary))",
      }}
    />
    <path
      d="M249.77,0V161.42h165.6a250,250,0,0,0-165.6-161.42Z"
      style={{
        fill: "hsl(var(--accent))",
      }}
    />
    <path
      d="M84.4,451.35A250,250,0,0,0,415.37,161.42H84.4Z"
      style={{
        fill: "hsl(var(--secondary))",
      }}
    />
  </svg>
);
