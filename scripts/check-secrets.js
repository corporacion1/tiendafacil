#!/usr/bin/env node

/**
 * Script de Verificación de Seguridad
 * Verifica que no haya datos sensibles antes de hacer commit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

// Patrones sensibles a buscar
const sensitivePatterns = [
    // API Keys y Secrets (valores reales, no nombres de variables)
    /['"]api[_-]?key['"]:\s*['"][^'"]{20,}['"]/gi,
    /['"]secret[_-]?key['"]:\s*['"][^'"]{20,}['"]/gi,
    /['"]access[_-]?token['"]:\s*['"][^'"]{20,}['"]/gi,

    // JWT tokens reales (no en archivos .example)
    /eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/g,

    // Firebase private keys
    /"private_key":\s*"-----BEGIN PRIVATE KEY-----/gi,

    // Database URLs con credenciales
    /postgres:\/\/[^:]+:[^@]+@[^\/]+/gi,
    /mysql:\/\/[^:]+:[^@]+@[^\/]+/gi,
    /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi,

    // AWS Access Keys (valores reales)
    /AKIA[0-9A-Z]{16}/g,

    // Stripe keys (valores reales)
    /sk_live_[0-9a-zA-Z]{24,}/g,
    /rk_live_[0-9a-zA-Z]{24,}/g,

    // Claves privadas
    /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/gi,
];

// Archivos a ignorar en la búsqueda
const ignorePatterns = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    'package-lock.json',
    'yarn.lock',
    '.env.example',
    '.env.local',  // Ignorar .env.local ya que debe estar en .gitignore
    'SECURITY.md',
    'CHANGELOG.md',
    'check-secrets.js',
    'cleanup.js',
];

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function shouldIgnore(filePath) {
    return ignorePatterns.some(pattern => filePath.includes(pattern));
}

function checkFile(filePath) {
    if (shouldIgnore(filePath)) return [];

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const findings = [];

        sensitivePatterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    findings.push({
                        file: filePath,
                        pattern: pattern.toString(),
                        match: match.substring(0, 50) + '...', // Truncar para no mostrar el secreto completo
                        line: content.substring(0, content.indexOf(match)).split('\n').length,
                    });
                });
            }
        });

        return findings;
    } catch (error) {
        return [];
    }
}

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);

        if (shouldIgnore(filePath)) return;

        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function checkGitignore() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        log('⚠️  ADVERTENCIA: No se encontró archivo .gitignore', 'yellow');
        return false;
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const requiredPatterns = [
        '.env',
        '.env.local',
        '*.pem',
        '*.key',
        '*-service-account.json',
    ];

    const missing = requiredPatterns.filter(pattern => !gitignoreContent.includes(pattern));

    if (missing.length > 0) {
        log('⚠️  ADVERTENCIA: Faltan patrones en .gitignore:', 'yellow');
        missing.forEach(pattern => log(`   - ${pattern}`, 'yellow'));
        return false;
    }

    return true;
}

function checkEnvFiles() {
    const envFiles = ['.env', '.env.local', '.env.production'];
    const found = [];

    envFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            // Verificar si está en staging
            try {
                const status = execSync(`git status --porcelain ${file}`, { encoding: 'utf8' });
                if (status.trim()) {
                    found.push(file);
                }
            } catch (error) {
                // Archivo no trackeado, está bien
            }
        }
    });

    return found;
}

function main() {
    log('\n🔍 Verificando seguridad del código...\n', 'blue');

    let hasIssues = false;

    // 1. Verificar .gitignore
    log('1. Verificando .gitignore...', 'blue');
    if (checkGitignore()) {
        log('   ✅ .gitignore está correctamente configurado\n', 'green');
    } else {
        log('   ❌ .gitignore necesita actualizaciones\n', 'red');
        hasIssues = true;
    }

    // 2. Verificar archivos .env en staging
    log('2. Verificando archivos .env...', 'blue');
    const envInStaging = checkEnvFiles();
    if (envInStaging.length > 0) {
        log('   ❌ PELIGRO: Archivos .env en staging:', 'red');
        envInStaging.forEach(file => log(`      - ${file}`, 'red'));
        log('   Ejecuta: git reset HEAD ' + envInStaging.join(' '), 'yellow');
        log('', 'reset');
        hasIssues = true;
    } else {
        log('   ✅ No hay archivos .env en staging\n', 'green');
    }

    // 3. Buscar patrones sensibles en archivos
    log('3. Buscando patrones sensibles en el código...', 'blue');
    const files = getAllFiles(process.cwd());
    const allFindings = [];

    files.forEach(file => {
        const findings = checkFile(file);
        allFindings.push(...findings);
    });

    if (allFindings.length > 0) {
        log(`   ❌ Se encontraron ${allFindings.length} posibles secretos:\n`, 'red');
        allFindings.forEach(finding => {
            log(`   📁 ${finding.file}:${finding.line}`, 'yellow');
            log(`      Patrón: ${finding.pattern}`, 'magenta');
            log(`      Match: ${finding.match}\n`, 'red');
        });
        hasIssues = true;
    } else {
        log('   ✅ No se encontraron patrones sensibles\n', 'green');
    }

    // 4. Verificar archivos sensibles comunes
    log('4. Verificando archivos sensibles comunes...', 'blue');
    const sensitiveFiles = [
        'serviceAccountKey.json',
        'firebase-adminsdk.json',
        'credentials.json',
        'secrets.json',
    ];

    const foundSensitive = sensitiveFiles.filter(file =>
        fs.existsSync(path.join(process.cwd(), file))
    );

    if (foundSensitive.length > 0) {
        log('   ⚠️  Archivos sensibles encontrados:', 'yellow');
        foundSensitive.forEach(file => {
            log(`      - ${file}`, 'yellow');
            try {
                const status = execSync(`git check-ignore ${file}`, { encoding: 'utf8' });
                log(`        ✅ Está en .gitignore`, 'green');
            } catch (error) {
                log(`        ❌ NO está en .gitignore - AGREGAR AHORA`, 'red');
                hasIssues = true;
            }
        });
        log('', 'reset');
    } else {
        log('   ✅ No se encontraron archivos sensibles comunes\n', 'green');
    }

    // Resultado final
    log('═══════════════════════════════════════════════════', 'blue');
    if (hasIssues) {
        log('❌ VERIFICACIÓN FALLIDA - Corrige los problemas antes de hacer commit', 'red');
        log('═══════════════════════════════════════════════════\n', 'blue');
        process.exit(1);
    } else {
        log('✅ VERIFICACIÓN EXITOSA - Es seguro hacer commit', 'green');
        log('═══════════════════════════════════════════════════\n', 'blue');
        process.exit(0);
    }
}

// Ejecutar
main();
