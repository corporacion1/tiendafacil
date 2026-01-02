// ============================================================================
// POS INTEGRATION EXAMPLE - Clean Implementation
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// This is a clean example file for POS integration patterns
// The original file had syntax errors with incomplete comment blocks

interface POSIntegrationProps {
  storeId: string;
}

export const POSIntegrationExample: React.FC<POSIntegrationProps> = ({ storeId }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">POS Integration Example</h2>
      <Card className="p-4">
        <p>Store ID: {storeId}</p>
        <p>This is a clean implementation example.</p>
      </Card>
    </div>
  );
};

export default POSIntegrationExample;