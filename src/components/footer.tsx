
"use client"

import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp, FaTiktok } from "react-icons/fa";
import { useSettings } from "@/contexts/settings-context";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";


export function Footer() {
  const { settings } = useSettings();
  const pathname = usePathname();
  
  // Do not render the footer on the main catalog page
  if (pathname === '/catalog') {
    return null;
  }

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: `https://wa.me/${settings?.whatsapp?.replace(/\D/g, '') || '584126915593'}`,
      enabled: !!settings?.whatsapp,
    },
    {
      name: "TikTok",
      icon: FaTiktok,
      url: `https://www.tiktok.com/@${settings?.tiktok?.replace('@', '') || 'corporacion10'}`,
      enabled: !!settings?.tiktok,
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: `https://www.instagram.com/${settings?.meta?.replace('@', '') || 'corporacion1plus'}`,
      enabled: !!settings?.meta,
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/corporacion1plus`,
      enabled: true, // This one is still hardcoded as per original user request
    },
  ];

  const enabledSocialLinks = socialLinks.filter(link => link.enabled);

  return (
    <footer className={cn("hidden md:block mt-auto border-t bg-background px-4 py-2 sm:px-6")}>
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-loose text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} Corporación 1 Plus, CA. Todos los derechos reservados.
        </p>
        {enabledSocialLinks.length > 0 && (
          <div className="flex items-center gap-2">
            {enabledSocialLinks.map((social) => (
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
        )}
      </div>
    </footer>
  );
}
