"use client";

import { DebugMultipleImagesTest } from '@/components/debug-multiple-images-test';
import { MigrationTool } from '@/components/migration-tool';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DebugImagesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Debug: Múltiples Imágenes</h1>
      
      <Tabs defaultValue="migration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="migration">Migración</TabsTrigger>
          <TabsTrigger value="testing">Pruebas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="migration">
          <MigrationTool />
        </TabsContent>
        
        <TabsContent value="testing">
          <DebugMultipleImagesTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}