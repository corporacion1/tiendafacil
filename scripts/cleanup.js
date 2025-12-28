#!/usr/bin/env node

/**
 * Script de Limpieza del Proyecto
 * Elimina archivos de prueba, temporales y basura
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Archivos y directorios a eliminar
const filesToDelete = [
    // Archivos .env duplicados
    '.env copy.local',

    // Archivos de prueba en raíz
    'debug-duplicate.js',
    'get-store.js',
    'error_response.json',
    'devDependencies',

    // Archivos de prueba en scripts
    'scripts/test-ad-upload.js',
    'scripts/test-env.ts',
    'scripts/check-images.js',
    'scripts/delete-mock-ads.js',
    'scripts/delete-mock-data.js',
    'scripts/find-gridfs-by-filename.js',
    'scripts/inspect-ads-images.js',
    'scripts/check_balance.js',

    // Archivos de prueba en src
    'src/test-api.js',
    'src/components/simple-image-test.tsx',

    // Directorio de tests (si existe)
    'src/__tests__',

    // Jest config (si no se usa)
    'jest.config.js',
    'jest.setup.js',
];

// Archivos a mantener (whitelist)
const keepFiles = [
    'scripts/check-secrets.js',
    'scripts/inspect-store.ts',
];

function deleteFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);

    // Verificar si está en la whitelist
    if (keepFiles.includes(filePath)) {
        log(`   ⏭️  Manteniendo: ${filePath}`, 'blue');
        return false;
    }

    try {
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // Eliminar directorio recursivamente
                fs.rmSync(fullPath, { recursive: true, force: true });
                log(`   ✅ Directorio eliminado: ${filePath}`, 'green');
                return true;
            } else {
                // Eliminar archivo
                fs.unlinkSync(fullPath);
                log(`   ✅ Archivo eliminado: ${filePath}`, 'green');
                return true;
            }
        } else {
            log(`   ⏭️  No existe: ${filePath}`, 'yellow');
            return false;
        }
    } catch (error) {
        log(`   ❌ Error eliminando ${filePath}: ${error.message}`, 'red');
        return false;
    }
}

function main() {
    log('\n🧹 Limpiando proyecto...\n', 'blue');

    let deletedCount = 0;
    let skippedCount = 0;

    filesToDelete.forEach(file => {
        if (deleteFile(file)) {
            deletedCount++;
        } else {
            skippedCount++;
        }
    });

    log('\n═══════════════════════════════════════════════════', 'blue');
    log(`✅ Limpieza completada`, 'green');
    log(`   📁 Archivos eliminados: ${deletedCount}`, 'green');
    log(`   ⏭️  Archivos omitidos: ${skippedCount}`, 'yellow');
    log('═══════════════════════════════════════════════════\n', 'blue');

    // Sugerencias adicionales
    log('💡 Sugerencias adicionales:', 'magenta');
    log('   • Ejecuta "npm run check-secrets" para verificar seguridad', 'magenta');
    log('   • Considera ejecutar "npm audit fix" para actualizar dependencias', 'magenta');
    log('   • Revisa el archivo .gitignore para asegurar que todo esté protegido\n', 'magenta');
}

// Ejecutar
main();
