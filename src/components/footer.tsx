
"use client"

import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp, FaTiktok } from "react-icons/fa";
import { useSettings } from "@/contexts/settings-context";
import { usePathname } from 'next/navigation';


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
      url: `https://wa.me/584126915593`,
      enabled: true, // Always show this based on user request
    },
    {
      name: "TikTok",
      icon: FaTiktok,
      url: `https://www.tiktok.com/@corporacion1+`,
      enabled: true, // Always show this based on user request
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: `https://www.instagram.com/corporacion1plus`,
      enabled: true, // Always show this based on user request
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/corporacion1plus`,
      enabled: true, // Always show this based on user request
    },
  ];

  const enabledSocialLinks = socialLinks.filter(link => link.enabled);

  return (
    <footer className="mt-auto border-t bg-background px-4 py-4 sm:px-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
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
