const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcPath = path.join(__dirname, '..', 'src');

walkDir(srcPath, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace words regardless of case
  content = content.replace(/Supabase/gi, 'DB');
  content = content.replace(/Neon/gi, 'DB');
  
  // Also clean up any lingering 'supabasePath'
  content = content.replace(/supabasePath/gi, 'legacyPath');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Scrubbed: ${filePath}`);
  }
});
