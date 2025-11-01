import { SimpleAddImage } from '@/components/simple-add-image';

export default function TestAddImagePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">🧪 Test Agregar Imagen</h1>
        <p className="text-muted-foreground">Prueba simple para agregar imágenes adicionales</p>
      </div>
      
      <SimpleAddImage />
      
      <div className="mt-8 max-w-md mx-auto">
        <div className="bg-muted/20 p-4 rounded-lg text-sm space-y-2">
          <h3 className="font-semibold">📋 Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ingresa el ID de un producto existente</li>
            <li>Selecciona una imagen</li>
            <li>Haz clic en "Agregar Imagen"</li>
            <li>Revisa la consola para logs detallados</li>
            <li>Ve al catálogo para verificar que aparece</li>
          </ol>
        </div>
      </div>
    </div>
  );
}