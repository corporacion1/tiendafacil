// Test simple para verificar la API
// Ejecutar en la consola del navegador en http://localhost:3001

async function testAPI() {
    console.log('🔍 Testing API...');
    
    // 1. Verificar productos
    try {
        const response = await fetch('/api/products?storeId=ST-1234567890123');
        const products = await response.json();
        console.log('📦 Productos encontrados:', products.length);
        
        if (products.length > 0) {
            const firstProduct = products[0];
            console.log('🔍 Primer producto:', {
                id: firstProduct.id,
                name: firstProduct.name,
                imageUrl: firstProduct.imageUrl,
                images: firstProduct.images,
                hasImages: !!firstProduct.images,
                imagesCount: firstProduct.images?.length || 0
            });
            
            // 2. Test de subida con imagen de prueba
            console.log('📤 Probando subida de imagen...');
            
            // Crear imagen de prueba
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('storeId', 'ST-1234567890123');
                formData.append('images', blob, 'test.png');
                
                try {
                    const uploadResponse = await fetch(`/api/products/${firstProduct.id}/images`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    console.log('📥 Upload response:', uploadResponse.status);
                    
                    if (uploadResponse.ok) {
                        const result = await uploadResponse.json();
                        console.log('✅ Upload exitoso:', result);
                    } else {
                        const error = await uploadResponse.text();
                        console.error('❌ Upload error:', error);
                    }
                } catch (error) {
                    console.error('❌ Upload exception:', error);
                }
            }, 'image/png');
            
        } else {
            console.log('❌ No hay productos para probar');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar automáticamente
testAPI();