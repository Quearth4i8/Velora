const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'lib', 'automatic1111.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Count occurrences of Supabase storage
const matches = content.match(/supabase\.storage/g);
console.log(`Found ${matches ? matches.length : 0} Supabase storage references`);

// Replace the entire upload block pattern
const uploadBlockPattern = /const \{ error: uploadError \} = await supabase\.storage[\s\S]*?\.from\('character-images'\)[\s\S]*?\.upload\(imageName, blob, \{[\s\S]*?contentType: 'image\/jpeg',[\s\S]*?upsert: true[\s\S]*?\}\);[\s\S]*?if \(uploadError\) \{[\s\S]*?console\.error\('Storage upload error:', uploadError\);[\s\S]*?throw uploadError;[\s\S]*?\}/g;

const replacement = `const formData = new FormData();
      formData.append('file', blob, imageName);
      formData.append('bucket', 'character-images');
      formData.append('path', imageName);

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(\`Storage upload failed: \${errorText}\`);
      }`;

content = content.replace(uploadBlockPattern, replacement);

// Also replace the comment line
content = content.replace(/\/\/ Upload to Supabase storage/g, '// Upload to local storage via API');
content = content.replace(/\/\/ Upload to Supabase storage with hires prefix/g, '// Upload to local storage via API with hires prefix');

fs.writeFileSync(filePath, content);
console.log('Fixed automatic1111.ts storage references');

// Verify
const newContent = fs.readFileSync(filePath, 'utf8');
const remaining = newContent.match(/supabase\.storage/g);
console.log(`Remaining Supabase storage references: ${remaining ? remaining.length : 0}`);
