# AGENTS.md - Development Guidelines for TiendaFacil

## Build & Development Commands

### Core Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Testing Commands
- `npm test` - Run all tests
- `npm test -- --testNamePattern="specific test"` - Run single test by name
- `npm test -- path/to/test.test.ts` - Run single test file
- `npm test -- --watch` - Run tests in watch mode

### Security & Maintenance
- `npm run check-secrets` - Check for exposed secrets
- `npm run security-audit` - Run security audit
- `npm run cleanup` - Clean up temporary files

## Code Style Guidelines

### Import Organization
```typescript
// 1. React/Next.js imports
import React from 'react';
import type { Metadata } from 'next';

// 2. Third-party libraries
import { cva, type VariantProps } from 'class-variance-authority';
import { toast } from 'sonner';

// 3. Internal imports (use @ alias)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
```

### TypeScript Conventions
- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use type-only imports when possible: `import type { ButtonProps }`
- Define interfaces for component props
- Use union types for enums/status fields

### Component Structure
```typescript
// 1. Imports
import * as React from "react";

// 2. Utility functions/constants
const DEFAULT_LIMIT = 10;

// 3. Type definitions
interface ComponentProps {
  // props here
}

// 4. Component implementation
const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    // component logic
    return (
      <div ref={ref} className={cn(className)} {...props} />
    );
  }
);

Component.displayName = "Component";
export { Component };
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ProductForm`, `UserCard`)
- **Hooks**: camelCase with `use` prefix (e.g., `useToast`, `useProducts`)
- **Utilities**: camelCase (e.g., `cn`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types**: PascalCase (e.g., `Product`, `OrderStatus`)

### File Organization
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/            # Base UI components (shadcn/ui)
│   └── features/      # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/               # Utilities, types, constants
├── contexts/          # React contexts
└── services/          # API and business logic services
```

### Error Handling
- Use Error Boundaries for component-level error handling
- Implement proper error types and messages
- Use toast notifications for user feedback
- Log errors appropriately without exposing sensitive data

### Styling Guidelines
- Use Tailwind CSS for styling
- Leverage `cn()` utility for conditional classes
- Use class-variance-authority (cva) for component variants
- Follow shadcn/ui patterns for consistent UI components

### API Integration
- Use the centralized API client from `@/lib/api-client`
- Implement proper error handling for API calls
- Use React Query/SWR for data fetching and caching
- Type API responses using TypeScript interfaces

### Database & State Management
- Use proper TypeScript types for database models
- Implement optimistic updates where appropriate
- Use React contexts for global state management
- Follow the existing patterns for Supabase integration

### Security Best Practices
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper authentication and authorization
- Validate user inputs on both client and server
- Use the security context for permission checks

### Performance Considerations
- Use React.memo() for expensive components
- Implement proper loading states
- Optimize images and assets
- Use code splitting for large components
- Implement proper caching strategies

### Testing Guidelines
- Write tests for critical business logic
- Use React Testing Library for component tests
- Mock external dependencies appropriately
- Test error states and edge cases
- Maintain good test coverage for core features

## Development Workflow

1. **Before starting**: Run `npm run typecheck` and `npm run lint`
2. **During development**: Use `npm run dev` with hot reload
3. **Before committing**: Run `npm run lint` and `npm run typecheck`
4. **Before deployment**: Run `npm run build` to ensure production build works

## Key Dependencies & Patterns

- **UI Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (primary) + MongoDB (legacy)
- **Authentication**: Custom auth with JWT
- **State Management**: React Context + useReducer
- **Images**: Cloudinary + local API endpoints
- **Testing**: Jest + React Testing Library

## Common Patterns

### Custom Hooks
```typescript
export function useCustomHook(param: string) {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // effect logic
  }, [param]);
  
  return { state, actions };
}
```

### API Endpoints
```typescript
// app/api/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    // API logic
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Component Props
```typescript
interface ComponentProps {
  children: React.ReactNode;
  className?: string;
  // other props
}
```

Remember to follow these guidelines consistently and use existing patterns as templates for new code.