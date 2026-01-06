'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, ClothingStyle, Environment, Conversation, CharacterStyle } from '@/lib/types';
import { CharacterGalleryComponent } from './CharacterGallery';
import { FormatSelector } from './ui/FormatSelector';
import { TTSButton } from './ui/TTSButton';
import { useRouter } from 'next/navigation';
import { characterAPI } from '@/lib/api';
import { automatic1111API, STYLE_TO_MODEL_MAP } from '@/lib/automatic1111';
import { lmStudioService } from '@/lib/lmstudio';
import { AspectRatioId } from '@/config/aspect-ratios';
import { useDialog } from '@/components/ui/DialogProvider';

interface ChatInterfaceProps {
  character: CharacterDraft;
  onBack: () => void;
  onCharacterUpdate?: (character: CharacterDraft) => void;
}

export interface ChatResponse {
  content: string;
  keywords: string[];
}

export function ChatInterface({ character, onBack, onCharacterUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<CharacterDraft>(character);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<AspectRatioId>('portrait');
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{messageId: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const router = useRouter();
  const dialog = useDialog();

  const findIntentMessageContent = (messageId: string): string | undefined => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx <= 0) return undefined;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]?.sender === 'user') return messages[i].content;
    }
    return undefined;
  };

  const shouldRunContextExtraction = (text: string): boolean => {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return false;

    // Only run the structured extractor when the user is likely asking for an outfit/location change.
    // Image generation planning is handled elsewhere.

    // More specific clothing detection to avoid false positives from pose descriptions
    const clothingKeywords = ['wear', 'outfit', 'dress', 'clothes', 'naked'];
    const actionKeywords = ['change into', 'put on', 'take off'];
    
    // Check if clothing keywords appear in a context suggesting clothing change
    const hasClothingContext = clothingKeywords.some(keyword => {
      const index = t.indexOf(keyword);
      if (index === -1) return false;
      
      // Check surrounding context for clothing-related words
      const before = t.substring(Math.max(0, index - 20), index);
      const after = t.substring(index + keyword.length, Math.min(t.length, index + keyword.length + 20));
      
      return before.includes('want') || before.includes('can you') || before.includes('please') || 
             before.includes('let\'s') || before.includes('lets') || before.includes('i want') ||
             after.includes('outfit') || after.includes('dress') || after.includes('clothes');
    });
    
    if (hasClothingContext) return true;
    if (actionKeywords.some(keyword => t.includes(keyword))) return true;

    if (t.includes('go to') || t.includes('location') || t.includes('environment')) return true;
    if (t.includes('let\'s go') || t.includes('lets go') || t.includes('take me to') || t.includes('move to')) return true;

    return false;
  };

  const applyDetectedClothing = async (clothingTags: string[]) => {
    console.log('[CLOTHING DETECT] tags:', clothingTags);
    const lower = clothingTags.map((t) => String(t || '').toLowerCase());
    const wantsNaked = lower.some((t) => t.includes('nude') || t.includes('naked') || t.includes('no clothes') || t.includes('completely exposed'));
    const wantsUnderwear = lower.some((t) => t.includes('underwear') || t.includes('bra and panties'));
    const wantsLingerie = lower.some((t) => t.includes('lingerie'));
    const wantsRevealing = lower.some((t) => t.includes('revealing'));

    const styleValues = Object.values(ClothingStyle) as string[];
    const explicitStyle = lower
      .map((t) => t.trim())
      .find((t) => styleValues.includes(t) && t !== ClothingStyle.CUSTOM);

    if (wantsNaked) {
      console.log('[CLOTHING DETECT] mapped style:', ClothingStyle.NAKED);
      if (currentCharacter.appearance?.clothing !== ClothingStyle.NAKED) {
        await handleOutfitChange(ClothingStyle.NAKED);
      }
      return;
    }

    if (wantsUnderwear) {
      console.log('[CLOTHING DETECT] mapped style:', ClothingStyle.UNDERWEAR);
      if (currentCharacter.appearance?.clothing !== ClothingStyle.UNDERWEAR) {
        await handleOutfitChange(ClothingStyle.UNDERWEAR);
      }
      return;
    }

    if (wantsLingerie) {
      console.log('[CLOTHING DETECT] mapped style:', ClothingStyle.LINGERIE);
      if (currentCharacter.appearance?.clothing !== ClothingStyle.LINGERIE) {
        await handleOutfitChange(ClothingStyle.LINGERIE);
      }
      return;
    }

    if (wantsRevealing) {
      console.log('[CLOTHING DETECT] mapped style:', ClothingStyle.REVEALING);
      if (currentCharacter.appearance?.clothing !== ClothingStyle.REVEALING) {
        await handleOutfitChange(ClothingStyle.REVEALING);
      }
      return;
    }

    if (explicitStyle) {
      console.log('[CLOTHING DETECT] mapped style:', explicitStyle);
      if (currentCharacter.appearance?.clothing !== (explicitStyle as ClothingStyle)) {
        await handleOutfitChange(explicitStyle as ClothingStyle);
      }
      return;
    }

    const clothingDescription = clothingTags.join(', ');
    console.log('[CLOTHING DETECT] mapped style:', ClothingStyle.CUSTOM, 'custom:', clothingDescription);
    if (
      currentCharacter.appearance?.clothing !== ClothingStyle.CUSTOM ||
      (currentCharacter.appearance?.customClothing || '') !== clothingDescription
    ) {
      await handleCustomClothing(clothingDescription);
    }
  };

  const getImagePlanContextForMessage = (messageId: string, messageContent: string): ChatMessage[] => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    const targetMessage = messageIndex >= 0 ? messages[messageIndex] : null;

    let previousUserMessage: ChatMessage | null = null;
    if (messageIndex > 0) {
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i]?.sender === 'user') {
          previousUserMessage = messages[i];
          break;
        }
      }
    }

    const context: ChatMessage[] = [];
    if (previousUserMessage) context.push(previousUserMessage);
    if (targetMessage) {
      context.push(targetMessage);
      return context;
    }

    context.push({
      id: `temp-image-plan-${Date.now()}`,
      conversationId: conversation?.id || 'temp',
      characterId: currentCharacter.id || 'temp',
      content: messageContent,
      sender: 'character',
      timestamp: new Date()
    } as any);

    return context;
  };

  const detectAndApplyClothingFromContext = async (chatContext: ChatMessage[]) => {
    try {
      const plan = await lmStudioService.generateImagePlan(chatContext, currentCharacter);
      const clothing = Array.isArray(plan?.clothing) ? plan.clothing : [];
      console.log('[CLOTHING DETECT] plan clothing:', clothing);
      if (clothing.length > 0) {
        await applyDetectedClothing(clothing);
      }
    } catch (e) {
      console.warn('[CLOTHING DETECT] image plan extraction failed');
    }
  };

  const extractDialogueText = (content: string): string => {
    // Split by thinking patterns and filter out thinking parts
    const parts = content.split(/(\*[^*]+\*)/);
    return parts
      .filter(part => !(part.startsWith('*') && part.endsWith('*'))) // Remove thinking parts
      .join('') // Join remaining parts
      .trim(); // Clean up whitespace
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLargeScreen(mql.matches);
    update();

    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }

    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  // Close format selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormatSelector) {
        setShowFormatSelector(false);
        setPendingGeneration(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFormatSelector]);

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const initChat = async () => {
    if (currentCharacter.id) {
      try {
        const convResult = await characterAPI.getConversation(currentCharacter.id);
        if (convResult.success && convResult.data) {
          setConversation(convResult.data);
          const messagesResult = await characterAPI.getMessages(convResult.data.id);
          if (messagesResult.success && messagesResult.data) {
            setMessages(messagesResult.data.map((m: any) => ({
              ...m,
              imageUrl: m.image_url,
              timestamp: new Date(m.timestamp)
            })));
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    initChat();
  }, [currentCharacter.id]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return;

    const userMessageContent = inputMessage;
    setInputMessage('');

    const userMsg: Partial<ChatMessage> = {
      conversationId: conversation.id,
      characterId: currentCharacter.id,
      content: userMessageContent,
      sender: 'user',
    };

    // Optimistic update
    const tempId = Date.now().toString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      ...userMsg as any,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    setIsTyping(true);

    try {
      // Save user message first to get real ID
      const savedUserMsg = await characterAPI.saveMessage(userMsg);
      
      // Get LLM response using either saved message or fallback to optimistic
      const messageForContext = savedUserMsg.success ? savedUserMsg.data : optimisticMsg;
      const chatContext = [...messages, messageForContext];
      const llmResponse = await lmStudioService.sendMessage(chatContext, currentCharacter);

      const characterMsg: Partial<ChatMessage> = {
        conversationId: conversation.id,
        characterId: currentCharacter.id,
        content: llmResponse.content,
        sender: 'character',
      };

      // Save character message
      const savedCharMsg = await characterAPI.saveMessage(characterMsg);

      // Update messages state with both saved messages
      setMessages(prev => {
        let updatedMessages = [...prev];
        
        // Replace temporary user message with saved one
        if (savedUserMsg.success) {
          updatedMessages = updatedMessages.map(m => 
            m.id === tempId ? {
              ...savedUserMsg.data,
              timestamp: new Date(savedUserMsg.data.timestamp)
            } : m
          );
        }
        
        // Add saved character message
        if (savedCharMsg.success) {
          const characterMessageData = {
            ...savedCharMsg.data,
            timestamp: new Date(savedCharMsg.data.timestamp)
          };
          updatedMessages.push(characterMessageData);
        }
        
        return updatedMessages;
      });

      // Check for clothing changes using LM Studio structured extraction
      const lastContext = [...messages, messageForContext].slice(-10);
      const effectiveContext: ChatMessage[] = savedCharMsg.success
        ? [...lastContext, { ...(savedCharMsg.data as any), timestamp: new Date(savedCharMsg.data.timestamp) }]
        : lastContext;
      if (shouldRunContextExtraction(userMessageContent)) {
        await detectAndApplyClothingFromContext(effectiveContext);
      }

      // Handle keywords/triggers from user message (not character response)
      const userKeywords = lmStudioService.extractKeywords(userMessageContent);
      if (userKeywords.length > 0) {
        for (const keyword of userKeywords) {
          if (keyword.startsWith('style:')) {
            const style = keyword.split(':')[1] as ClothingStyle;
            if (style !== currentCharacter.appearance?.clothing) {
              await handleOutfitChange(style);
            }
          } else if (keyword.startsWith('env:')) {
            const env = keyword.split(':')[1] as Environment;
            if (env !== currentCharacter.appearance?.environment) {
              await handleEnvironmentChange(env);
            }
          } else if (keyword.startsWith('custom:')) {
            const clothingDescription = keyword.split(':')[1];
            await handleCustomClothing(clothingDescription);
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        conversationId: conversation.id,
        characterId: currentCharacter.id || 'temp',
        content: "*Connection lost. Please make sure LM Studio is running.*",
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = async () => {
    if (!conversation) return;

    const ok = await dialog.confirm({
      title: 'Reset chat?',
      message: 'Are you sure you want to reset the chat history? This cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    const result = await characterAPI.resetConversation(conversation.id);
    if (result.success) {
      setMessages([]);
      setConversation(null);
      await initChat();
    }
  };

  const handleGenerateMessageImage = async (messageId: string, content: string) => {
    // Show format selector dropdown next to the button
    setPendingGeneration({ messageId, content });
    setShowFormatSelector(true);
  };

  const handleRegenerateMessageImage = async (messageId: string, content: string) => {
    // Clear current image and show loading
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, imageUrl: undefined, isGeneratingImage: true } : m));

    try {
      let imagePlan;
      try {
        const chatContext = getImagePlanContextForMessage(messageId, content);
        imagePlan = await lmStudioService.generateImagePlan(chatContext, currentCharacter);
        console.log('[IMAGE PLAN] generated:', imagePlan);
      } catch (e) {
        console.warn('[IMAGE PLAN] generation failed, falling back to keyword extraction');
      }

      const intentMessageContent = findIntentMessageContent(messageId);
      const imageUrl = await automatic1111API.generateMessageImage(
        currentCharacter,
        content,
        selectedFormat,
        imagePlan,
        intentMessageContent,
        messageId
      );
      
      if (imageUrl && imageUrl.length > 0) {
        if (isMountedRef.current) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, imageUrl, isGeneratingImage: false } : m));
        }
      } else {
        console.error('No image URL returned from generation');
        if (isMountedRef.current) {
          await dialog.alert({
            title: 'Error',
            message: 'No image was generated. Please check the console for errors.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate message image:', error);
      if (isMountedRef.current) {
        await dialog.alert({
          title: 'Error',
          message: 'Failed to generate image: ' + (error instanceof Error ? error.message : 'Unknown error'),
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
      }
    }
  };

  const handleFormatSelectAndGenerate = async (format: AspectRatioId) => {
    if (!pendingGeneration) return;

    setSelectedFormat(format);
    setShowFormatSelector(false);

    const { messageId, content } = pendingGeneration;
    setPendingGeneration(null);

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: true } : m));

    try {
      let imagePlan;
      try {
        const chatContext = getImagePlanContextForMessage(messageId, content);
        imagePlan = await lmStudioService.generateImagePlan(chatContext, currentCharacter);
        console.log('[IMAGE PLAN] generated:', imagePlan);
      } catch (e) {
        console.warn('[IMAGE PLAN] generation failed, falling back to keyword extraction');
      }

      const intentMessageContent = findIntentMessageContent(messageId);
      const imageUrl = await automatic1111API.generateMessageImage(
        currentCharacter,
        content,
        format,
        imagePlan,
        intentMessageContent,
        messageId
      );
      
      if (imageUrl && imageUrl.length > 0) {
        if (isMountedRef.current) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, imageUrl, isGeneratingImage: false } : m));
        }
      } else {
        console.error('No image URL returned from generation');
        if (isMountedRef.current) {
          await dialog.alert({
            title: 'Error',
            message: 'No image was generated. Please check the console for errors.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate message image:', error);
      if (isMountedRef.current) {
        await dialog.alert({
          title: 'Error',
          message: 'Failed to generate image: ' + (error instanceof Error ? error.message : 'Unknown error'),
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
      }
    }
  };

  const handleDeleteMessage = async (messageId: string): Promise<boolean> => {
    const ok = await dialog.confirm({
      title: 'Delete message?',
      message: 'Are you sure you want to delete this message? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return false;
    
    console.log('🗑️ Attempting to delete message:', messageId);
    
    try {
      const result = await characterAPI.deleteMessage(messageId);
      console.log('📊 Delete result:', result);
      
      if (result.success) {
        console.log('✅ Message deleted from Supabase, removing from UI');
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        // Check immediately if message is gone
        setTimeout(() => {
          if (conversation) {
            console.log('🔍 Checking if message is immediately gone...');
            characterAPI.getMessages(conversation.id).then(messagesResult => {
              if (messagesResult.success && messagesResult.data) {
                const deletedMessage = messagesResult.data.find((m: any) => m.id === messageId);
                console.log('📋 Message still exists immediately after delete?', deletedMessage);
                
                // Check again after 2 seconds
                setTimeout(() => {
                  console.log('🔍 Checking again after 2 seconds...');
                  characterAPI.getMessages(conversation.id).then(messagesResult2 => {
                    if (messagesResult2.success && messagesResult2.data) {
                      const deletedMessage2 = messagesResult2.data.find((m: any) => m.id === messageId);
                      console.log('📋 Message exists after 2 seconds?', deletedMessage2);
                      
                      // Update UI with current state
                      setMessages(messagesResult2.data.map((m: any) => ({
                        ...m,
                        imageUrl: m.image_url,
                        timestamp: new Date(m.timestamp)
                      })));
                    }
                  });
                }, 2000);
              }
            });
          }
        }, 500); // Wait 500ms then check

        return true;
      } else {
        console.error('❌ Failed to delete message:', result.error);
        await dialog.alert({
          title: 'Error',
          message: 'Failed to delete message: ' + String(result.error),
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Exception during delete:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to delete message: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
      return false;
    }
  };

  const handleRegenerateCharacterMessage = async (messageId: string, oldContent: string) => {
    // Get the previous user message for context
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const previousMessages = messages.slice(0, messageIndex);
    const lastUserMessage = previousMessages.reverse().find(m => m.sender === 'user');
    
    if (!lastUserMessage) {
      await dialog.alert({
        title: 'Error',
        message: 'Cannot regenerate - no user message found for context',
      });
      return;
    }

    try {
      // Delete the old message
      const deleted = await handleDeleteMessage(messageId);
      if (!deleted) return;
      
      // Generate a new response
      setIsTyping(true);
      const chatContext = [...previousMessages.filter(m => m.id !== messageId), lastUserMessage];
      const llmResponse = await lmStudioService.sendMessage(chatContext, currentCharacter);

      const characterMsg: Partial<ChatMessage> = {
        conversationId: conversation?.id || 'temp',
        characterId: currentCharacter.id || 'temp',
        content: llmResponse.content,
        sender: 'character',
      };

      // Save new character message
      const savedMsg = await characterAPI.saveMessage(characterMsg);
      if (savedMsg.success) {
        setMessages(prev => [...prev, {
          ...savedMsg.data,
          timestamp: new Date(savedMsg.data.timestamp)
        }]);
      }
    } catch (error) {
      console.error('Failed to regenerate message:', error);
      await dialog.alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to regenerate message',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleCharacterUpdate = (updatedCharacter: CharacterDraft) => {
    setCurrentCharacter(updatedCharacter);
    onCharacterUpdate?.(updatedCharacter);
  };

  const handleOutfitChange = async (clothing: ClothingStyle) => {
    // Update character's clothing
    const updatedCharacter = {
      ...currentCharacter,
      appearance: {
        ...currentCharacter.appearance,
        clothing: clothing
      }
    };

    setCurrentCharacter(updatedCharacter);
    setShowWardrobe(false);

    // Save to database using direct update
    if (currentCharacter.id) {
      try {
        const result = await characterAPI.updateCharacterDirect(currentCharacter.id, {
          clothing: clothing
        });

        if (!result.success) {
          console.error('Failed to save outfit to database:', result.error);
        } else {
          // Refresh character data from database to clear any cache
          const refreshedCharacter = await characterAPI.getCharacterFresh(currentCharacter.id);
          if (refreshedCharacter.success && refreshedCharacter.data) {
            setCurrentCharacter(refreshedCharacter.data);
            // Update parent component state
            onCharacterUpdate?.(refreshedCharacter.data);
          }
        }
      } catch (error) {
        console.error('Failed to save outfit to database:', error);
      }
    }

    // Add a message about the outfit change
    const outfitMessage: Partial<ChatMessage> = {
      conversationId: conversation?.id || 'temp',
      characterId: currentCharacter.id || 'temp',
      content: `*${currentCharacter.name || 'The character'} changes into a ${clothing} outfit*`,
      sender: 'character',
    };

    const savedMsg = await characterAPI.saveMessage(outfitMessage);
    if (savedMsg.success) {
      setMessages(prev => [...prev, {
        ...savedMsg.data,
        timestamp: new Date(savedMsg.data.timestamp)
      }]);
    }
  };

  const handleCustomClothing = async (customOutfit: string) => {
    // Update character's clothing with custom outfit
    const updatedCharacter = {
      ...currentCharacter,
      appearance: {
        ...currentCharacter.appearance,
        clothing: ClothingStyle.CUSTOM,
        customClothing: customOutfit
      }
    };

    setCurrentCharacter(updatedCharacter);
    setShowWardrobe(false);

    // Save to database using direct update
    if (currentCharacter.id) {
      try {
        const result = await characterAPI.updateCharacterDirect(currentCharacter.id, {
          clothing: ClothingStyle.CUSTOM,
          custom_clothing: customOutfit
        });

        if (!result.success) {
          console.error('Failed to save custom outfit to database:', result.error);
        } else {
          // Refresh to ensure sync
          const refreshedCharacter = await characterAPI.getCharacterFresh(currentCharacter.id);
          if (refreshedCharacter.success && refreshedCharacter.data) {
            setCurrentCharacter(refreshedCharacter.data);
            onCharacterUpdate?.(refreshedCharacter.data);
          }
        }
      } catch (error) {
        console.error('Failed to save custom outfit to database:', error);
      }
    }

    // Add a message about the custom outfit change
    const outfitMessage: Partial<ChatMessage> = {
      conversationId: conversation?.id || 'temp',
      characterId: currentCharacter.id || 'temp',
      content: `*${currentCharacter.name || 'The character'} changes into a custom outfit: ${customOutfit}*`,
      sender: 'character',
    };

    const savedMsg = await characterAPI.saveMessage(outfitMessage);
    if (savedMsg.success) {
      setMessages(prev => [...prev, {
        ...savedMsg.data,
        timestamp: new Date(savedMsg.data.timestamp)
      }]);
    }
  };

  const handleWardrobeImageGeneration = async () => {
    if (!currentCharacter.id) return;

    try {
      setIsTyping(true);
      setShowWardrobe(false);

      // Generate new image with current clothing (including NSFW options)
      const imageUrl = await automatic1111API.generateCharacterImage(currentCharacter);

      if (imageUrl) {
        const generationMessage: Partial<ChatMessage> = {
          conversationId: conversation?.id || 'temp',
          characterId: currentCharacter.id || 'temp',
          content: `*New image generated with ${currentCharacter.appearance?.clothing || 'current'} outfit*`,
          sender: 'character',
        };

        const savedMsg = await characterAPI.saveMessage(generationMessage);
        if (savedMsg.success) {
          setMessages(prev => [...prev, {
            ...savedMsg.data,
            timestamp: new Date(savedMsg.data.timestamp)
          }]);
        }
      }
    } catch (error) {
      console.error('Error generating wardrobe image:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: conversation?.id || 'temp',
        characterId: currentCharacter.id || 'temp',
        content: '*Failed to generate new image. Please try again.*',
        sender: 'character',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEnvironmentChange = async (environment: Environment) => {
    // Update character's environment
    const updatedCharacter = {
      ...currentCharacter,
      appearance: {
        ...currentCharacter.appearance,
        environment: environment
      }
    };

    setCurrentCharacter(updatedCharacter);
    setShowEnvironment(false);

    // Save to database using direct update
    if (currentCharacter.id) {
      try {
        const result = await characterAPI.updateCharacterDirect(currentCharacter.id, {
          environment: environment
        });

        if (!result.success) {
          console.error('Failed to save environment to database:', result.error);
        } else {
          // Refresh character data from database to clear any cache
          const refreshedCharacter = await characterAPI.getCharacterFresh(currentCharacter.id);
          if (refreshedCharacter.success && refreshedCharacter.data) {
            setCurrentCharacter(refreshedCharacter.data);
            // Update parent component state
            onCharacterUpdate?.(refreshedCharacter.data);
          }
        }
      } catch (error) {
        console.error('Failed to save environment to database:', error);
      }
    }

    // Add a message about the environment change
    const environmentMessage: Partial<ChatMessage> = {
      conversationId: conversation?.id || 'temp',
      characterId: currentCharacter.id || 'temp',
      content: `*The scene changes to a ${environment.replace('_', ' ')}*`,
      sender: 'character',
    };

    const savedMsg = await characterAPI.saveMessage(environmentMessage);
    if (savedMsg.success) {
      setMessages(prev => [...prev, {
        ...savedMsg.data,
        timestamp: new Date(savedMsg.data.timestamp)
      }]);
    }
  };

  const generateCharacterResponse = (userMessage: string, character: CharacterDraft): string => {
    const personality = character.personality;
    const traits = personality.traits;

    // Simple response generation based on personality traits
    const responses = [
      "That's interesting! Tell me more about that.",
      "I see what you mean. From my perspective...",
      "Hmm, let me think about that for a moment.",
      "That reminds me of something I experienced recently.",
      "I'd love to hear your thoughts on this too!",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <>
      {showGallery ? (
        <CharacterGalleryComponent
          character={currentCharacter}
          onBack={() => setShowGallery(false)}
          onCharacterUpdate={handleCharacterUpdate}
        />
      ) : (
        <div className="flex h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
          {/* Static Character Image - Full Right Side */}
          <AnimatePresence>
            {isLargeScreen && currentCharacter.generation?.generatedImage && (
              <motion.div
                key="static-character-image"
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute right-0 top-0 z-10 w-[450px] h-full"
              >
                <div className="relative group h-full p-4">
                  <div className="relative h-full overflow-hidden rounded-3xl border-2 border-pink-500/20 shadow-2xl shadow-pink-500/10">
                    <img
                      src={currentCharacter.generation.generatedImage}
                      alt="Generated Character"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-4 right-4">
                      <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
                        <p className="text-white text-lg font-medium">
                          {currentCharacter.name || 'Unnamed Character'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area - Left Side Only */}
          <div
            className={`flex-1 flex flex-col bg-gradient-to-b from-dark-900/30 to-dark-800/30 mt-0 transition-[margin] duration-500 ease-in-out ${
              isLargeScreen ? 'mr-[450px]' : 'mr-0'
            }`}
          >
            {/* Chat Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-dark-700/50 backdrop-blur-sm">
              <div className="flex items-center">
                <button
                  onClick={onBack}
                  className="flex items-center text-pink-300 hover:text-pink-200 transition-colors group"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium">Back to Selection</span>
                </button>

                {/* Character Name - Center */}
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center space-x-3">
                    {/* Character Info */}
                    <div className="flex flex-col items-center">
                      <h1 className="text-xl font-semibold text-white">{currentCharacter.name || 'Character'}</h1>
                      <div className="text-sm text-pink-400 capitalize">
                        {currentCharacter.stylePreset || 'Human'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button - Right */}
                <button
                  onClick={handleResetChat}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200"
                  title="Reset History"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area - Scrollable Only */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-5 py-3 rounded-2xl relative group/msg ${message.sender === 'user'
                            ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/20'
                            : 'bg-dark-800/50 text-dark-200 border border-dark-700/50 backdrop-blur-sm'
                            }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {/* Message Content */}
                            {message.content.split(/(\*[^*]+\*)/).map((part, index) => {
                              // Check if this part is enclosed in asterisks (internal thought)
                              if (part.startsWith('*') && part.endsWith('*')) {
                                const thoughtContent = part.slice(1, -1); // Remove asterisks
                                return <span key={index} className="italic text-pink-300 opacity-80">{thoughtContent}</span>;
                              } else {
                                return <span key={index}>{part}</span>;
                              }
                            })}
                            
                            {/* Message Controls - Inline with content */}
                            <span className={`inline-flex ${message.sender === 'user' ? 'float-left mr-2' : 'float-right ml-2'} opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                              {extractDialogueText(message.content) && (
                                <TTSButton
                                  text={extractDialogueText(message.content)}
                                  className="p-0.5 mr-1 text-pink-400/60 hover:text-pink-300 hover:bg-pink-500/10 rounded transition-all"
                                  title="Generate voice"
                                />
                              )}
                              {/* Regenerate Message */}
                              {message.sender === 'character' && (
                                <button
                                  onClick={() => handleRegenerateCharacterMessage(message.id, message.content)}
                                  className="p-0.5 text-pink-400/60 hover:text-pink-300 hover:bg-pink-500/10 rounded transition-all"
                                  title="Regenerate message"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              )}
                              
                              {/* Delete Message */}
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className={`p-0.5 text-red-400/60 hover:text-red-300 hover:bg-red-500/10 rounded transition-all ${message.sender === 'character' ? 'ml-1' : ''}`}
                                title="Delete message"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </span>
                          </div>

                          {/* Generate Image Button for Character Messages */}
                          {message.sender === 'character' && !message.imageUrl && !message.isGeneratingImage && (
                            <div className="absolute -right-8 sm:-right-10 md:-right-12 top-0 flex items-center">
                              <button
                                onClick={() => handleGenerateMessageImage(message.id, message.content)}
                                className="p-2 text-pink-400 hover:text-pink-300 opacity-0 group-hover/msg:opacity-100 transition-opacity bg-dark-800/80 rounded-lg backdrop-blur-sm border border-pink-500/20 shadow-xl"
                                title="Generate image"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>

                              {/* Format Dropdown */}
                              {showFormatSelector && pendingGeneration?.messageId === message.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute left-full ml-2 top-0 bg-dark-800/95 border border-pink-500/30 rounded-lg shadow-xl backdrop-blur-sm z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center p-2 space-x-3">
                                    {[
                                      { id: 'square' as AspectRatioId, label: 'Square', ratio: '1:1' },
                                      { id: 'landscape' as AspectRatioId, label: 'Landscape', ratio: '4:3' },
                                      { id: 'portrait' as AspectRatioId, label: 'Portrait', ratio: '3:4' },
                                    ].map((format) => (
                                      <button
                                        key={format.id}
                                        onClick={() => handleFormatSelectAndGenerate(format.id)}
                                        className="flex flex-col items-center px-2 py-1 hover:bg-pink-600/20 rounded transition-colors group"
                                      >
                                        <div className="w-4 h-4 bg-pink-600/20 rounded mb-1 flex items-center justify-center">
                                          <div className="w-2 h-2 bg-pink-300 rounded-sm" />
                                        </div>
                                        <span className="text-xs text-pink-300 group-hover:text-white">
                                          {format.label}
                                        </span>
                                        <span className="text-[10px] text-pink-400 group-hover:text-pink-200">
                                          {format.ratio}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Generated Image Below Message */}
                        {(message.imageUrl || message.isGeneratingImage) && (
                          <div className="mt-2 relative rounded-xl overflow-hidden border border-pink-500/30 shadow-lg shadow-pink-500/10 max-w-[200px] group/img">
                            {message.isGeneratingImage ? (
                              <div className="aspect-[3/4] bg-dark-800/80 flex flex-col items-center justify-center space-y-3">
                                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] text-pink-300 animate-pulse">Generating...</p>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={message.imageUrl}
                                  alt="Scene"
                                  className="w-full h-auto object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                  onClick={() => {
                                    setZoomedImageUrl(message.imageUrl!);
                                    setIsZoomed(true);
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load message image:', message.imageUrl);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                  onLoad={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'block';
                                  }}
                                />
                                {/* Regenerate Button */}
                                <button
                                  onClick={() => handleRegenerateMessageImage(message.id, message.content)}
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:text-pink-400"
                                  title="Regenerate image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        <div className={`mt-1 text-xs text-pink-300 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-dark-800/50 text-dark-200 px-5 py-3 rounded-2xl border border-pink-500/30 backdrop-blur-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 lg:p-6 border-t border-dark-700/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                {/* Buttons Above Input */}
                <div className="flex items-center justify-center space-x-3 mb-3">
                  {/* Gallery Button */}
                  <button
                    onClick={() => setShowGallery(true)}
                    className="w-10 h-10 bg-dark-700/50 text-pink-300 rounded-xl border border-pink-500/30 hover:bg-pink-600/20 transition-all duration-200 flex items-center justify-center"
                    title="View Gallery"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Wardrobe Button */}
                  <button
                    onClick={() => setShowWardrobe(true)}
                    className="w-10 h-10 bg-dark-700/50 text-pink-300 rounded-xl border border-pink-500/30 hover:bg-pink-600/20 transition-all duration-200 flex items-center justify-center"
                    title="Change Outfit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>

                  {/* Environment Button */}
                  <button
                    onClick={() => setShowEnvironment(true)}
                    className="w-10 h-10 bg-dark-700/50 text-green-300 rounded-xl border border-green-500/30 hover:bg-green-600/20 transition-all duration-200 flex items-center justify-center"
                    title="Change Location"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Input with Send Button */}
                <div className="relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="w-full px-5 py-3 pr-16 bg-dark-800/50 text-dark-200 rounded-2xl border border-pink-500/50 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 backdrop-blur-sm placeholder-pink-400"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 px-3 py-1.5 flex items-center justify-center font-medium text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wardrobe Modal */}
      <AnimatePresence>
        {showWardrobe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWardrobe(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600 rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-pink-300 mb-2">Wardrobe</h2>
                  <p className="text-pink-400">Choose the perfect outfit for your character</p>
                </div>
                <button
                  onClick={() => setShowWardrobe(false)}
                  className="w-10 h-10 flex items-center justify-center text-pink-400 hover:text-white hover:bg-pink-600 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current Outfit Display */}
              <div className="mb-8 p-4 bg-dark-700/30 rounded-2xl border border-pink-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pink-500/10 rounded-xl">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-pink-400 mb-1">Current Outfit</h3>
                    <div className="text-lg text-white font-medium">
                      {currentCharacter.appearance?.clothing === ClothingStyle.CUSTOM ? (
                        <div className="flex flex-col">
                          <span className="text-green-400">Custom Outfit</span>
                          <span className="text-sm text-dark-300 font-normal mt-1 italic">
                            "{currentCharacter.appearance?.customClothing || 'No description provided'}"
                          </span>
                        </div>
                      ) : (
                        <span className="capitalize">{currentCharacter.appearance?.clothing || 'Default'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regular Outfits Section */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-pink-300">Regular Outfits</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[ 
                    { id: 'casual', label: 'Casual', image: '/images/velora.png', description: 'Relaxed everyday style - comfortable and approachable look' },
                    { id: 'formal', label: 'Formal', image: '/images/velora.png', description: 'Classic evening elegance - refined and sophisticated outfit' },
                    { id: 'sporty', label: 'Sporty', image: '/images/velora.png', description: 'Active and energetic - athletic vibe with practical details' },
                    { id: 'elegant', label: 'Elegant', image: '/images/velora.png', description: 'Timeless sophistication - graceful, polished appearance' },
                    { id: 'cute', label: 'Cute', image: '/images/velora.png', description: 'Adorable and sweet - charming and playful look' },
                    { id: 'edgy', label: 'Edgy', image: '/images/velora.png', description: 'Bold modern style - confident attitude with striking accents' },
                    { id: 'traditional', label: 'Traditional', image: '/images/velora.png', description: 'Cultural elegance - rich patterns and traditional details' },
                    { id: 'fantasy', label: 'Fantasy', image: '/images/velora.png', description: 'Magical and dreamy - enchanting fairytale outfit' }
                  ].map((outfit) => (
                    <motion.button
                      key={outfit.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOutfitChange(outfit.id as ClothingStyle)}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${currentCharacter.appearance?.clothing === outfit.id
                        ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/30'
                        : 'border-dark-600 bg-dark-700/50 hover:border-pink-500/50 hover:bg-pink-500/10'
                        }`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-dark-600 to-dark-700 relative">
                        <img
                          src={outfit.image}
                          alt={outfit.label}
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/50">
                          <span className="text-white text-sm font-medium">Select</span>
                        </div>
                        {/* Fallback placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                          <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-white font-medium mb-1">{outfit.label}</h4>
                        <p className="text-dark-400 text-xs line-clamp-2">{outfit.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* NSFW Outfits Section */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-pink-300">Adult Outfits</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'lingerie', label: 'Lingerie', image: '/images/velora.png', description: 'Intimate apparel - delicate lace lingerie set for romantic moments' },
                    { id: 'naked', label: 'Naked', image: '/images/velora.png', description: 'Natural beauty - completely nude, embracing natural form' },
                    { id: 'bikini', label: 'Bikini', image: '/images/velora.png', description: 'Beach ready - revealing bikini perfect for sunny days' },
                    { id: 'underwear', label: 'Underwear', image: '/images/velora.png', description: 'Intimate wear - sexy underwear set for private moments' },
                    { id: 'revealing', label: 'Revealing', image: '/images/velora.png', description: 'Bold style - daring outfit that shows more skin' },
                    { id: 'bodysuit', label: 'Bodysuit', image: '/images/velora.png', description: 'Form fitting - tight bodysuit that accentuates curves' },
                    { id: 'crotchless', label: 'Crotchless Panties', image: '/images/velora.png', description: 'Extremely explicit - sheer lace panties with fully open crotch, designed for instant access and maximum exposure' },
                    { id: 'nipple-pasties', label: 'Nipple Pasties', image: '/images/velora.png', description: 'tiny pasties over nipples, completely topless otherwise with thong or nothing below for ultimate tease, sheer lace panties' }
                  ].map((outfit) => (
                    <motion.button
                      key={outfit.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOutfitChange(outfit.id as ClothingStyle)}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${currentCharacter.appearance?.clothing === outfit.id
                        ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/30'
                        : 'border-dark-600 bg-dark-700/50 hover:border-pink-500/50 hover:bg-pink-500/10'
                        }`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-dark-600 to-dark-700 relative">
                        <img
                          src={outfit.image}
                          alt={outfit.label}
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/50">
                          <span className="text-white text-sm font-medium">Select</span>
                        </div>
                        {/* Fallback placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                          <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-white font-medium mb-1">{outfit.label}</h4>
                        <p className="text-dark-400 text-xs line-clamp-2">{outfit.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Outfit Section */}
              <div className="border-t border-dark-700 pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-pink-300">Custom Outfit</h3>
                </div>
                <div className="bg-dark-700/30 rounded-2xl p-4 border border-dark-600">
                  <p className="text-pink-400 text-sm mb-3">Describe your custom outfit in detail:</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="e.g., Victorian gothic dress with lace trim and corset..."
                        className="flex-1 px-4 py-3 bg-dark-800/50 text-white rounded-xl border border-pink-500/50 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 placeholder-pink-400"
                        id="customOutfitInput"
                        defaultValue={currentCharacter.appearance?.customClothing || ''}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const input = document.getElementById('customOutfitInput') as HTMLInputElement;
                          const customOutfit = input.value.trim();
                          if (customOutfit) {
                            handleCustomClothing(customOutfit);
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg shadow-green-500/20 font-medium"
                      >
                        Apply
                      </motion.button>
                    </div>

                    {currentCharacter.appearance?.customClothing && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-dark-400 text-sm">Last used:</span>
                        <button
                          onClick={() => handleCustomClothing(currentCharacter.appearance.customClothing!)}
                          className="text-left text-sm text-green-400 hover:text-green-300 hover:underline truncate max-w-xl"
                        >
                          "{currentCharacter.appearance.customClothing}"
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environment Modal */}
      <AnimatePresence>
        {showEnvironment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEnvironment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Location</h2>
                <button
                  onClick={() => setShowEnvironment(false)}
                  className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.values(Environment).map((env) => (
                  <button
                    key={env}
                    onClick={() => handleEnvironmentChange(env)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${currentCharacter.appearance?.environment === env
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-dark-600 bg-dark-700/50 text-dark-200 hover:border-green-500/50 hover:bg-green-500/10'
                      }`}
                  >
                    <div className="text-sm font-medium capitalize mb-1">
                      {env.replace('_', ' ')}
                    </div>
                    <div className="text-xs opacity-75">
                      {currentCharacter.appearance?.environment === env ? 'Current' : 'Select'}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && zoomedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImageUrl}
                alt="Zoomed"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-8 right-8 p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
