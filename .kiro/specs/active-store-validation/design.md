# Design Document

## Overview

The Automatic Store Assignment System is designed to automatically set the active store ID for administrative users upon login and validate store access across all application pages (except catalog). The system integrates with the existing authentication flow and ensures that users can only access data from stores they are authorized to view.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[User Login] --> B{Role Check}
    B -->|role: "su"| C[No Store Assignment]
    B -->|role: "user"| D[No Store Assignment]
    B -->|Other Roles| E[Auto Store Assignment]
    
    E --> F[Set activeStoreID = userStoreID]
    F --> G[Store Redirect]
    
    H[Page Navigation] --> I{Page Check}
    I -->|Catalog Page| J[Allow Access]
    I -->|Other Pages| K[Store Validation]
    
    K --> L{Role & Store Check}
    L -->|role: "su"| M[Allow Access]
    L -->|activeStoreID == userStoreID| N[Allow Access]
    L -->|Mismatch| O[Redirect to Unauthorized]
```

### Component Architecture

The system consists of four main components:

1. **Login Store Setter**: Handles automatic store assignment during authentication
2. **Store Redirect Handler**: Manages redirection to appropriate store context
3. **Store Access Validator**: Validates store access on page navigation
4. **Store Context Manager**: Manages active store state throughout the application

## Components and Interfaces

### 1. Login Store Setter

**Purpose**: Automatically sets the active store ID for administrative users during login.

**Location**: Integrated into the existing `AuthContext.tsx`

**Interface**:
```typescript
interface LoginStoreSetter {
  setActiveStoreForUser(user: UserProfile): Promise<void>;
  shouldSetActiveStore(userRole: UserRole): boolean;
}
```

**Implementation Details**:
- Extends the existing `login` function in `AuthContext`
- Checks user role after successful authentication
- Sets `activeStoreID` in localStorage and context for administrative users
- Triggers redirect for users that need store assignment

### 2. Store Redirect Handler

**Purpose**: Redirects administrative users to their designated store context after login.

**Location**: New utility component integrated with authentication flow

**Interface**:
```typescript
interface StoreRedirectHandler {
  redirectToStoreContext(storeId: string): void;
  getStoreRedirectUrl(storeId: string): string;
}
```

**Implementation Details**:
- Constructs redirect URLs based on user's assigned store
- Handles redirect failures gracefully
- Integrates with Next.js router for navigation

### 3. Store Access Validator

**Purpose**: Validates store access on all pages except catalog.

**Location**: Next.js middleware (`middleware.ts`)

**Interface**:
```typescript
interface StoreAccessValidator {
  validateStoreAccess(request: NextRequest): Promise<NextResponse>;
  isExemptRoute(pathname: string): boolean;
  isAuthorizedUser(user: UserProfile, activeStoreId: string): boolean;
}
```

**Implementation Details**:
- Runs as Next.js middleware before page rendering
- Checks user role and store assignment
- Redirects unauthorized users to error page
- Exempts catalog page and authentication routes

### 4. Store Context Manager

**Purpose**: Manages active store state throughout the application.

**Location**: New context provider or extension of existing `AuthContext`

**Interface**:
```typescript
interface StoreContextManager {
  activeStoreId: string | null;
  setActiveStoreId(storeId: string): void;
  clearActiveStoreId(): void;
  getActiveStoreId(): string | null;
}
```

**Implementation Details**:
- Persists active store ID in localStorage
- Provides methods to get/set active store
- Integrates with existing authentication context

## Data Models

### Extended User Session
```typescript
type ExtendedUserSession = {
  user: UserProfile;
  token: string;
  activeStoreId?: string; // New field for active store
}
```

### Store Validation Result
```typescript
type StoreValidationResult = {
  isValid: boolean;
  reason?: 'unauthorized_role' | 'store_mismatch' | 'no_store_assigned';
  redirectUrl?: string;
}
```

## Error Handling

### Authentication Errors
- **No Store Assigned**: Prevent login completion for administrative users without store assignment
- **Invalid Store**: Handle cases where user's assigned store doesn't exist
- **Session Restoration**: Gracefully handle missing active store ID on session restore

### Validation Errors
- **Store Mismatch**: Redirect to unauthorized page with clear error message
- **Missing Context**: Handle cases where store context is not available
- **Network Errors**: Graceful fallback when store validation fails

### Error Pages
- **Unauthorized Access**: `/unauthorized` - Clear message about store access restrictions
- **Store Not Found**: `/store-not-found` - Handle invalid store references

## Testing Strategy

### Unit Tests
- **Login Store Setter**: Test role-based store assignment logic
- **Store Access Validator**: Test validation rules for different user roles
- **Store Context Manager**: Test state management and persistence

### Integration Tests
- **Authentication Flow**: Test complete login process with store assignment
- **Page Navigation**: Test store validation across different routes
- **Role-Based Access**: Test access patterns for different user roles

### End-to-End Tests
- **Administrative User Journey**: Login → Auto-assignment → Page access
- **End User Journey**: Login → Free navigation → Catalog access
- **Super User Journey**: Login → Unrestricted access

## Implementation Plan Integration

### Phase 1: Core Infrastructure
- Extend AuthContext with store management
- Implement Login Store Setter
- Create Store Context Manager

### Phase 2: Validation System
- Implement Next.js middleware for store validation
- Create Store Access Validator
- Add error handling and redirect logic

### Phase 3: User Experience
- Implement Store Redirect Handler
- Create unauthorized access pages
- Add user feedback and error messages

### Phase 4: Testing and Refinement
- Comprehensive testing across all user roles
- Performance optimization
- Error handling refinement

## Security Considerations

### Access Control
- Validate user permissions on both client and server side
- Ensure store assignments cannot be manipulated by users
- Implement proper session management for store context

### Data Protection
- Prevent users from accessing data outside their assigned store
- Validate store ownership on all API requests
- Implement audit logging for unauthorized access attempts

### Session Security
- Secure storage of active store ID
- Proper cleanup on logout
- Handle session expiration gracefully

## Performance Considerations

### Middleware Optimization
- Minimize middleware execution time
- Cache user role and store information
- Efficient route matching for exemptions

### Context Management
- Optimize store context updates
- Minimize re-renders on store changes
- Efficient localStorage operations

### Network Efficiency
- Batch store validation requests
- Cache store information
- Minimize API calls for store data

## Compatibility

### Existing Systems
- Full compatibility with current authentication system
- No breaking changes to existing user management
- Seamless integration with current routing

### Future Enhancements
- Extensible design for additional validation rules
- Support for multi-store user assignments
- Integration with future role-based features