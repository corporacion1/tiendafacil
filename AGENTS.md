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
// 1. "use client" directive (if needed)
"use client";

// 2. React/Next.js imports
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// 3. Third-party libraries
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// 4. Internal imports (use @ alias)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
```

### TypeScript Conventions
- Use strict TypeScript, avoid `any`
- Use type-only imports: `import type { ButtonProps }`
- Define interfaces for props, use union types for statuses
- Use Zod schemas for form validation

### Naming Conventions
- **Components**: PascalCase (`ProductForm`)
- **Hooks**: camelCase with `use` prefix (`useProducts`)
- **Utilities**: camelCase (`formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`Product`, `OrderStatus`)

### Component Structure
```typescript
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

### Form Validation with React Hook Form + Zod
```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" }
});
```

### Error Handling
- Use Error Boundaries for component errors
- Log errors without exposing sensitive data
- Use toast notifications for user feedback
- Always validate environment variables before use

### Styling
- Use Tailwind CSS + `cn()` utility for conditional classes
- Follow shadcn/ui patterns and cva for variants
- Use responsive design patterns (md:, lg: prefixes)

### API Routes Pattern
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, msg: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    // Process data...

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Supabase Integration
- Lazy-initialize Supabase clients inside handlers, not at module level
- Use service role key for admin operations, public key for client-side
- Always handle errors from Supabase queries
- Use `.select('*').eq('field', value).single()` pattern for single row fetches

### Image Handling
- Use `getDisplayImageUrl()` from `@/lib/utils` for all image URLs
- Handle base64 data URIs directly
- Validate external URLs before use
- Provide fallback UI for failed image loads

### Dynamic Imports for Client-Only Libraries
```typescript
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);
```

## File Organization
```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable UI components (ui/, features/)
├── hooks/        # Custom React hooks
├── lib/          # Utilities, types, constants, API clients
├── contexts/     # React contexts
├── services/     # API and business logic
└── utils/        # Helper utilities
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
- **Icons**: Lucide React
- **Storage**: Cloudinary, Supabase Storage

## Security Best Practices
- Never log sensitive data (passwords, tokens, full error objects)
- Use environment variables for all configuration
- Validate all user inputs with Zod schemas
- Use service role keys only server-side
- Never commit `.env` files or secrets
