import { characterService, supabase } from './supabase';
import { storageService } from './storage';
import { CharacterDraft, CharacterImage } from './types';
import { deserializeCharacter } from './db';

export const characterAPI = {
  async createCharacter(draft: CharacterDraft) {
    try {
      const result = await characterService.createCharacter(draft);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to create character:', error);
      return { success: false, error };
    }
  },

  async getCharacter(id: string) {
    try {
      const result = await characterService.getCharacterCached(id);
      const deserialized = deserializeCharacter(result);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get character:', error);
      return { success: false, error };
    }
  },

  async getCharacters() {
    try {
      const results = await characterService.listCharactersCached(50);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get characters:', error);
      return { success: false, error };
    }
  },

  async listCharacters(limit = 10) {
    try {
      const results = await characterService.listCharactersCached(limit);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to list characters:', error);
      return { success: false, error };
    }
  },

  async updateCharacter(id: string, draft: Partial<CharacterDraft>) {
    try {
      const result = await characterService.updateCharacter(id, draft);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update character:', error);
      return { success: false, error };
    }
  },

  async updateCharacterImage(id: string, imageUrl: string) {
    try {
      // Direct database update to avoid type issues
      const result = await characterService.updateCharacterDirect(id, {
        generated_image: imageUrl,
        generation_status: 'completed',
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update character image:', error);
      return { success: false, error };
    }
  },

  async uploadCharacterImage(characterId: string, imageData: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // Upload image to Supabase storage
      const storageFile = await storageService.uploadImage(characterId, imageData);
      
      if (!storageFile) {
        throw new Error('Failed to upload image to storage');
      }

      // Update character with the new image URL
      const result = await this.updateCharacterImage(characterId, storageFile.url);
      
      if (!result.success) {
        // If database update fails, try to clean up the uploaded image
        await storageService.deleteImage(storageFile.name);
        throw new Error('Failed to update character with image URL');
      }

      return { 
        success: true, 
        data: { 
          imageUrl: storageFile.url,
          fileName: storageFile.name,
          size: storageFile.size
        }
      };
    } catch (error) {
      console.error('Failed to upload character image:', error);
      return { success: false, error };
    }
  },

  async deleteCharacterImage(characterId: string, imageUrl: string): Promise<{ success: boolean; error?: any }> {
    try {
      // Extract file name from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const deleted = await storageService.deleteImage(fileName);
      
      if (!deleted) {
        console.warn('Failed to delete image from storage, but continuing...');
      }

      // Update character to remove image URL
      const result = await this.updateCharacterImage(characterId, '');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete character image:', error);
      return { success: false, error };
    }
  },

  async addCharacterImage(characterId: string, imageData: string, prompt?: string, model?: string, style?: string): Promise<{ success: boolean; data?: CharacterImage; error?: any }> {
    try {
      // Upload image to storage
      const storageFile = await storageService.uploadImage(characterId, imageData);
      
      if (!storageFile) {
        throw new Error('Failed to upload image to storage');
      }

      // Save image record to database
      const { data, error } = await supabase
        .from('character_images')
        .insert({
          character_id: characterId,
          image_url: storageFile.url,
          file_name: storageFile.name,
          file_size: storageFile.size,
          is_primary: false, // New images are not primary by default
          generation_prompt: prompt,
          generation_model: model,
          generation_style: style,
        })
        .select()
        .single();

      if (error) {
        // If database insert fails, try to clean up the uploaded image
        await storageService.deleteImage(storageFile.name);
        throw error;
      }

      return { success: true, data: this.mapDbImageToCharacterImage(data) };
    } catch (error) {
      console.error('Failed to add character image:', error);
      return { success: false, error };
    }
  },

  async getCharacterImages(characterId: string): Promise<{ success: boolean; data?: CharacterImage[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('character_images')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const images = data?.map((img: any) => this.mapDbImageToCharacterImage(img)) || [];
      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get character images:', error);
      return { success: false, error };
    }
  },

  async getAllCharacterImages(): Promise<{ success: boolean; data?: CharacterImage[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('character_images')
        .select(`
          *,
          characters!inner(
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const images = data?.map((img: any) => ({
        ...this.mapDbImageToCharacterImage(img),
        characterName: img.characters?.name || 'Unknown'
      })) || [];
      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get all character images:', error);
      return { success: false, error };
    }
  },

  async setPrimaryImage(characterId: string, imageId: string): Promise<{ success: boolean; data?: CharacterImage; error?: any }> {
    try {
      // First, set all images for this character to non-primary
      await supabase
        .from('character_images')
        .update({ is_primary: false })
        .eq('character_id', characterId);

      // Then set the specified image as primary
      const { data, error } = await supabase
        .from('character_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('character_id', characterId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also update the generated_image column in the characters table
      await supabase
        .from('characters')
        .update({ generated_image: data.image_url })
        .eq('id', characterId);

      return { success: true, data: this.mapDbImageToCharacterImage(data) };
    } catch (error) {
      console.error('Error setting primary image:', error);
      return { success: false, error };
    }
  },

  async deleteCharacterImageFromGallery(imageId: string): Promise<{ success: boolean; error?: any }> {
    try {
      // Get the image record to get the file name
      const { data: imageData, error: fetchError } = await supabase
        .from('character_images')
        .select('file_name, image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch image record: ${fetchError.message}`);
      }

      let fileName = imageData?.file_name;
      
      // If file_name is not available, try to extract from URL
      if (!fileName && imageData?.image_url) {
        console.log('Original image URL:', imageData.image_url);
        
        // Extract file name from Supabase URL
        const urlParts = imageData.image_url.split('/');
        fileName = urlParts[urlParts.length - 1];
        
        // If the URL contains encoded characters, decode them
        try {
          fileName = decodeURIComponent(fileName);
        } catch (decodeError) {
          console.warn('Failed to decode filename, using original:', fileName);
        }
        
        console.log('Extracted file name from URL:', fileName);
      }

      if (!fileName) {
        throw new Error('No file name available for deletion');
      }

      // Delete from storage first
      console.log('Attempting to delete file from storage:', fileName);
      const storageDeleted = await storageService.deleteImage(fileName);
      if (!storageDeleted) {
        console.warn('Failed to delete file from storage, but continuing with database deletion...');
      } else {
        console.log('Successfully deleted file from storage:', fileName);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('character_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw new Error(`Failed to delete from database: ${dbError.message}`);
      }

      console.log('Successfully deleted image from gallery:', imageId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete character image:', error);
      return { success: false, error };
    }
  },

  mapDbImageToCharacterImage(dbImage: any): CharacterImage {
    return {
      id: dbImage.id,
      characterId: dbImage.character_id,
      imageUrl: dbImage.image_url,
      fileName: dbImage.file_name,
      fileSize: dbImage.file_size,
      isPrimary: dbImage.is_primary,
      generationPrompt: dbImage.generation_prompt,
      generationModel: dbImage.generation_model,
      generationStyle: dbImage.generation_style,
      createdAt: new Date(dbImage.created_at),
      updatedAt: new Date(dbImage.updated_at),
    };
  },

  async deleteCharacter(id: string) {
    try {
      await characterService.deleteCharacter(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete character:', error);
      return { success: false, error };
    }
  },
};
