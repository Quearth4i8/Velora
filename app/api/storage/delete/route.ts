import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'data', 'storage');

export async function POST(request: NextRequest) {
  try {
    const { bucket, path: filePath } = await request.json();
    
    if (!bucket || !filePath) {
      return NextResponse.json({ error: 'Bucket and path required' }, { status: 400 });
    }
    
    const fullPath = path.join(storagePath, bucket, filePath);
    
    // Security check - ensure path is within storage directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorage = path.resolve(storagePath);
    if (!resolvedPath.startsWith(resolvedStorage)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
