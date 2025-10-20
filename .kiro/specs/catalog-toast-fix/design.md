# Design Document

## Overview

The "Maximum update depth exceeded" error is occurring in the toast system after removing authentication restrictions from the catalog. This is a classic React infinite re-render issue where state updates are triggering more state updates in an endless cycle. The error specifically points to the Toast component and Toaster component, indicating the problem is in the toast state management or context dependencies.

## Root Cause Analysis

Based on the error stack trace and code examination, the issue likely stems from:

1. **Context Dependency Loops**: The Settings Context or Auth Context may be causing cascading re-renders
2. **useEffect Dependencies**: Missing or incorrect dependencies in useEffect hooks
3. **Toast State Management**: The toast hook may be triggering state updates that cause re-renders
4. **Authentication State Changes**: Removing auth restrictions may have exposed existing state management issues

## Architecture

### Current Toast System Flow
```
User Action → toast() function → dispatch(ADD_TOAST) → memoryState update → 
listeners notify → setState in useToast → component re-render → 
Toast component renders → potential infinite loop
```

### Problem Areas Identified

1. **Settings Context**: Large context with many state variables and useEffect hooks
2. **Toast Hook**: Global state management with listeners array
3. **Catalog Page**: Multiple useEffect hooks with complex dependencies
4. **Authentication Integration**: State changes when auth restrictions were removed

## Components and Interfaces

### Toast System Components
- `useToast` hook: Global toast state management
- `Toaster` component: Renders all active toasts
- `Toast` component: Individual toast rendering
- Toast state: Global memory state with listeners

### Context Dependencies
- `SettingsContext`: Provides app data and settings
- `AuthContext`: Manages user authentication
- `useToast`: Independent toast state management

## Data Models

### Toast State Structure
```typescript
interface State {
  toasts: ToasterToast[]
}

interface ToasterToast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
```

### Context State Issues
- Settings context has 14+ state variables
- Multiple useEffect hooks with complex dependencies
- Potential circular dependencies between contexts

## Error Handling

### Infinite Loop Prevention
1. **Stabilize Context Values**: Use useCallback and useMemo for context values
2. **Fix useEffect Dependencies**: Ensure all dependencies are properly declared
3. **Toast State Isolation**: Prevent toast state from triggering context re-renders
4. **Authentication State Handling**: Handle undefined/null auth states gracefully

### Debugging Strategy
1. Add console logs to identify which component is causing the loop
2. Check useEffect dependency arrays in Settings Context
3. Verify toast state management doesn't trigger context updates
4. Test with authentication disabled vs enabled

## Testing Strategy

### Unit Testing
- Test toast hook in isolation
- Test context providers without toast integration
- Test catalog page with mocked contexts

### Integration Testing
- Test full catalog flow with toast notifications
- Test authentication state changes
- Test context switching scenarios

### Error Reproduction
1. Load catalog page
2. Trigger any action that shows a toast
3. Monitor console for infinite loop errors
4. Identify specific component causing the issue

## Implementation Plan

### Phase 1: Immediate Fix
1. Identify the specific useEffect or state update causing the loop
2. Add proper dependency arrays or memoization
3. Stabilize context values that may be changing on every render

### Phase 2: Context Optimization
1. Split large Settings Context into smaller contexts
2. Memoize expensive context values
3. Optimize useEffect hooks with proper dependencies

### Phase 3: Toast System Hardening
1. Add safeguards against infinite loops in toast system
2. Implement toast deduplication
3. Add error boundaries around toast components

## Specific Fixes Needed

### Settings Context Issues
- The `loadDataFromMongoDB` function is recreated on every render
- Multiple useEffect hooks may have missing dependencies
- Context value object is recreated on every render

### Toast Hook Issues
- Global listeners array may cause memory leaks
- State updates may trigger cascading re-renders
- Missing cleanup in useEffect

### Catalog Page Issues
- Multiple useEffect hooks with complex dependencies
- Authentication state changes may trigger loops
- Context dependencies may be unstable

## Success Criteria

1. Catalog page loads without console errors
2. Toast notifications work properly for all user actions
3. No infinite re-render loops in any component
4. Both authenticated and unauthenticated users can use the catalog
5. Application performance remains stable