const fs = require('fs');
const path = require('path');

// Crear directorios necesarios para uploads
function setupUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const productsDir = path.join(uploadsDir, 'products');
  
  console.log('🚀 Configurando directorios de uploads...');
  
  try {
    // Crear directorio uploads si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Creado: public/uploads');
    } else {
      console.log('✅ Ya existe: public/uploads');
    }
    
    // Crear directorio products si no existe
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
      console.log('✅ Creado: public/uploads/products');
    } else {
      console.log('✅ Ya existe: public/uploads/products');
    }
    
    // Verificar permisos
    try {
      fs.accessSync(productsDir, fs.constants.W_OK);
      console.log('✅ Permisos de escritura verificados');
    } catch (error) {
      console.error('❌ Sin permisos de escritura en:', productsDir);
      console.error('Ejecuta: chmod 755', productsDir);
    }
    
    console.log('🎉 Configuración de uploads completada');
    
  } catch (error) {
    console.error('❌ Error configurando directorios:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupUploadsDirectory();
}

module.exports = { setupUploadsDirectory };