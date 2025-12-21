
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
  const { userProfile, activeStoreId, settings } = useSettings();
  const { canAccess, hasPermission } = usePermissions();

  const userRole = userProfile?.role;

  // Get color classes based on selected palette
  const getColorClasses = () => {
    const palette = settings?.colorPalette || 'blue-orange';

    const colorMap = {
      'blue-orange': {
        active: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
        hover: 'hover:bg-blue-50 hover:text-blue-700',
        icon: 'text-blue-600'
      },
      'purple-pink': {
        active: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
        hover: 'hover:bg-purple-50 hover:text-purple-700',
        icon: 'text-purple-600'
      },
      'green-teal': {
        active: 'bg-gradient-to-r from-green-600 to-teal-600 text-white',
        hover: 'hover:bg-green-50 hover:text-green-700',
        icon: 'text-green-600'
      },
      'red-yellow': {
        active: 'bg-gradient-to-r from-red-600 to-orange-600 text-white',
        hover: 'hover:bg-red-50 hover:text-red-700',
        icon: 'text-red-600'
      },
      'indigo-cyan': {
        active: 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white',
        hover: 'hover:bg-indigo-50 hover:text-indigo-700',
        icon: 'text-indigo-600'
      },
      'slate-amber': {
        active: 'bg-gradient-to-r from-slate-600 to-amber-600 text-white',
        hover: 'hover:bg-slate-50 hover:text-slate-700',
        icon: 'text-slate-600'
      }
    };

    return colorMap[palette];
  };

  const colors = getColorClasses();

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

  const renderLink = (item: typeof filteredNavItems[0]) => {
    const isActive = pathname === item.href;

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                isActive
                  ? colors.active
                  : `text-muted-foreground ${colors.hover}`,
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-white" : ""
              )} />
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
  };

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
          <Logo className={cn(
            "transition-all duration-300",
            isExpanded ? "h-10 w-10 max-w-[40px] max-h-[40px]" : "h-8 w-8 max-w-[32px] max-h-[32px]"
          )} />
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
