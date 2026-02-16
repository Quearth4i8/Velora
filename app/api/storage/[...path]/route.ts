import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'data', 'storage');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // params.path contains all segments after /api/storage/
    const pathSegments = params.path;
    if (pathSegments.length < 2) {
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    const bucket = pathSegments[0];
    const filePath = pathSegments.slice(1).join('/');
    const fullPath = path.join(storagePath, bucket, filePath);
    
    // Security check - ensure path is within storage directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorage = path.resolve(storagePath);
    if (!resolvedPath.startsWith(resolvedStorage)) {
      return new NextResponse('Access denied', { status: 403 });
    }
    
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    const file = fs.readFileSync(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    
    const contentType = getContentType(ext);
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Storage error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.pdf': 'application/pdf',
  };
  return types[ext] || 'application/octet-stream';
}
