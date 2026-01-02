#!/bin/bash

echo "🔧 Starting ESLint auto-fix process..."

# Fix common ESLint issues automatically
echo "📝 Fixing unused imports and variables..."
npx eslint --fix src/ --ext .ts,.tsx --rule "@typescript-eslint/no-unused-vars: error"

echo "📝 Fixing missing dependencies in hooks..."
npx eslint --fix src/ --ext .ts,.tsx --rule "react-hooks/exhaustive-deps: error"

echo "📝 Fixing unescaped entities..."
npx eslint --fix src/ --ext .ts,.tsx --rule "react/no-unescaped-entities: error"

echo "✅ ESLint auto-fix completed!"