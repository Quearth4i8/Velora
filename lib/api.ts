import { characterService, supabase } from './supabase';
import { storageService } from './storage';
import { CharacterDraft, CharacterImage, ChatMessage, Conversation } from './types';
import { deserializeCharacter } from './db';

const normalizeStoragePath = (value: string): string => {
  let path = value.trim();
  path = path.replace(/^\/+/, '');
  path = path.split('?')[0].split('#')[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    // ignore decode errors
  }
  return path;
};

const extractStoragePathFromUrl = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const markerIndex = parts.findIndex(part => part === 'public' || part === 'sign');
    if (markerIndex !== -1 && parts.length > markerIndex + 2) {
      return normalizeStoragePath(parts.slice(markerIndex + 2).join('/'));
    }
    const last = parts[parts.length - 1] || '';
    return normalizeStoragePath(last);
  } catch {
    const withoutQuery = rawUrl.split('?')[0].split('#')[0];
    const urlParts = withoutQuery.split('/');
    const last = urlParts[urlParts.length - 1] || '';
    return normalizeStoragePath(last);
  }
};

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

  async getCharacterFresh(id: string) {
    try {
      const result = await characterService.getCharacter(id);
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

  async getSpecialCharacters() {
    try {
      const results = await characterService.listSpecialCharactersCached(50);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get special characters:', error);
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

  async listSpecialCharacters(limit = 10) {
    try {
      const results = await characterService.listSpecialCharactersCached(limit);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to list special characters:', error);
      return { success: false, error };
    }
  },

  async getUserCharacters(limit = 50) {
    try {
      const results = await characterService.listUserCharacters(limit);
      const deserialized = results.map(deserializeCharacter);
      return { success: true, data: deserialized };
    } catch (error) {
      console.error('Failed to get user characters:', error);
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

  async updateCharacterDirect(id: string, updates: Record<string, any>) {
    try {
      const result = await characterService.updateCharacterDirect(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update character directly:', error);
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
      const storagePath = imageUrl ? extractStoragePathFromUrl(imageUrl) : null;
      if (storagePath) {
        const deleted = await storageService.deleteImage(storagePath);

        if (!deleted) {
          console.warn('Failed to delete image from storage, but continuing...');
        }
      }

      // Update character to remove image URL
      const result = await this.updateCharacterImage(characterId, '');

      return { success: true };
    } catch (error) {
      console.error('Failed to delete character image:', error);
      return { success: false, error };
    }
  },

  async addCharacterImage(characterId: string, imageData: string, prompt?: string, model?: string, style?: string, seed?: number): Promise<{ success: boolean; data?: CharacterImage; error?: any }> {
    try {
      // Upload image to storage
      const storageFile = await storageService.uploadImage(characterId, imageData);

      if (!storageFile) {
        throw new Error('Failed to upload image to storage');
      }

      // Save image record to database
      const { data: { session } } = await supabase.auth.getSession();
      const insertPayload: Record<string, any> = {
        character_id: characterId,
        image_url: storageFile.url,
        file_name: storageFile.name,
        file_size: storageFile.size,
        is_primary: false, // New images are not primary by default
        generation_prompt: prompt,
        generation_model: model,
        generation_style: style,
        generation_seed: seed,
      };

      if (session?.user) {
        insertPayload.user_id = session.user.id;
      }

      const { data, error } = await supabase
        .from('character_images')
        .insert(insertPayload)
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
      const { data: { session } } = await supabase.auth.getSession();

      let query = supabase
        .from('character_images')
        .select(`
          *,
          characters!inner(
            name,
            user_id,
            is_gallery_only
          )
        `);

      // Default to filtering by user_id if logged in, to respect "own images only" request
      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const images = data?.map((img: any) => ({
        ...this.mapDbImageToCharacterImage(img),
        characterName: img.characters?.name || 'Unknown',
        isGalleryOnly: img.characters?.is_gallery_only || false
      })) || [];
      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get all character images:', error);
      return { success: false, error };
    }
  },

  async getAllCharacterImagesPaged(
    opts?: { limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: CharacterImage[]; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 50)));
      const offset = Math.max(0, Number(opts?.offset ?? 0));

      let query = supabase
        .from('character_images')
        .select(`
          *,
          characters!inner(
            name,
            user_id,
            is_gallery_only
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const images =
        data?.map((img: any) => ({
          ...this.mapDbImageToCharacterImage(img),
          characterName: img.characters?.name || 'Unknown',
          isGalleryOnly: img.characters?.is_gallery_only || false,
        })) || [];

      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get all character images paged:', error);
      return { success: false, error };
    }
  },

  async getAllCharacterImagesPagedGlobal(
    opts?: { limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: CharacterImage[]; error?: any }> {
    try {
      const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 50)));
      const offset = Math.max(0, Number(opts?.offset ?? 0));

      const { data, error } = await supabase
        .from('character_images')
        .select(`
          *,
          characters!inner(
            name,
            user_id,
            is_gallery_only
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const images =
        data?.map((img: any) => ({
          ...this.mapDbImageToCharacterImage(img),
          characterName: img.characters?.name || 'Unknown',
          isGalleryOnly: img.characters?.is_gallery_only || false,
        })) || [];

      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get all character images paged global:', error);
      return { success: false, error };
    }
  },

  async getUserImages(limit = 100): Promise<{ success: boolean; data?: CharacterImage[]; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { success: true, data: [] };

      const { data, error } = await supabase
        .from('character_images')
        .select(`
          *,
          characters!inner(
            name
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const images = data?.map((img: any) => ({
        ...this.mapDbImageToCharacterImage(img),
        characterName: img.characters?.name || 'Unknown'
      })) || [];
      return { success: true, data: images };
    } catch (error) {
      console.error('Failed to get user images:', error);
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
        fileName = extractStoragePathFromUrl(imageData.image_url);
      }

      if (fileName) {
        fileName = normalizeStoragePath(fileName);
      }

      if (!fileName) {
        throw new Error('No file name available for deletion');
      }

      // Delete from storage first (following Supabase AI recommendations)
      let storageDeleted = false;
      let storageRetries = 0;
      const maxStorageRetries = 3;

      while (!storageDeleted && storageRetries < maxStorageRetries) {
        try {
          storageDeleted = await storageService.deleteImage(fileName);
          if (storageDeleted) {
            storageRetries = maxStorageRetries; // Exit loop
          } else {
            storageRetries++;
            if (storageRetries < maxStorageRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        } catch (storageError) {
          storageRetries++;
          if (storageRetries < maxStorageRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!storageDeleted) {
        throw new Error('Failed to delete image from storage. Please check storage permissions and bucket access.');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('character_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw new Error(`Failed to delete from database: ${dbError.message}`);
      }

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
      userId: dbImage.user_id,
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

  async getConversation(characterId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Get all conversations for this character and user, order by most recent
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Create new conversation if doesn't exist
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            character_id: characterId,
            user_id: session.user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        return { success: true, data: newConv };
      }

      let encounterIds = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const prefix = `encounter_conversation_${characterId}_`;
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (!k || !k.startsWith(prefix)) continue;
            const v = window.localStorage.getItem(k);
            if (v) encounterIds.add(v);
          }
        } catch {
          // ignore
        }
      }

      const preferred = data.find((c: any) => !encounterIds.has(String(c?.id || '')));
      return { success: true, data: preferred || data[0] };
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return { success: false, error };
    }
  },

  async createConversation(characterId: string, title?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const payload: Record<string, any> = {
        character_id: characterId,
        user_id: session.user.id,
      };

      const trimmedTitle = String(title || '').trim();
      if (trimmedTitle) payload.title = trimmedTitle;

      const { data, error } = await supabase
        .from('conversations')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return { success: false, error };
    }
  },

  async updateConversationTitle(conversationId: string, title: string) {
    try {
      const trimmedTitle = String(title || '').trim();
      if (!trimmedTitle) return { success: true, data: null };

      const { data, error } = await supabase
        .from('conversations')
        .update({ title: trimmedTitle, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      return { success: false, error };
    }
  },

  async listEncounterConversations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', session.user.id)
        .ilike('title', 'encounter:%')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to list encounter conversations:', error);
      return { success: false, error };
    }
  },

  async deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return { success: false, error };
    }
  },

  async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, error };
    }
  },

  async saveMessage(message: Partial<ChatMessage>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const imageUrls = Array.isArray((message as any).imageUrls)
        ? (message as any).imageUrls
        : (message.imageUrl ? [message.imageUrl] : null);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: message.conversationId,
          character_id: message.characterId,
          user_id: session.user.id,
          content: message.content,
          sender: message.sender,
          image_url: message.imageUrl,
          image_urls: imageUrls,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to save message:', error);
      return { success: false, error };
    }
  },

  async deleteMessage(messageId: string) {
    try {
      console.log('🗑️ API: Deleting message from Supabase:', messageId);
      await characterService.deleteMessage(messageId);
      console.log('✅ API: Message deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ API: Failed to delete message:', error);
      return { success: false, error };
    }
  },

  async updateMessage(messageId: string, updates: Partial<ChatMessage>) {
    try {
      const hasImageUrl = Object.prototype.hasOwnProperty.call(updates, 'imageUrl') && typeof updates.imageUrl === 'string';
      const hasImageUrls = Array.isArray((updates as any).imageUrls);

      if (hasImageUrl || hasImageUrls) {
        const payload: Record<string, any> = {};
        if (hasImageUrl) payload.image_url = updates.imageUrl ? updates.imageUrl : null;
        if (hasImageUrls) payload.image_urls = (updates as any).imageUrls;

        const { data, error } = await supabase
          .from('messages')
          .update(payload)
          .eq('id', messageId)
          .select('id, image_url, image_urls')
          .maybeSingle();

        if (error) {
          console.error('Update failed:', error);
          return { success: false, error };
        }

        if (!data) {
          console.error('No message found to update');
          return { success: false, error: new Error('Message not found') };
        }

        return { success: true, data };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('Failed to update message:', error);
      return { success: false, error };
    }
  },

  async resetConversation(conversationId: string) {
    try {
      // First, get the character ID from the conversation
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('character_id')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;
      if (!conversation?.character_id) throw new Error('No character found for conversation');

      // Reset the character's seed to undefined
      const { error: seedError } = await supabase
        .from('characters')
        .update({ 
          generation_seed: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.character_id);

      if (seedError) {
        console.warn('Failed to reset character seed:', seedError);
      }

      // Deleting the conversation will automatically delete messages due to ON DELETE CASCADE
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteError) throw deleteError;
      return { success: true };
    } catch (error) {
      console.error('Failed to reset conversation:', error);
      return { success: false, error };
    }
  },
};
