import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'data', 'storage');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'default';
    const filePath = formData.get('path') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Create bucket directory if needed
    const bucketPath = path.join(storagePath, bucket);
    if (!fs.existsSync(bucketPath)) {
      fs.mkdirSync(bucketPath, { recursive: true });
    }
    
    // Save file
    const fileName = filePath || file.name;
    const fullPath = path.join(bucketPath, fileName);
    
    // Ensure directory exists for nested paths
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullPath, buffer);
    
    const url = `/api/storage/${bucket}/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      url,
      path: fileName,
      size: file.size 
    });
  } catch (error) {
    console.error('Storage upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
