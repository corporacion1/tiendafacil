const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const srcPath = path.join(__dirname, '..', 'src');

walkDir(srcPath, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Rename loadDataFromSupabase
  content = content.replace(/loadDataFromSupabase/g, 'loadDataFromDb');
  
  // Remove Supabase/Neon from comments (case insensitive replacement of just the words in comments)
  // We can't perfectly regex comments without parsing, but we can do our best.
  // We will replace "Supabase" with "Database" and "Neon" with "PostgreSQL" in comments.
  content = content.replace(/\/\/.*?(Supabase|Neon|supabase|neon).*/gi, (match) => {
      let newMatch = match.replace(/Supabase/gi, 'Database').replace(/Neon/gi, 'PostgreSQL');
      // If it mentions supabasePath, leave it or remove it
      newMatch = newMatch.replace(/supabasePath/gi, 'legacyPath');
      return newMatch;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});
