# Requirements Document

## Introduction

This specification addresses the debugging and fixing of the existing family management functionality in the Settings page. The UI components and API endpoints exist, but there may be runtime issues preventing the add/edit/delete operations from working correctly.

## Glossary

- **ManagementCard**: The reusable UI component that handles CRUD operations for units, families, and warehouses
- **Family_API**: The REST API endpoints for managing product families (/api/families)
- **Settings_Context**: The React context that loads and manages families data
- **activeStoreId**: The current store identifier required for all API operations

## Requirements

### Requirement 1

**User Story:** As a developer, I want to identify why the family management is not working, so that I can fix the underlying issue.

#### Acceptance Criteria

1. WHEN the ManagementCard attempts to create a family, THE Family_API SHALL receive the correct storeId parameter
2. WHEN the API call succeeds, THE Settings_Context SHALL update the families state correctly
3. IF the API call fails, THEN THE ManagementCard SHALL display the specific error message
4. WHEN debugging, THE system SHALL log all API requests and responses for families
5. WHERE the activeStoreId is missing or invalid, THE system SHALL prevent API calls and show an appropriate error

### Requirement 2

**User Story:** As a store administrator, I want the family add functionality to work reliably, so that I can create new product families.

#### Acceptance Criteria

1. WHEN I enter a family name and click add, THE ManagementCard SHALL call the POST /api/families endpoint
2. WHEN the family is created successfully, THE families list SHALL update immediately without page refresh
3. IF the creation fails due to duplicate name, THEN THE system SHALL show a clear error message
4. WHEN the form is submitted with empty name, THE system SHALL prevent the API call
5. WHERE the network request fails, THE system SHALL show a network error message

### Requirement 3

**User Story:** As a store administrator, I want the family edit and delete functionality to work correctly, so that I can manage existing families.

#### Acceptance Criteria

1. WHEN I click edit on a family, THE ManagementCard SHALL populate the form with current data
2. WHEN I save changes, THE system SHALL call PUT /api/families with the correct parameters
3. WHEN I delete a family, THE system SHALL check if it's in use by products first
4. IF a family is in use, THEN THE system SHALL prevent deletion and show a warning
5. WHERE deletion is allowed, THE system SHALL call DELETE /api/families and update the list