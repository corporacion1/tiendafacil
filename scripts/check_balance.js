const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path,'utf8');
const stack = [];
const pairs = { '{': '}', '(': ')', '[': ']' };
const opens = new Set(Object.keys(pairs));
const closes = new Set(Object.values(pairs));
let inSingle=false, inDouble=false, inTemplate=false, inLineComment=false, inBlockComment=false;
for (let i=0;i<s.length;i++){
  const c = s[i];
  const next = s[i+1];
  // handle comment starts
  if (!inSingle && !inDouble && !inTemplate) {
    if (!inBlockComment && c==='/' && next==='/') { inLineComment=true; i++; continue; }
    if (!inLineComment && c==='/' && next==='*') { inBlockComment=true; i++; continue; }
  }
  // handle comment ends
  if (inLineComment && (c==='\n' || c==='\r')) { inLineComment=false; continue; }
  if (inBlockComment && c==='*' && next==='/' ) { inBlockComment=false; i++; continue; }
  if (inLineComment || inBlockComment) continue;

  // handle strings
  if (!inDouble && !inTemplate && c==="'" ) { inSingle = !inSingle; continue; }
  if (!inSingle && !inTemplate && c==='"') { inDouble = !inDouble; continue; }
  if (!inSingle && !inDouble && c==='`') { inTemplate = !inTemplate; continue; }
  if (inSingle || inDouble || inTemplate) {
    // skip escaped chars in strings
    if (c==='\\') i++; // skip next char
    continue;
  }

  if (opens.has(c)) stack.push({c, i});
  else if (closes.has(c)){
    const last = stack.pop();
    if (!last){
      console.error('Unmatched closing', c, 'at', i);
      process.exit(1);
    }
    if (pairs[last.c] !== c){
      console.error('Mismatched pair at', i, 'expected', pairs[last.c], 'got', c);
      process.exit(1);
    }
  }
}
if (stack.length>0){
  const map = stack.map(x=>{
    const upTo = s.slice(0,x.i);
    const line = upTo.split('\n').length;
    const col = x.i - upTo.lastIndexOf('\n');
    const snippet = s.slice(Math.max(0,x.i-40), Math.min(s.length, x.i+40)).replace(/\n/g,'\\n');
    return { char: x.c, pos: x.i, line, col, snippet };
  });
  console.error('Unclosed tokens at end:', map);
  process.exit(2);
}
console.log('All balanced');
