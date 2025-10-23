
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile, UserRole } from "@/lib/types";

import { getNavItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useMemo } from "react";
import { Home } from 'lucide-react';

interface SiteSidebarProps {
  isExpanded: boolean;
}

export function SiteSidebar({ isExpanded }: SiteSidebarProps) {
    const pathname = usePathname();
    const { userProfile, activeStoreId } = useSettings();
    const { canAccess, hasPermission } = usePermissions();

    const userRole = userProfile?.role;

    const filteredNavItems = useMemo(() => {
        // Generar elementos de navegación con activeStoreId dinámico
        const currentStoreId = activeStoreId || 'ST-1234567890123';
        const dynamicNavItems = getNavItems(currentStoreId);
        
        // Filtrar elementos de navegación basado en permisos
        return dynamicNavItems.filter(item => {
            // Extraer la ruta base sin parámetros de query
            const route = item.href.split('?')[0];
            return canAccess(route);
        });
    }, [canAccess, activeStoreId]);

    const renderLink = (item: typeof filteredNavItems[0]) => (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary',
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn("transition-all duration-300", !isExpanded && "hidden")}>{item.label}</span>
            </Link>
          </TooltipTrigger>
          {!isExpanded && (
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );

    const filteredAdminNavItems = useMemo(() => {
        return (adminNavItems || []).filter(item => {
            const route = item.href.split('?')[0];
            return canAccess(route);
        });
    }, [canAccess]);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
            isExpanded ? "w-56" : "w-20 sidebar-collapsed"
        )}>
            {/* Header fijo */}
            <div className={cn(
                "flex h-[60px] items-center border-b justify-center flex-shrink-0",
                isExpanded ? "px-6" : "justify-center"
            )}>
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-28 w-28" />
                </Link>
            </div>
            
            {/* Contenido scrolleable */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Navegación principal con scroll */}
                <nav className="flex flex-col gap-2 p-2 font-medium overflow-y-auto flex-1 sidebar-scroll">
                    {filteredNavItems.map((item) => (
                        <div key={item.href}>{renderLink(item)}</div>
                    ))}
                    {filteredAdminNavItems.map((item) => (
                        <div key={item.href}>{renderLink(item)}</div>
                    ))}
                </nav>
                
                {/* Footer fijo */}
                <nav className="flex flex-col gap-2 p-2 font-medium border-t border-border/50 flex-shrink-0">
                     {hasPermission('canViewSettings') && renderLink(settingsNav)}
                </nav>
            </div>
        </aside>
    );
}
