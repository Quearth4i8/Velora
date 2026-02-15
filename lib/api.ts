import { characterService, supabase } from './supabase';
import { storageService } from './storage';
import { CharacterDraft, CharacterImage, ChatMessage, Conversation, VideoRequestStatus } from './types';
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

  async getConversationById(conversationId: string) {
    try {
      const id = String(conversationId || '').trim();
      if (!id) return { success: false, error: new Error('Missing conversationId') };

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: false, error: new Error('Conversation not found') };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to get conversation by id:', error);
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
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: false, error: new Error('Conversation not found') };
      }
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

      const { error: messagesDeleteError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesDeleteError) throw messagesDeleteError;

      const { error: touchError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (touchError) {
        console.warn('Failed to update conversation timestamp:', touchError);
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to reset conversation:', error);
      return { success: false, error };
    }
  },

  async getEncounterEnforcement(conversationId: string) {
    try {
      const id = String(conversationId || '').trim();
      if (!id) return { success: false, error: new Error('Missing conversationId') };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('encounter_enforcement')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('conversation_id', id)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data: data || null };
    } catch (error) {
      console.error('Failed to get encounter enforcement:', error);
      return { success: false, error };
    }
  },

  async setEncounterEnforcement(args: { conversationId: string; scenarioId?: string | null; strikeCount?: number; blocked?: boolean }) {
    try {
      const conversationId = String(args.conversationId || '').trim();
      if (!conversationId) return { success: false, error: new Error('Missing conversationId') };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const strike = typeof args.strikeCount === 'number' && Number.isFinite(args.strikeCount)
        ? Math.max(0, Math.min(3, Math.floor(args.strikeCount)))
        : undefined;

      const payload: Record<string, any> = {
        user_id: session.user.id,
        conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      };

      if (Object.prototype.hasOwnProperty.call(args, 'blocked')) payload.blocked = Boolean(args.blocked);
      if (Object.prototype.hasOwnProperty.call(args, 'scenarioId')) payload.scenario_id = args.scenarioId ? String(args.scenarioId) : null;
      if (typeof strike === 'number') payload.strike_count = strike;

      const { data, error } = await supabase
        .from('encounter_enforcement')
        .upsert(payload, { onConflict: 'user_id,conversation_id' })
        .select('*')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to set encounter enforcement:', error);
      return { success: false, error };
    }
  },

  async incrementEncounterStrike(args: { conversationId: string; scenarioId?: string | null }) {
    try {
      const conversationId = String(args.conversationId || '').trim();
      if (!conversationId) return { success: false, error: new Error('Missing conversationId') };

      const existing = await this.getEncounterEnforcement(conversationId);
      const currentStrike = existing.success && existing.data ? Number(existing.data.strike_count || 0) : 0;
      const currentBlocked = existing.success && existing.data ? Boolean(existing.data.blocked) : false;

      const nextStrike = Math.max(0, Math.min(3, Math.floor(currentStrike) + 1));
      const nextBlocked = currentBlocked || nextStrike >= 3;

      const updated = await this.setEncounterEnforcement({
        conversationId,
        scenarioId: Object.prototype.hasOwnProperty.call(args, 'scenarioId') ? args.scenarioId : undefined,
        strikeCount: nextStrike,
        blocked: nextBlocked,
      });

      if (!updated.success) return updated;
      return { success: true, data: { ...updated.data, strike_count: nextStrike, blocked: nextBlocked } };
    } catch (error) {
      console.error('Failed to increment encounter strike:', error);
      return { success: false, error };
    }
  },

  async resetEncounterEnforcement(conversationId: string) {
    return this.setEncounterEnforcement({ conversationId, strikeCount: 0, blocked: false });
  },

  async getConversationContext(conversationId: string) {
    try {
      const id = String(conversationId || '').trim();
      if (!id) return { success: false, error: new Error('Missing conversationId') };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversation_context')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('conversation_id', id)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data: data || null };
    } catch (error) {
      console.error('Failed to get conversation context:', error);
      return { success: false, error };
    }
  },

  async setConversationContext(args: {
    conversationId: string;
    relation?: string | null;
    sexToys?: string[];
    gifts?: any;
  }) {
    try {
      const conversationId = String(args.conversationId || '').trim();
      if (!conversationId) return { success: false, error: new Error('Missing conversationId') };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const payload: Record<string, any> = {
        user_id: session.user.id,
        conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      };

      if (Object.prototype.hasOwnProperty.call(args, 'relation')) payload.relation = args.relation ? String(args.relation) : null;
      if (Object.prototype.hasOwnProperty.call(args, 'sexToys')) payload.sex_toys = Array.isArray(args.sexToys) ? args.sexToys.map((t) => String(t)) : [];
      if (Object.prototype.hasOwnProperty.call(args, 'gifts')) payload.gifts = args.gifts;

      const { data, error } = await supabase
        .from('conversation_context')
        .upsert(payload, { onConflict: 'user_id,conversation_id' })
        .select('*')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to set conversation context:', error);
      return { success: false, error };
    }
  },

  // Video Request API functions
  async createVideoRequest(input: { imageId: string; characterId: string; promptIdea: string }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('video_requests')
        .insert({
          user_id: session.user.id,
          image_id: input.imageId,
          character_id: input.characterId,
          prompt_idea: input.promptIdea.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: this.mapDbVideoRequestToVideoRequest(data) };
    } catch (error) {
      console.error('Failed to create video request:', error);
      return { success: false, error };
    }
  },

  async getVideoRequests(opts?: { status?: string; limit?: number; offset?: number }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 50)));
      const offset = Math.max(0, Number(opts?.offset ?? 0));

      let query = supabase
        .from('video_requests')
        .select(`
          *,
          character_images!inner(image_url),
          characters!inner(name)
        `)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (opts?.status) {
        query = query.eq('status', opts.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const videoRequests = await Promise.all(
        data?.map(async (vr: any) => {
          const base = this.mapDbVideoRequestToVideoRequest(vr);
          const details: any = {
            ...base,
            imageUrl: vr.character_images?.image_url || '',
            characterName: vr.characters?.name || 'Unknown',
          };
          
          if (session?.user) {
            const { data: likeData } = await supabase
              .from('video_request_likes')
              .select('id')
              .eq('video_request_id', vr.id)
              .eq('user_id', session.user.id)
              .maybeSingle();
            details.userHasLiked = !!likeData;
          }
          
          return details;
        }) || []
      );

      return { success: true, data: videoRequests };
    } catch (error) {
      console.error('Failed to get video requests:', error);
      return { success: false, error };
    }
  },

  async getUserVideoRequests() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { success: true, data: [] };

      const { data, error } = await supabase
        .from('video_requests')
        .select(`
          *,
          character_images!inner(image_url),
          characters!inner(name)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const videoRequests = data?.map((vr: any) => ({
        ...this.mapDbVideoRequestToVideoRequest(vr),
        imageUrl: vr.character_images?.image_url || '',
        characterName: vr.characters?.name || 'Unknown',
      })) || [];

      return { success: true, data: videoRequests };
    } catch (error) {
      console.error('Failed to get user video requests:', error);
      return { success: false, error };
    }
  },

  async likeVideoRequest(videoRequestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_request_likes')
        .insert({
          video_request_id: videoRequestId,
          user_id: session.user.id,
        });

      if (error && !error.message.includes('duplicate key')) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to like video request:', error);
      return { success: false, error };
    }
  },

  async unlikeVideoRequest(videoRequestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_request_likes')
        .delete()
        .eq('video_request_id', videoRequestId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to unlike video request:', error);
      return { success: false, error };
    }
  },

  async deleteVideoRequest(videoRequestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_requests')
        .delete()
        .eq('id', videoRequestId)
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to delete video request:', error);
      return { success: false, error };
    }
  },

  // Admin API functions for video management
  async adminUpdateVideoRequest(
    videoRequestId: string,
    updates: {
      status?: VideoRequestStatus;
      videoUrl?: string;
      thumbnailUrl?: string;
      adminNotes?: string;
    }
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Check if user is admin (you may want to add proper admin checks)
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.status) payload.status = updates.status;
      if (updates.videoUrl !== undefined) payload.video_url = updates.videoUrl;
      if (updates.thumbnailUrl !== undefined) payload.thumbnail_url = updates.thumbnailUrl;
      if (updates.adminNotes !== undefined) payload.admin_notes = updates.adminNotes;

      const { data, error } = await supabase
        .from('video_requests')
        .update(payload)
        .eq('id', videoRequestId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: this.mapDbVideoRequestToVideoRequest(data) };
    } catch (error) {
      console.error('Failed to update video request:', error);
      return { success: false, error };
    }
  },

  mapDbVideoRequestToVideoRequest(dbVideoRequest: any) {
    return {
      id: dbVideoRequest.id,
      userId: dbVideoRequest.user_id,
      imageId: dbVideoRequest.image_id,
      characterId: dbVideoRequest.character_id,
      promptIdea: dbVideoRequest.prompt_idea,
      status: dbVideoRequest.status,
      likesCount: dbVideoRequest.likes_count || 0,
      reviewsCount: dbVideoRequest.reviews_count || 0,
      videoUrl: dbVideoRequest.video_url,
      thumbnailUrl: dbVideoRequest.thumbnail_url,
      adminNotes: dbVideoRequest.admin_notes,
      createdAt: new Date(dbVideoRequest.created_at),
      updatedAt: new Date(dbVideoRequest.updated_at),
    };
  },

  // Admin API functions
  async checkIsAdmin(): Promise<{ success: boolean; isAdmin: boolean }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { success: true, isAdmin: false };

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return { success: true, isAdmin: data?.is_admin || false };
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return { success: false, isAdmin: false };
    }
  },

  async getDashboardStats(): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin.isAdmin) throw new Error('Unauthorized: Admin access required');

      // Get user stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Get character stats
      const { count: totalCharacters } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true });

      const { count: specialCharacters } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('character_type', 'special');

      const { count: galleryCharacters } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('is_gallery_only', true);

      const { count: charactersCreatedToday } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get video stats
      const { data: videoStats, error: videoError } = await supabase
        .from('video_requests')
        .select('status, likes_count');

      if (videoError) throw videoError;

      const videoStatsData = {
        totalRequests: videoStats?.length || 0,
        pendingRequests: videoStats?.filter((v: { status: string }) => v.status === 'pending').length || 0,
        approvedRequests: videoStats?.filter((v: { status: string }) => v.status === 'approved').length || 0,
        generatingRequests: videoStats?.filter((v: { status: string }) => v.status === 'generating').length || 0,
        completedVideos: videoStats?.filter((v: { status: string }) => v.status === 'completed').length || 0,
        rejectedRequests: videoStats?.filter((v: { status: string }) => v.status === 'rejected').length || 0,
        totalLikes: videoStats?.reduce((sum: number, v: { likes_count: number }) => sum + (v.likes_count || 0), 0) || 0,
      };

      // Get top requested images
      const { data: topImages } = await supabase
        .from('video_requests')
        .select(`
          image_id,
          character_images(image_url),
          characters(name),
          likes_count
        `)
        .order('likes_count', { ascending: false })
        .limit(10);

      const topRequestedImages = topImages?.map((img: any) => ({
        imageId: img.image_id,
        imageUrl: img.character_images?.image_url || '',
        characterName: img.characters?.name || 'Unknown',
        requestCount: 1,
        totalLikes: img.likes_count || 0,
      })) || [];

      // Get recent admin activity
      const { data: recentActivity } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const stats = {
        users: {
          totalUsers: totalUsers || 0,
          activeUsersToday: 0, // Would need session tracking
          activeUsersThisWeek: 0,
          activeUsersThisMonth: 0,
          newUsersToday: newUsersToday || 0,
          newUsersThisWeek: newUsersThisWeek || 0,
          newUsersThisMonth: newUsersThisMonth || 0,
        },
        characters: {
          totalCharacters: totalCharacters || 0,
          specialCharacters: specialCharacters || 0,
          regularCharacters: (totalCharacters || 0) - (specialCharacters || 0),
          galleryCharacters: galleryCharacters || 0,
          charactersCreatedToday: charactersCreatedToday || 0,
          charactersCreatedThisWeek: 0,
          charactersCreatedThisMonth: 0,
        },
        videos: videoStatsData,
        topRequestedImages,
        recentActivity: recentActivity?.map((log: any) => ({
          id: log.id,
          adminId: log.admin_id,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          details: log.details,
          createdAt: new Date(log.created_at),
        })) || [],
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return { success: false, error };
    }
  },

  async getAllUsers(opts?: { limit?: number; offset?: number; search?: string }) {
    try {
      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin.isAdmin) throw new Error('Unauthorized: Admin access required');

      const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 50)));
      const offset = Math.max(0, Number(opts?.offset ?? 0));

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (opts?.search) {
        query = query.or(`username.ilike.%${opts.search}%,full_name.ilike.%${opts.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        success: true,
        data: data?.map((p: any) => ({
          id: p.id,
          updated_at: p.updated_at,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          points_balance: p.points_balance,
          spin_pity_count: p.spin_pity_count,
          is_admin: p.is_admin,
        })) || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Failed to get users:', error);
      return { success: false, error };
    }
  },

  async updateUserAdminStatus(userId: string, isAdmin: boolean) {
    try {
      const adminCheck = await this.checkIsAdmin();
      if (!adminCheck.isAdmin) throw new Error('Unauthorized: Admin access required');

      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session?.user?.id,
        p_action: isAdmin ? 'grant_admin' : 'revoke_admin',
        p_target_type: 'user',
        p_target_id: userId,
        p_details: { new_status: isAdmin },
      });

      return { success: true, data };
    } catch (error) {
      console.error('Failed to update user admin status:', error);
      return { success: false, error };
    }
  },

  async createSpecialCharacter(draft: CharacterDraft) {
    try {
      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin.isAdmin) throw new Error('Unauthorized: Only admins can create special characters');

      const { data: { session } } = await supabase.auth.getSession();

      const serializedData = {
        ...draft,
        user_id: session?.user?.id,
        character_type: 'special',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('characters')
        .insert(serializedData)
        .select()
        .single();

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session?.user?.id,
        p_action: 'create_special_character',
        p_target_type: 'character',
        p_target_id: data.id,
        p_details: { name: draft.name },
      });

      return { success: true, data };
    } catch (error) {
      console.error('Failed to create special character:', error);
      return { success: false, error };
    }
  },

  async deleteUser(userId: string) {
    try {
      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin.isAdmin) throw new Error('Unauthorized: Admin access required');

      const { data: { session } } = await supabase.auth.getSession();

      // Delete user's characters and images first
      const { data: userCharacters } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', userId);

      for (const char of userCharacters || []) {
        await characterService.deleteCharacter(char.id);
      }

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Note: Actually deleting the auth user requires service role key
      // This would typically be done via a server-side API

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session?.user?.id,
        p_action: 'delete_user',
        p_target_type: 'user',
        p_target_id: userId,
        p_details: { characters_deleted: userCharacters?.length || 0 },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete user:', error);
      return { success: false, error };
    }
  },

  // Video Gallery API Functions
  async getVideos(options?: { limit?: number; offset?: number; orderBy?: string }): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { limit = 20, offset = 0, orderBy = 'created_at.desc' } = options || {};

      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          characters(name),
          character_images(image_url)
        `)
        .eq('status', 'active')
        .order(orderBy.split('.')[0], { ascending: orderBy.includes('asc') })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Map and enrich with user like status
      const videos = await Promise.all((data || []).map(async (video: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        let userHasLiked = false;
        
        if (session?.user) {
          const { data: likeData } = await supabase
            .from('video_likes')
            .select('id')
            .eq('video_id', video.id)
            .eq('user_id', session.user.id)
            .maybeSingle();
          userHasLiked = !!likeData;
        }

        return {
          id: video.id,
          title: video.title,
          description: video.description,
          videoUrl: video.video_url,
          thumbnailUrl: video.thumbnail_url,
          characterId: video.character_id,
          characterImageId: video.character_image_id,
          userId: video.user_id,
          duration: video.duration,
          width: video.width,
          height: video.height,
          fileSize: video.file_size,
          mimeType: video.mime_type,
          sourceType: video.source_type,
          sourceId: video.source_id,
          viewsCount: video.views_count || 0,
          likesCount: video.likes_count || 0,
          adminNotes: video.admin_notes,
          status: video.status,
          createdAt: new Date(video.created_at),
          updatedAt: new Date(video.updated_at),
          characterName: video.characters?.name,
          characterImageUrl: video.character_images?.image_url,
          userHasLiked,
        };
      }));

      return { success: true, data: videos };
    } catch (error) {
      console.error('Failed to get videos:', error);
      return { success: false, error };
    }
  },

  async createVideo(input: import('@/lib/types').CreateVideoInput): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: input.title,
          description: input.description,
          video_url: input.videoUrl,
          thumbnail_url: input.thumbnailUrl,
          character_id: input.characterId,
          character_image_id: input.characterImageId,
          source_type: input.sourceType || 'direct_import',
          source_id: input.sourceId,
          admin_notes: input.adminNotes,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session.user.id,
        p_action: 'create_video',
        p_target_type: 'video',
        p_target_id: data.id,
        p_details: { title: input.title, source_type: input.sourceType },
      });

      return { success: true, data };
    } catch (error) {
      console.error('Failed to create video:', error);
      return { success: false, error };
    }
  },

  async updateVideo(videoId: string, input: import('@/lib/types').UpdateVideoInput): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.videoUrl !== undefined) updateData.video_url = input.videoUrl;
      if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl;
      if (input.adminNotes !== undefined) updateData.admin_notes = input.adminNotes;
      if (input.status !== undefined) updateData.status = input.status;

      const { data, error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session.user.id,
        p_action: 'update_video',
        p_target_type: 'video',
        p_target_id: videoId,
        p_details: { updated_fields: Object.keys(updateData) },
      });

      return { success: true, data };
    } catch (error) {
      console.error('Failed to update video:', error);
      return { success: false, error };
    }
  },

  async deleteVideo(videoId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: session.user.id,
        p_action: 'delete_video',
        p_target_type: 'video',
        p_target_id: videoId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete video:', error);
      return { success: false, error };
    }
  },

  async likeVideo(videoId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_likes')
        .insert({ video_id: videoId, user_id: session.user.id });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to like video:', error);
      return { success: false, error };
    }
  },

  async unlikeVideo(videoId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to unlike video:', error);
      return { success: false, error };
    }
  },

  async incrementVideoViews(videoId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      // Silently fail - views are not critical
      return { success: false, error };
    }
  },
};


