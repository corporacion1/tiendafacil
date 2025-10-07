
'use client';

// This file is now simplified as we are not using Firebase.
// We keep the structure to make it easy to reconnect later.

// Mock User object for offline development
export const mockUser = {
  uid: 'demo-super-admin-id',
  displayName: 'Super Admin',
  email: 'corporacion1@gmail.com',
  photoURL: null,
};

// Mock Auth State Hook
export const useUser = () => ({
  user: mockUser,
  isUserLoading: false,
  userError: null,
});

// Export hooks and providers
export * from './provider';
export * from './client-provider';
export * from './errors';
export * from './error-emitter';
