# Design Document

## Overview

The family management functionality exists but is not working properly. This design outlines the debugging approach and fixes needed to make the existing ManagementCard component work correctly with the families API.

## Architecture

The current architecture is correct:
- **Frontend**: ManagementCard component in Settings page
- **Context**: Settings context manages families state
- **API**: /api/families endpoints handle CRUD operations
- **Database**: MongoDB with Family model

## Components and Interfaces

### Existing Components
1. **ManagementCard**: Generic component that handles units, families, and warehouses
2. **Settings Context**: Provides families data and state management
3. **Family API**: REST endpoints for CRUD operations

### Current Data Flow
```
User Action → ManagementCard → API Call → Database → Context Update → UI Refresh
```

## Data Models

### Family Model (Already exists)
```typescript
interface Family {
  id: string;
  name: string;
  storeId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Request/Response
```typescript
// POST /api/families
Request: { name: string, storeId: string }
Response: Family

// PUT /api/families  
Request: { id: string, name: string, storeId: string }
Response: Family

// DELETE /api/families?id=xxx&storeId=xxx
Response: { message: string }
```

## Error Handling

### Current Issues to Debug
1. **API Parameter Validation**: Ensure storeId is properly passed
2. **State Updates**: Verify context state updates after API calls
3. **Error Messages**: Check if API errors are properly displayed
4. **Network Failures**: Handle connection issues gracefully

### Error Scenarios
- Missing or invalid storeId
- Duplicate family names
- Network connectivity issues
- Database connection problems
- Families in use by products (for deletion)

## Testing Strategy

### Debug Steps
1. **Console Logging**: Add detailed logs to track API calls and responses
2. **Network Tab**: Monitor actual HTTP requests in browser dev tools
3. **State Inspection**: Use React dev tools to verify context state changes
4. **Error Boundaries**: Ensure errors are caught and displayed properly

### Test Cases
1. Add new family with valid name
2. Add family with duplicate name (should fail)
3. Edit existing family name
4. Delete unused family
5. Attempt to delete family in use by products
6. Handle network failures gracefully

## Implementation Plan

### Phase 1: Debugging
- Add comprehensive logging to ManagementCard
- Verify API endpoint responses
- Check activeStoreId availability
- Monitor context state updates

### Phase 2: Fixes
- Fix any parameter passing issues
- Improve error message display
- Ensure proper state synchronization
- Add loading states if missing

### Phase 3: Validation
- Test all CRUD operations
- Verify error handling
- Confirm UI updates correctly
- Check integration with product usage validation