/**
 * scripts/download-images.ts
 * Script para descargar todas las imágenes de Supabase al sistema de archivos local.
 * Ejecutar con: npx tsx scripts/download-images.ts
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Configuración de la base de datos desde .env.local
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:19a1e3ef@localhost:5433/tiendafacil';

async function downloadImage(url: string, destPath: string) {
    if (fs.existsSync(destPath)) {
        // console.log(`⏩ Saltando: ${path.basename(destPath)} ya existe.`);
        return true;
    }

    try {
        const headers: Record<string, string> = {};
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
            headers['apikey'] = process.env.SUPABASE_SERVICE_ROLE_KEY;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Asegurar que el directorio existe
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        fs.writeFileSync(destPath, buffer);
        console.log(`✅ Descargado: ${path.basename(destPath)}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Error descargando ${url}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando descarga de imágenes desde Supabase...');
    
    const client = new Client({ connectionString });
    await client.connect();

    try {
        // 1. Obtener imágenes de productos
        const productRes = await client.query('SELECT id, name, image_url, images FROM products');
        console.log(`📦 Procesando ${productRes.rows.length} productos...`);
        
        const publicPath = path.join(process.cwd(), 'public', 'uploads', 'products');

        for (const row of productRes.rows) {
            const urls: string[] = [];
            
            // image_url principal
            if (row.image_url && row.image_url.includes('supabase.co')) {
                urls.push(row.image_url);
            }
            
            // Galería de imágenes (JSONB)
            if (row.images && Array.isArray(row.images)) {
                for (const img of row.images) {
                    if (img.url && img.url.includes('supabase.co')) {
                        urls.push(img.url);
                    }
                }
            }

            for (const url of urls) {
                const fileName = url.split('/').pop()?.split('?')[0]; // Eliminar query params
                if (fileName) {
                    await downloadImage(url, path.join(publicPath, fileName));
                }
            }
        }

        // 2. Obtener imágenes de anuncios (ads)
        const adsRes = await client.query('SELECT name, image_url FROM ads');
        console.log(`📢 Procesando ${adsRes.rows.length} anuncios...`);
        
        const adsPath = path.join(process.cwd(), 'public', 'uploads', 'ads');

        for (const row of adsRes.rows) {
            if (row.image_url && row.image_url.includes('supabase.co')) {
                const fileName = row.image_url.split('/').pop()?.split('?')[0];
                if (fileName) {
                    await downloadImage(row.image_url, path.join(adsPath, fileName));
                }
            }
        }

        console.log('\n✨ Migración de imágenes completada con éxito.');
        console.log('📂 Las imágenes se guardaron en ./public/uploads/');

    } catch (error) {
        console.error('❌ Error general en la migración:', error);
    } finally {
        await client.end();
    }
}

main();
