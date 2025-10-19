# Design Document - Stores Administration Module

## Overview

The Stores Administration Module is a comprehensive management interface designed exclusively for super users (role: "su") to oversee all stores within the system. The module provides a centralized dashboard with analytics, detailed store management capabilities, and administrative controls for store operations.

## Architecture

### Component Hierarchy
```
StoresAdministrationPage
├── StoresDashboard (Analytics Cards)
├── StoresManagementInterface
│   ├── StoresFilters
│   ├── StoresTable
│   │   ├── StoreRow
│   │   └── StoreActions
│   └── StoreDetailsModal
└── StoreStatusManager
```

### Data Flow
1. **Authentication Check**: Verify user has "su" role
2. **Data Fetching**: Load all stores with aggregated statistics
3. **Real-time Updates**: Implement periodic data refresh
4. **State Management**: Handle filtering, sorting, and modal states
5. **API Integration**: CRUD operations for store management

## Components and Interfaces

### 1. StoresAdministrationPage
**Location**: `src/app/stores-admin/page.tsx`

**Purpose**: Main page component with role-based access control

**Key Features**:
- Role verification (su only)
- Layout structure
- Data loading orchestration
- Error boundary handling

**State Management**:
```typescript
interface StoresAdminState {
  stores: Store[]
  filteredStores: Store[]
  loading: boolean
  error: string | null
  filters: StoreFilters
  selectedStore: Store | null
  showDetailsModal: boolean
}
```

### 2. StoresDashboard
**Location**: `src/components/stores-admin/stores-dashboard.tsx`

**Purpose**: Analytics dashboard with key metrics

**Cards Structure**:
- **Total Stores**: Count of all stores in system
- **Active Stores**: Stores with status "active"
- **Production Stores**: Stores with useDemoData: false
- **Inactive Stores**: Stores with status "inactive"

**Design Pattern**:
```typescript
interface DashboardCard {
  title: string
  value: number
  icon: LucideIcon
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
}
```

### 3. StoresManagementInterface
**Location**: `src/components/stores-admin/stores-management.tsx`

**Purpose**: Main table interface for store management

**Table Columns**:
- Store ID (storeId)
- Store Name
- Administrator Name (from ownerIds)
- Contact Phone
- Registered Users Count
- Status Badge
- Creation Date
- Actions (View Details, Change Status)

**Responsive Design**:
- Desktop: Full table layout
- Tablet: Horizontal scroll
- Mobile: Card-based layout

### 4. StoresFilters
**Location**: `src/components/stores-admin/stores-filters.tsx`

**Purpose**: Filtering and search functionality

**Filter Types**:
```typescript
interface StoreFilters {
  search: string // Store name or admin name
  status: 'all' | 'active' | 'inactive' | 'production'
  dateRange: {
    from: Date | null
    to: Date | null
  }
  sortBy: 'name' | 'createdAt' | 'userCount'
  sortOrder: 'asc' | 'desc'
}
```

### 5. StoreDetailsModal
**Location**: `src/components/stores-admin/store-details-modal.tsx`

**Purpose**: Comprehensive store information display

**Sections**:
- **Basic Information**: Name, ID, creation date
- **Business Details**: Address, phone, business type
- **Configuration**: Currency settings, tax rates
- **Users Management**: List of associated users with roles
- **Statistics**: Sales, products, activity metrics
- **Settings**: Logo, social media links

### 6. StoreStatusManager
**Location**: `src/components/stores-admin/store-status-manager.tsx`

**Purpose**: Handle store status changes

**Status Options**:
- `active`: Store is operational
- `inactive`: Store is temporarily disabled
- `production`: Store is in production mode (special handling)

**Confirmation Flow**:
1. User selects new status
2. Confirmation dialog appears
3. For production mode: Additional warnings and confirmations
4. API call to update status
5. Real-time UI update

## Data Models

### Extended Store Interface
```typescript
interface StoreWithStats extends Store {
  userCount: number
  adminName: string
  adminContact: string
  lastActivity: Date
  salesCount: number
  productsCount: number
  isProduction: boolean
}
```

### API Response Structure
```typescript
interface StoresAdminResponse {
  stores: StoreWithStats[]
  statistics: {
    total: number
    active: number
    inactive: number
    production: number
  }
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}
```

## API Endpoints

### 1. GET /api/stores-admin
**Purpose**: Fetch all stores with administrative data

**Query Parameters**:
- `page`: Pagination page number
- `limit`: Items per page
- `search`: Search term
- `status`: Filter by status
- `sortBy`: Sort field
- `sortOrder`: Sort direction

**Response**: StoresAdminResponse

### 2. PUT /api/stores-admin/status
**Purpose**: Update store status

**Body**:
```typescript
{
  storeId: string
  newStatus: 'active' | 'inactive'
  reason?: string
}
```

### 3. GET /api/stores-admin/stats
**Purpose**: Get dashboard statistics

**Response**:
```typescript
{
  total: number
  active: number
  inactive: number
  production: number
  recentActivity: ActivityLog[]
}
```

## Error Handling

### Authentication Errors
- Redirect non-su users to unauthorized page
- Display appropriate error messages
- Log access attempts for security

### API Errors
- Network connectivity issues
- Server errors (500)
- Not found errors (404)
- Validation errors (400)

### User Experience
- Loading states for all async operations
- Error boundaries for component failures
- Retry mechanisms for failed requests
- Toast notifications for user feedback

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Filter logic validation
- Status change workflows
- Data transformation functions

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication flow
- Permission checks

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance under load

## Security Considerations

### Access Control
- Role-based route protection
- API endpoint authorization
- Sensitive data masking
- Audit logging

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

## Performance Optimization

### Data Loading
- Pagination for large datasets
- Lazy loading for details
- Caching strategies
- Optimistic updates

### UI Performance
- Virtual scrolling for large tables
- Debounced search inputs
- Memoized components
- Code splitting

## Responsive Design

### Breakpoints
- Mobile: < 768px (Card layout)
- Tablet: 768px - 1024px (Horizontal scroll)
- Desktop: > 1024px (Full table)

### Mobile Optimizations
- Touch-friendly buttons
- Swipe gestures for actions
- Collapsible sections
- Optimized modal sizes

## Navigation Integration

### Sidebar Menu
- Add "Administrar Tiendas" option
- Show only for role "su"
- Icon: Building2 or Store
- Position: After existing admin items

### Breadcrumbs
- Home > Administrar Tiendas
- Home > Administrar Tiendas > Detalles de [Store Name]

## State Management

### Local State
- Component-level state for UI interactions
- Form states for filters and modals
- Loading and error states

### Global State
- User authentication and permissions
- Store data caching
- Real-time updates

## Accessibility

### WCAG Compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management

### Semantic HTML
- Proper heading hierarchy
- Table headers and captions
- Form labels and descriptions
- ARIA attributes where needed

## Internationalization

### Text Content
- All user-facing text in Spanish
- Consistent terminology
- Date and number formatting
- Error messages localization

### Future Considerations
- Multi-language support structure
- RTL layout compatibility
- Cultural date/time formats