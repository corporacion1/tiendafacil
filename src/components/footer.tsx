
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "./button";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 7.5a4.5 4.5 0 0 1-4.5 4.5H12v7.5a3 3 0 0 1-6 0" />
        <path d="M16.5 3a4.5 4.5 0 0 1 4.5 4.5" />
    </svg>
);


const socialLinks = [
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://www.instagram.com/corporacion1plus",
  },
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://www.facebook.com/corporacion1plus",
  },
  {
    name: "X",
    icon: Twitter,
    url: "https://x.com/corporacion1plus",
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    url: "https://www.tiktok.com/@corporacion1plus",
  }
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background px-4 py-4 sm:px-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} Corporación 1 Plus, CA. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => (
            <Button
              key={social.name}
              variant="ghost"
              size="icon"
              asChild
            >
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon className="h-4 w-4" />
                <span className="sr-only">{social.name}</span>
              </a>
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
}
