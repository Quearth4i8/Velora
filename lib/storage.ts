import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Storage will not work.');
}

// Import the shared Supabase client to avoid multiple instances
import { supabase } from './supabase';

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  contentType?: string;
}

export class StorageService {
  private supabase = supabase;
  private bucketName = 'character-images';

  /**
   * Create the bucket if it doesn't exist
   */
  async createBucket(): Promise<boolean> {
    try {
      // Create bucket if it doesn't exist
      const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error && !error.message.includes('already exists')) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Failed to create bucket:', error);
      return false;
    }
  }

  /**
   * Debug: List all available buckets
   */
  async listBuckets(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      if (error) {
        console.error('Error listing buckets:', error);
        return [];
      }
      return data?.map(bucket => bucket.name) || [];
    } catch (error) {
      console.error('Failed to list buckets:', error);
      return [];
    }
  }

  /**
   * Upload an image to Supabase storage
   */
  async uploadImage(characterId: string, imageData: string | Blob, fileName?: string): Promise<StorageFile | null> {
    try {
      // Generate a unique file name if not provided
      const fileExt = typeof imageData === 'string' ? 'jpg' : 'png';
      const finalFileName = fileName || `${characterId}-${Date.now()}.${fileExt}`;
      
      // Convert base64 to blob if needed
      let file: Blob;
      if (typeof imageData === 'string') {
        // Remove data URL prefix if present
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        file = new Blob([byteArray], { type: 'image/jpeg' });
      } else {
        file = imageData;
      }

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(finalFileName, file, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(finalFileName);

      return {
        name: finalFileName,
        url: urlData.publicUrl,
        size: file.size,
        contentType: 'image/jpeg',
      };
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  }

  /**
   * Delete an image from Supabase storage
   */
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      let normalizedFileName = fileName.trim();
      normalizedFileName = normalizedFileName.replace(/^\/+/, '');
      normalizedFileName = normalizedFileName.split('?')[0].split('#')[0];
      try {
        normalizedFileName = decodeURIComponent(normalizedFileName);
      } catch {
        // ignore decode errors
      }

      // Try multiple deletion methods since Supabase sometimes returns success without actually deleting
      let deletionSuccess = false;
      
      // Method 1: Standard deletion
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([normalizedFileName]);

      if (error) {
        console.error('Storage delete error:', error);
        return false;
      }

      // Method 2: Try emptying and recreating the file (workaround)
      try {
        const emptyBlob = new Blob([''], { type: 'text/plain' });
        const { error: uploadError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(normalizedFileName, emptyBlob, { 
            contentType: 'text/plain',
            upsert: true 
          });
          
        if (!uploadError) {
          // Now try to delete the empty file
          const { error: deleteError } = await this.supabase.storage
            .from(this.bucketName)
            .remove([normalizedFileName]);
            
          if (!deleteError) {
            deletionSuccess = true;
          }
        }
      } catch (workaroundError) {
        // Workaround method failed, continue to next method
      }

      // Method 3: Try with different file path
      if (!deletionSuccess) {
        try {
          const { error: pathError } = await this.supabase.storage
            .from(this.bucketName)
            .remove([`/${normalizedFileName}`]);
            
          if (!pathError) {
            deletionSuccess = true;
          }
        } catch (pathError) {
          // Path-based deletion failed
        }
      }
      
      // Verify file actually doesn't exist anymore
      try {
        const lastSlashIndex = normalizedFileName.lastIndexOf('/');
        const listPath = lastSlashIndex >= 0 ? normalizedFileName.slice(0, lastSlashIndex) : '';
        const searchName = lastSlashIndex >= 0 ? normalizedFileName.slice(lastSlashIndex + 1) : normalizedFileName;
        const { data: fileData, error: listError } = await this.supabase.storage
          .from(this.bucketName)
          .list(listPath, { search: searchName });

        if (listError) {
          console.error('Storage verify error:', listError);
          return false;
        }
        
        const fileStillExists = fileData && fileData.some(file => file.name === searchName);
        
        if (fileStillExists) {
          console.error('File still exists after deletion attempts - may need manual cleanup');
          return false;
        } else {
          deletionSuccess = true;
        }
      } catch (verifyError) {
        return false;
      }

      return deletionSuccess;
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
      return false;
    }
  }

  /**
   * Get a signed URL for a private image (if needed in the future)
   */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        console.error('Storage signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      return null;
    }
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
