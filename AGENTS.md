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
// 2. Third-party libraries
// 3. Internal imports (use @ alias)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
```

### TypeScript Conventions
- Use strict TypeScript, avoid `any`
- Use type-only imports: `import type { ButtonProps }`
- Define interfaces for props, use union types for statuses

### Naming Conventions
- **Components**: PascalCase (`ProductForm`)
- **Hooks**: camelCase with `use` prefix (`useProducts`)
- **Utilities**: camelCase (`formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`Product`, `OrderStatus`)

### Component Structure
```typescript
import * as React from "react";
const DEFAULT_LIMIT = 10;

interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn(className)} {...props} />;
  }
);
Component.displayName = "Component";
export { Component };
```

### Error Handling
- Use Error Boundaries for component errors
- Log errors without exposing sensitive data
- Use toast notifications for user feedback

### Styling
- Use Tailwind CSS + `cn()` utility for conditional classes
- Follow shadcn/ui patterns and cva for variants

## File Organization
```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable UI components (ui/, features/)
├── hooks/        # Custom React hooks
├── lib/          # Utilities, types, constants
├── contexts/     # React contexts
└── services/     # API and business logic
```

## Development Workflow
1. Before starting: `npm run typecheck && npm run lint`
2. During dev: `npm run dev`
3. Before commit: `npm run lint && npm run typecheck`
4. Before deploy: `npm run build`

## Key Dependencies
- **UI**: Next.js 15 + App Router, Tailwind CSS, shadcn/ui
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (primary), MongoDB (legacy)
- **State**: React Context + useReducer
- **Testing**: Jest + React Testing Library

## API Endpoints Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```
