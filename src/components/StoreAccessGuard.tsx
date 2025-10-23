'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

// Routes that are exempt from store validation
const EXEMPT_ROUTES = [
  '/',
  '/login',
  '/register',
  '/catalog',
  '/unauthorized',
  '/api',
  '/_next',
  '/favicon.ico',
];

// Helper function to check if route is exempt from validation
function isExemptRoute(pathname: string): boolean {
  return EXEMPT_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

// Helper function to check if user role is exempt from validation
function isUserRoleExempt(userRole: UserRole): boolean {
  return userRole === 'su';
}

export default function StoreAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, activeStoreId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't validate while loading or on exempt routes
    if (loading || isExemptRoute(pathname)) {
      return;
    }

    try {
      // If no user, redirect to login
      if (!user) {
        console.log(`🔒 No user session, redirecting to login from: ${pathname}`);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Super users are exempt from store validation
      if (isUserRoleExempt(user.role)) {
        console.log(`👑 Super user access granted: ${user.email}`);
        return;
      }

      // End users (role: 'user') are exempt from store validation
      if (user.role === 'user') {
        console.log(`🛒 End user access granted: ${user.email}`);
        return;
      }

      // For administrative users, validate store access
      if (user.role !== 'user' && user.role !== 'su') {
        console.log(`🔍 [StoreAccessGuard] Validating administrative user: ${user.email} (${user.role}) on ${pathname}`);
        
        // Check if user has a store assigned
        if (!user.storeId) {
          console.error(`❌ Administrative user ${user.email} has no store assigned`);
          router.push('/unauthorized?reason=no_store_assigned');
          return;
        }

        console.log(`🔍 [StoreAccessGuard] User storeId: ${user.storeId}, activeStoreId: ${activeStoreId}`);

        // Check if active store matches user's assigned store
        if (!activeStoreId || activeStoreId !== user.storeId) {
          console.warn(`🚫 Store access denied for ${user.email}: activeStoreId(${activeStoreId}) !== userStoreId(${user.storeId}) on ${pathname}`);
          
          // Log unauthorized access attempt
          const logData = {
            timestamp: new Date().toISOString(),
            user: user.email,
            userRole: user.role,
            userStoreId: user.storeId,
            activeStoreId: activeStoreId,
            attemptedPath: pathname,
            reason: 'store_mismatch'
          };
          console.warn('🚨 Unauthorized access attempt:', logData);
          
          router.push('/unauthorized?reason=store_mismatch');
          return;
        }

        console.log(`✅ Store access granted for ${user.role} (${user.email}): ${activeStoreId} on ${pathname}`);
      }
    } catch (error) {
      console.error('❌ Error in StoreAccessGuard:', error);
      // On error, redirect to unauthorized page
      router.push('/unauthorized?reason=validation_error');
    }
  }, [user, activeStoreId, loading, pathname, router]);

  // Show loading while validating
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}