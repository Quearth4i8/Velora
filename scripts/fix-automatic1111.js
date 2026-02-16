const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'lib', 'automatic1111.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace first occurrence (generateDirectImage function)
const oldPattern1 = `      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(imageName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }`;

const newCode1 = `      // Upload to local storage via API
      const formData = new FormData();
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

content = content.replace(oldPattern1, newCode1);

// Replace second occurrence (generateHiresImage function)  
const oldPattern2 = `      // Upload to Supabase storage with hires prefix`;
const newCode2 = `      // Upload to local storage via API with hires prefix`;

content = content.replace(oldPattern2, newCode2);

// The second upload block is identical to first, so already replaced

fs.writeFileSync(filePath, content);
console.log('Fixed automatic1111.ts storage uploads');
