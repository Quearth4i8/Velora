import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'data', 'storage');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'character-images';
    
    const bucketPath = path.join(STORAGE_ROOT, bucket);
    
    // Ensure directory exists
    try {
      await fs.access(bucketPath);
    } catch {
      return NextResponse.json({ files: [] });
    }
    
    // Read all files recursively
    const files: Array<{ name: string; path: string; size: number; url: string }> = [];
    
    async function readDirRecursive(dir: string, baseDir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
          await readDirRecursive(fullPath, baseDir);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            path: relativePath,
            size: stats.size,
            url: `/api/storage/${bucket}/${relativePath.replace(/\\/g, '/')}`,
          });
        }
      }
    }
    
    await readDirRecursive(bucketPath, bucketPath);
    
    // Sort by modification time (newest first)
    files.sort((a, b) => {
      return 0; // Keep default order for now
    });
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to list storage files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
