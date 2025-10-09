"use client"

import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp, FaTiktok } from "react-icons/fa";
import { useSettings } from "@/contexts/settings-context";

export function Footer() {
  const { settings } = useSettings();

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: `https://wa.me/${settings?.whatsapp?.replace(/\D/g, '') || ''}`,
      enabled: !!settings?.whatsapp
    },
    {
      name: "TikTok",
      icon: FaTiktok,
      url: `https://www.tiktok.com/@${settings?.tiktok?.replace('@', '') || ''}`,
      enabled: !!settings?.tiktok
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: `https://www.instagram.com/${settings?.meta?.replace('@', '') || ''}`,
      enabled: !!settings?.meta
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/${settings?.meta?.replace('@', '') || ''}`,
      enabled: !!settings?.meta
    },
    {
      name: "X",
      icon: Twitter,
      url: `https://x.com/${settings?.meta?.replace('@', '') || ''}`,
      enabled: !!settings?.meta
    },
  ];


  return (
    <footer className="mt-auto border-t bg-background px-4 py-4 sm:px-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} Corporación 1 Plus, CA. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-2">
          {socialLinks.filter(social => social.enabled).map((social) => (
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
