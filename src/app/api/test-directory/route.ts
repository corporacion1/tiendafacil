import { NextResponse, NextRequest } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { storeId, productId } = await request.json();
    
    if (!storeId || !productId) {
      return NextResponse.json({ 
        error: 'storeId y productId son requeridos' 
      }, { status: 400 });
    }
    
    console.log('🧪 [Test] Probando creación de directorio:', { storeId, productId });
    
    // Crear estructura de directorios
    const baseDir = join(process.cwd(), 'public');
    const uploadsDir = join(baseDir, 'uploads');
    const productsDir = join(uploadsDir, 'products');
    const storeDir = join(productsDir, storeId);
    const productDir = join(storeDir, productId);
    const originalDir = join(productDir, 'original');
    
    const directories = {
      base: baseDir,
      uploads: uploadsDir,
      products: productsDir,
      store: storeDir,
      product: productDir,
      original: originalDir
    };
    
    console.log('📁 [Test] Directorios a crear:', directories);
    
    // Verificar y crear cada directorio
    const results: any = {};
    
    for (const [name, dir] of Object.entries(directories)) {
      const existed = existsSync(dir);
      
      if (!existed) {
        await mkdir(dir, { recursive: true });
        console.log(`✅ [Test] Creado: ${dir}`);
      } else {
        console.log(`✅ [Test] Ya existe: ${dir}`);
      }
      
      const nowExists = existsSync(dir);
      results[name] = {
        path: dir,
        existedBefore: existed,
        existsNow: nowExists,
        created: !existed && nowExists
      };
    }
    
    // Crear archivo de prueba
    const testFile = join(originalDir, 'test.txt');
    const testContent = `Test file created at ${new Date().toISOString()}`;
    
    try {
      await writeFile(testFile, testContent);
      console.log('✅ [Test] Archivo de prueba creado:', testFile);
      
      results.testFile = {
        path: testFile,
        created: true,
        content: testContent
      };
    } catch (error) {
      console.error('❌ [Test] Error creando archivo de prueba:', error);
      results.testFile = {
        path: testFile,
        created: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test de directorio completado',
      directories: results,
      baseDirectory: process.cwd()
    });
    
  } catch (error) {
    console.error('❌ [Test] Error en test de directorio:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      baseDirectory: process.cwd()
    }, { status: 500 });
  }
}