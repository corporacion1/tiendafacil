
'use client';
import { useSettings } from '@/contexts/settings-context';

export function useUser() {
  const { userProfile, isLoadingSettings } = useSettings();

  return {
    user: userProfile,
    isUserLoading: isLoadingSettings,
    userError: null
  };
}
