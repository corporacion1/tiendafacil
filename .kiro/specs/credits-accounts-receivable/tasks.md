# Implementation Plan - Módulo de Créditos y Cuentas por Cobrar

- [x] 1. Create data models and database schema




  - Create AccountReceivable model with all required fields and enums
  - Implement PaymentRecord embedded schema with validation
  - Add database indexes for optimal query performance





  - Create middleware for automatic balance calculations and status updates
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement core API endpoints

- [ ] 2.1 Create GET /api/credits endpoint
  - Implement query filtering by storeId, customerId, status, and overdue flag
  - Add pagination and sorting capabilities
  - Calculate and return summary totals for dashboard
  - _Requirements: 3.1, 4.1_


- [ ] 2.2 Create POST /api/credits endpoint
  - Implement automatic account creation from credit sales
  - Validate sale exists and is credit type
  - Prevent duplicate account creation for same sale
  - _Requirements: 1.1, 6.1_



- [ ] 2.3 Create PUT /api/credits endpoint for payment processing
  - Implement payment validation (amount, method, reference)
  - Update account balance and status automatically
  - Maintain payment history with audit trail
  - _Requirements: 2.1, 2.2, 2.4, 2.5_






- [ ] 2.4 Create GET /api/credits/summary endpoint
  - Implement dashboard metrics aggregation
  - Generate aging report with classification by days overdue
  - Calculate top debtors and upcoming due dates


  - _Requirements: 3.1, 3.2, 3.3, 3.4_







- [ ]* 2.5 Add comprehensive API error handling and validation
  - Implement custom error codes for business logic violations
  - Add input sanitization and validation middleware

  - Create consistent error response format
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 3. Update existing Sale model integration
- [x] 3.1 Extend Sale model with credit-related fields

  - Add accountReceivableId reference field
  - Add creditTerms object with days and due date
  - Maintain backward compatibility with existing sales
  - _Requirements: 6.1, 6.2_

- [ ] 3.2 Create bidirectional synchronization logic
  - Update Sale when AccountReceivable payments are processed
  - Ensure data consistency between both models
  - Handle concurrent updates safely
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Build credits dashboard UI components
- [ ] 4.1 Create CreditsDashboard component
  - Display key metrics cards (total pending, overdue, etc.)
  - Implement aging analysis visualization
  - Show top debtors list and upcoming due dates
  - _Requirements: 3.1, 3.2, 3.3, 4.4_

- [ ] 4.2 Create CreditsFilters component
  - Implement status filter dropdown
  - Add customer search functionality
  - Create date range filters for due dates
  - _Requirements: 4.1, 4.3_

- [ ] 4.3 Create CreditsTable component
  - Display accounts list with pagination
  - Show status badges with visual indicators for overdue accounts
  - Implement sorting by amount, due date, customer name
  - Add quick action buttons for payments and details
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 5. Implement payment processing UI
- [ ] 5.1 Create PaymentDialog component
  - Build payment form with method selection and amount input
  - Implement real-time balance calculations
  - Add reference number validation for duplicate prevention
  - Show payment summary before confirmation
  - _Requirements: 2.1, 2.2, 2.3, 4.4_

- [ ] 5.2 Create AccountDetailsDialog component
  - Display complete account information and payment history
  - Show original sale details and items
  - Provide payment timeline visualization
  - Add quick payment action from details view
  - _Requirements: 4.4, 4.5_

- [ ] 6. Replace current credits page implementation
- [ ] 6.1 Update main CreditsPage component
  - Replace existing implementation with new API-integrated version
  - Implement proper loading states and error handling
  - Add real-time data refresh capabilities
  - Maintain responsive design for mobile devices
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.3_

- [ ] 6.2 Integrate with existing settings context
  - Use activeStoreId for filtering accounts
  - Apply currency formatting with activeSymbol and activeRate
  - Maintain consistency with existing UI patterns
  - _Requirements: 4.5, 6.4_

- [ ] 7. Add data migration and integration utilities
- [ ] 7.1 Create migration script for existing credit sales
  - Convert existing credit sales to AccountReceivable records
  - Migrate payment history from Sale to AccountReceivable
  - Validate data integrity after migration
  - _Requirements: 6.1, 6.5_

- [ ]* 7.2 Add data consistency validation utilities
  - Create scripts to verify Sale and AccountReceivable synchronization
  - Implement automated data integrity checks
  - Add repair utilities for inconsistent data
  - _Requirements: 6.4, 6.5_

- [ ] 8. Implement comprehensive error handling
- [ ] 8.1 Add frontend error boundary and handling
  - Implement useErrorHandler integration
  - Add proper loading states and error messages
  - Create retry mechanisms for failed API calls
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8.2 Add user feedback and notifications
  - Implement success/error toast notifications
  - Add confirmation dialogs for critical actions
  - Provide clear validation messages for form inputs
  - _Requirements: 5.3, 5.4_

- [ ]* 9. Add testing and validation
- [ ]* 9.1 Create unit tests for API endpoints
  - Test all CRUD operations and business logic
  - Test payment processing and balance calculations
  - Test error scenarios and edge cases
  - _Requirements: 5.1, 5.2_

- [ ]* 9.2 Create integration tests for UI components
  - Test complete payment workflow from UI to API
  - Test data synchronization between Sale and AccountReceivable
  - Test real-time dashboard updates
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 10. Performance optimization and final integration
- [ ] 10.1 Optimize database queries and indexes
  - Verify index effectiveness with query analysis
  - Optimize aggregation pipelines for dashboard metrics
  - Implement query result caching where appropriate
  - _Requirements: 3.4, 5.4_

- [ ] 10.2 Final integration testing and cleanup
  - Test complete workflow from credit sale to final payment
  - Verify all UI components work correctly with real data
  - Clean up unused imports and optimize bundle size
  - _Requirements: 4.5, 5.4, 6.5_