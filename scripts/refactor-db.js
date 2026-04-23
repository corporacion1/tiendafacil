const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorCode() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  walkDir(srcPath, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.md')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace imports
    content = content.replace(/@\/lib\/supabase/g, '@/lib/db-client');
    content = content.replace(/import\s+{\s*supabaseAdmin\s+as\s+supabase\s*}\s+from/g, 'import { dbAdmin as db } from');
    content = content.replace(/import\s+{\s*supabaseAdmin\s*}\s+from/g, 'import { dbAdmin } from');
    content = content.replace(/import\s+{\s*supabase\s*}\s+from/g, 'import { db } from');
    
    // Replace object usages
    content = content.replace(/\bsupabaseAdmin\b/g, 'dbAdmin');
    content = content.replace(/\bsupabase\b/g, 'db');
    
    // Replace Neon bridge references
    content = content.replace(/\.\/neon-bridge/g, './db-bridge');
    content = content.replace(/neonBridge/g, 'dbBridge');

    // Replace neon.ts references
    content = content.replace(/@\/lib\/neon/g, '@/lib/sql-template');

    // Replace string literals or comments mentioning neon/supabase
    // (Be careful not to break external URLs if any, but we handled Supabase URLs in utils.ts)
    // Actually, leave URLs intact, just rename the variables.
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  });
}

refactorCode();
