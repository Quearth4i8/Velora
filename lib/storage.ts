export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  contentType?: string;
}

// Local storage base URL
const STORAGE_BASE_URL = '/api/storage';

export class StorageService {
  private bucketName = 'character-images';

  private isProbablyHttpUrl(value: string): boolean {
    const url = String(value || '').trim();
    return /^https?:\/\//i.test(url);
  }

  private parseDataUrl(value: string): { mime: string; base64: string } | null {
    const s = String(value || '').trim();
    const match = s.match(/^data:([^;]+);base64,(.*)$/i);
    if (!match) return null;
    return { mime: match[1] || 'application/octet-stream', base64: match[2] || '' };
  }

  private base64ToBlob(base64: string, mime: string) {
    const cleaned = String(base64 || '')
      .trim()
      .replace(/\s+/g, '');

    const byteCharacters = atob(cleaned);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  /**
   * Convert Supabase storage URL to local storage URL
   */
  convertToLocalUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // If already local URL, return as-is
    if (url.startsWith('/api/storage/') || url.startsWith('/data/')) {
      return url;
    }
    
    // Handle data URLs
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Convert Supabase URL to local
    // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
    const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (supabaseMatch) {
      const bucket = supabaseMatch[1];
      const path = supabaseMatch[2];
      return `${STORAGE_BASE_URL}/${bucket}/${path}`;
    }
    
    return url;
  }

  /**
   * Create the bucket if it doesn't exist (local - no-op)
   */
  async createBucket(): Promise<boolean> {
    return true;
  }

  /**
   * List all available buckets
   */
  async listBuckets(): Promise<string[]> {
    return ['character-images', 'videos', 'avatars'];
  }

  /**
   * Upload an image to local storage
   */
  async uploadImage(characterId: string, imageData: string | Blob, fileName?: string): Promise<StorageFile | null> {
    try {
      let mime = 'image/jpeg';
      let fileExt = 'jpg';
      let finalFileName = fileName || `${characterId}-${Date.now()}.${fileExt}`;
      let file: Blob;
      
      // Convert base64 to blob if needed
      if (typeof imageData === 'string') {
        const raw = String(imageData || '').trim();

        if (this.isProbablyHttpUrl(raw)) {
          // Fetch from URL
          const res = await fetch(raw, {
            mode: 'cors',
            credentials: 'omit',
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
          }
          
          file = await res.blob();
          mime = file.type || 'image/jpeg';
          fileExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
          finalFileName = fileName || `${characterId}-${Date.now()}.${fileExt}`;
        } else {
          const parsed = this.parseDataUrl(raw);
          if (parsed) {
            mime = parsed.mime || 'image/jpeg';
            fileExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
            file = this.base64ToBlob(parsed.base64, mime);
            finalFileName = fileName || `${characterId}-${Date.now()}.${fileExt}`;
          } else {
            // Assume raw base64
            file = this.base64ToBlob(raw, mime);
          }
        }
      } else {
        file = imageData;
        mime = file.type || 'image/jpeg';
        fileExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        finalFileName = fileName || `${characterId}-${Date.now()}.${fileExt}`;
      }

      // Upload to local storage API
      const formData = new FormData();
      formData.append('file', file, finalFileName);
      formData.append('bucket', this.bucketName);
      formData.append('path', finalFileName);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        name: finalFileName,
        url: result.url || `${STORAGE_BASE_URL}/${this.bucketName}/${finalFileName}`,
        size: file.size,
        contentType: mime,
      };
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  }

  /**
   * Delete an image from local storage
   */
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      // Extract just the filename from a full URL
      let normalizedFileName = fileName.trim();
      if (normalizedFileName.includes('/')) {
        normalizedFileName = normalizedFileName.split('/').pop() || normalizedFileName;
      }
      
      const response = await fetch('/api/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: this.bucketName,
          path: normalizedFileName,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
      return false;
    }
  }

  /**
   * Get the public URL for a file (now just returns local URL)
   */
  getPublicUrl(fileName: string): string {
    // If it's already a full URL, convert it
    if (fileName.startsWith('http')) {
      return this.convertToLocalUrl(fileName);
    }
    
    // Otherwise, construct local URL
    const cleanFileName = fileName.replace(/^\/+/g, '');
    return `${STORAGE_BASE_URL}/${this.bucketName}/${cleanFileName}`;
  }

  /**
   * List all files in the bucket from local storage
   */
  async listFiles(): Promise<Array<{ name: string; path: string; size: number; url: string }>> {
    try {
      const response = await fetch(`/api/storage/list?bucket=${this.bucketName}`);
      if (!response.ok) {
        throw new Error('Failed to list files');
      }
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Failed to list storage files:', error);
      return [];
    }
  }

  /**
   * Fix image URLs in data - converts Supabase URLs to local URLs
   */
  fixImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    return this.convertToLocalUrl(url);
  }

  /**
   * Generate a unique file name for a character image
   */
  generateFileName(characterId: string, suffix?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const suffixStr = suffix ? `-${suffix}` : '';
    return `${characterId}-${timestamp}-${randomId}${suffixStr}.jpg`;
  }
}

export const storageService = new StorageService();
