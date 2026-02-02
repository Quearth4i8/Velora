'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, ClothingStyle, Environment, Conversation, CharacterStyle } from '@/lib/types';
import { CharacterGalleryComponent } from './CharacterGallery';
import { FormatSelector } from './ui/FormatSelector';
import { HeatMeter } from './ui/HeatMeter';
import { TTSButton } from './ui/TTSButton';
import { useRouter } from 'next/navigation';
import { characterAPI } from '@/lib/api';
import { automatic1111API, STYLE_TO_MODEL_MAP } from '@/lib/automatic1111';
import { lmStudioService } from '@/lib/lmstudio';
import { AspectRatioId } from '@/config/aspect-ratios';
import { useDialog } from '@/components/ui/DialogProvider';
import type { EncounterSessionConfig } from '@/lib/encounters';
import { getEncounterScenarioById } from '@/data/encounters';
import { buildEncounterSystemPromptAddon } from '@/lib/encounterPrompt';
import { bondService } from '@/lib/bondService';
import { buildBondSystemPromptAddon, getBondState } from '@/lib/bond';
import { normalizeA1111ColorName } from '@/config/color-mappings';

interface ChatInterfaceProps {
  character: CharacterDraft;
  onBack: () => void;
  onCharacterUpdate?: (character: CharacterDraft) => void;
  mode?: 'normal' | 'encounter';
  encounterConfig?: (Omit<EncounterSessionConfig, 'characterId'> & { conversationId?: string });
}

export interface ChatResponse {
  content: string;
  keywords: string[];
}

export function ChatInterface({ character, onBack, onCharacterUpdate, mode = 'normal', encounterConfig }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<CharacterDraft>(character);
  const chatMode: 'normal' | 'encounter' = mode;
  const isEncounter = chatMode === 'encounter';
  const [wardrobeTab, setWardrobeTab] = useState<'regular' | 'adult' | 'custom'>('regular');
  const [wardrobeSearch, setWardrobeSearch] = useState('');
  const [pendingWardrobeClothing, setPendingWardrobeClothing] = useState<ClothingStyle | null>(
    (character?.appearance?.clothing as ClothingStyle) || null
  );
  const [pendingWardrobeCustomClothing, setPendingWardrobeCustomClothing] = useState<string>(
    character?.appearance?.customClothing || ''
  );
  const [wardrobeOutfitColors, setWardrobeOutfitColors] = useState<Record<string, string>>({});
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [blurImages, setBlurImages] = useState(false);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [activeMessageContent, setActiveMessageContent] = useState<string>('');
  const [activeMessageImages, setActiveMessageImages] = useState<string[]>([]);
  const [activeMessageImageIndex, setActiveMessageImageIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<AspectRatioId>('portrait');
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{messageId: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const router = useRouter();
  const dialog = useDialog();

  const encounterScenario = useMemo(() => {
    if (chatMode !== 'encounter') return null;
    const scenarioId = String(encounterConfig?.scenarioId || '').trim();
    if (!scenarioId) return null;
    return getEncounterScenarioById(scenarioId) || null;
  }, [chatMode, encounterConfig?.scenarioId]);

  const encounterSystemPromptAddon = useMemo(() => {
    if (chatMode !== 'encounter') return '';
    if (!encounterScenario) return '';
    return buildEncounterSystemPromptAddon(encounterScenario, encounterConfig?.options);
  }, [chatMode, encounterConfig?.options, encounterScenario]);

  const [bondPromptAddon, setBondPromptAddon] = useState<string>('');
  const [bondLevelName, setBondLevelName] = useState<string>('');

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const heatStorageKey = currentCharacter.id ? `heat_${currentCharacter.id}` : null;
  const wardrobeColorsStorageKey = currentCharacter.id ? `wardrobe_colors_${currentCharacter.id}` : null;
  const [heat, setHeat] = useState<number>(() => clamp((character?.heat ?? 25) as number, 0, 100));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!heatStorageKey) return;
    try {
      const dbHeat = currentCharacter?.heat;
      if (typeof dbHeat === 'number' && Number.isFinite(dbHeat)) {
        setHeat(clamp(dbHeat, 0, 100));
        return;
      }

      const raw = window.localStorage.getItem(heatStorageKey);
      const parsed = raw === null ? NaN : Number(raw);
      if (Number.isFinite(parsed)) setHeat(clamp(parsed, 0, 100));
    } catch {
      // ignore
    }
  }, [heatStorageKey]);

  useEffect(() => {
    const loadBond = async () => {
      if (!currentCharacter?.id) {
        setBondPromptAddon('');
        return;
      }

      try {
        const rel = await bondService.applyInactivityDecay(currentCharacter.id);
        if (!rel) {
          setBondPromptAddon('');
          setBondLevelName('');
          return;
        }

        const bondState = getBondState(rel.bond_points);
        setBondPromptAddon(buildBondSystemPromptAddon(bondState));
        setBondLevelName(bondState.level.name);
      } catch {
        setBondPromptAddon('');
        setBondLevelName('');
      }
    };

    loadBond();
  }, [currentCharacter?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!wardrobeColorsStorageKey) return;
    try {
      const raw = window.localStorage.getItem(wardrobeColorsStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : null;
      if (parsed && typeof parsed === 'object') setWardrobeOutfitColors(parsed);
    } catch {
      // ignore
    }
  }, [wardrobeColorsStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!wardrobeColorsStorageKey) return;
    try {
      window.localStorage.setItem(wardrobeColorsStorageKey, JSON.stringify(wardrobeOutfitColors));
    } catch {
      // ignore
    }
  }, [wardrobeOutfitColors, wardrobeColorsStorageKey]);

  useEffect(() => {
    if (!showWardrobe) return;
    setWardrobeTab('regular');
    setWardrobeSearch('');
    setPendingWardrobeClothing((currentCharacter?.appearance?.clothing as ClothingStyle) || null);
    setPendingWardrobeCustomClothing(currentCharacter?.appearance?.customClothing || '');
  }, [showWardrobe, currentCharacter?.appearance?.clothing, currentCharacter?.appearance?.customClothing]);

  useEffect(() => {
    const dbHeat = currentCharacter?.heat;
    if (typeof dbHeat === 'number' && Number.isFinite(dbHeat)) {
      setHeat(clamp(dbHeat, 0, 100));
    }
  }, [currentCharacter?.heat, currentCharacter?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!heatStorageKey) return;
    try {
      window.localStorage.setItem(heatStorageKey, String(Math.round(clamp(heat, 0, 100))));
    } catch {
      // ignore
    }
  }, [heat, heatStorageKey]);

  const computeHeatDelta = (text: string, current: number): number => {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return 0;

    const hasAny = (words: string[]) => words.some((w) => t.includes(w));

    const positive = [
      'thank',
      'thanks',
      'please',
      'sorry',
      'cute',
      'beautiful',
      'pretty',
      'adorable',
      'sweet',
      'good girl',
      'i like you',
      'i love you',
      'hug',
      'kiss',
    ];

    const negative = [
      'shut up',
      'stupid',
      'idiot',
      'hate you',
      'ugly',
      'bitch',
      'whore',
      'slut',
      'die',
      'kill yourself',
    ];

    const flirty = ['flirt', 'tease', 'blush', 'turn me on', 'hot', 'sexy'];

    const explicit = [
      'sex',
      'fuck',
      'blowjob',
      'deepthroat',
      'pussy',
      'cock',
      'dick',
      'cum',
      'orgasm',
      'anal',
      'nude',
      'naked',
      'undress',
      'undressed',
      'strip',
      'topless',
    ];

    let delta = 0;
    if (hasAny(positive)) delta += 3;
    if (hasAny(flirty)) delta += 2;
    if (hasAny(negative)) delta -= 8;

    if (hasAny(explicit)) {
      delta += current < 40 ? -6 : 2;
    }

    if (delta === 0) delta -= 1;
    return delta;
  };


  const applyHeatUpdateFromUserText = (text: string): number => {
    const next = clamp(heat + computeHeatDelta(text, heat), 0, 100);
    setHeat(next);
    setCurrentCharacter((prev) => ({ ...prev, heat: next }));

    if (currentCharacter?.id) {
      characterAPI.updateCharacter(currentCharacter.id, { heat: next } as any).then((res) => {
        if (!res?.success) {
          console.error('Failed to persist heat:', res?.error);
        }
      });
    }
    return next;
  };

  const updateBondFromUserText = async (text: string): Promise<string> => {
    if (!currentCharacter?.id) return bondPromptAddon;
    try {
      const rel = await bondService.registerInteraction(currentCharacter.id, text);
      if (!rel) {
        setBondPromptAddon('');
        setBondLevelName('');
        return '';
      }

      const bondState = getBondState(rel.bond_points);
      const addon = buildBondSystemPromptAddon(bondState);
      setBondPromptAddon(addon);
      setBondLevelName(bondState.level.name);
      return addon;
    } catch {
      return bondPromptAddon;
    }
  };

  const getMessageImageUrls = (m: ChatMessage): string[] => {
    const list = Array.isArray((m as any).imageUrls) ? (m as any).imageUrls : [];
    const single = m.imageUrl ? [m.imageUrl] : [];
    const merged = [...list, ...single];
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const u of merged) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      unique.push(u);
    }
    return unique;
  };

  const appendMessageImageUrl = async (messageId: string, url: string) => {
    if (!url) return;
    let nextUrls: string[] = [];
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        nextUrls = [...getMessageImageUrls(m), url];
        return { ...m, imageUrls: nextUrls, imageUrl: nextUrls[0] };
      })
    );

    // Persist to DB so images survive refresh
    if (nextUrls.length > 0) {
      const updateRes = await characterAPI.updateMessage(messageId, {
        imageUrl: nextUrls[0],
        imageUrls: nextUrls,
      } as any);

      if (!updateRes?.success) {
        console.error('Failed to persist message images:', updateRes?.error);
      }
    }
  };

  const openMessageImagesModal = (m: ChatMessage, startIndex = 0) => {
    const urls = getMessageImageUrls(m);
    setActiveMessageId(m.id);
    setActiveMessageContent(m.content);
    setActiveMessageImages(urls);
    setActiveMessageImageIndex(Math.min(Math.max(startIndex, 0), Math.max(urls.length - 1, 0)));
    setShowAllImagesModal(true);
  };

  const closeAllImagesModal = () => {
    setShowAllImagesModal(false);
    setActiveMessageId(null);
    setActiveMessageContent('');
    setActiveMessageImages([]);
    setActiveMessageImageIndex(0);
  };

  const persistMessageImages = async (messageId: string, nextUrls: string[]) => {
    const normalized = (nextUrls || []).filter(Boolean);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, imageUrls: normalized, imageUrl: normalized[0] }
          : m
      )
    );

    if (activeMessageId === messageId) {
      setActiveMessageImages(normalized);
      setActiveMessageImageIndex((i) => Math.min(i, Math.max(normalized.length - 1, 0)));
    }

    const updateRes = await characterAPI.updateMessage(messageId, {
      imageUrl: normalized[0] || '',
      imageUrls: normalized,
    } as any);

    if (!updateRes?.success) {
      console.error('Failed to persist message images:', updateRes?.error);
    }
  };

  const handleDeleteMessageImageAtIndex = async (messageId: string, index: number) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const urls = getMessageImageUrls(msg);
    if (index < 0 || index >= urls.length) return;

    const nextUrls = urls.filter((_, i) => i !== index);
    await persistMessageImages(messageId, nextUrls);

    if (activeMessageId === messageId) {
      setActiveMessageImageIndex((i) => {
        const next = Math.min(i, Math.max(nextUrls.length - 1, 0));
        if (index < i) return i - 1;
        return next;
      });
    }
  };

  const handleRegenerateMessageImageAtIndex = async (messageId: string, content: string, index: number) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: true } : m));
    try {
      let imagePlan;
      try {
        const chatContext = getImagePlanContextForMessage(messageId, content);
        imagePlan = await lmStudioService.generateImagePlan(chatContext, currentCharacter);
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

      if (!imageUrl) {
        console.error('No image URL returned from regeneration');
        return;
      }

      const msg = messages.find((m) => m.id === messageId);
      const urls = msg ? getMessageImageUrls(msg) : [];
      const nextUrls = [...urls];
      if (index < 0 || index >= nextUrls.length) {
        nextUrls.push(imageUrl);
      } else {
        nextUrls[index] = imageUrl;
      }

      await persistMessageImages(messageId, nextUrls);
    } catch (error) {
      console.error('Failed to regenerate message image:', error);
    } finally {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
    }
  };

  const findIntentMessageContent = (messageId: string): string | undefined => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx <= 0) return undefined;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]?.sender === 'user') return messages[i].content;
    }
    return undefined;
  };

  const handleGenerateMoreImagesForMessage = async (messageId: string, content: string) => {
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
        selectedFormat,
        imagePlan,
        intentMessageContent,
        messageId
      );

      if (imageUrl && imageUrl.length > 0) {
        if (isMountedRef.current) {
          await appendMessageImageUrl(messageId, imageUrl);
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
      }
    } finally {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
    }
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
        if (chatMode === 'encounter' && encounterConfig?.scenarioId) {
          const storageKey = `encounter_conversation_${currentCharacter.id}_${encounterConfig.scenarioId}`;
          let encounterConversationId: string | null = null;

          const encounterTitle = (() => {
            const scenarioId = String(encounterConfig.scenarioId);
            const mood = String(encounterConfig?.options?.mood || '').trim();
            const location = String(encounterConfig?.options?.location || '').trim();
            const intensity = String(encounterConfig?.options?.intensity || '').trim();

            const parts: string[] = [`encounter:${scenarioId}`];
            if (mood) parts.push(`mood=${encodeURIComponent(mood)}`);
            if (location) parts.push(`location=${encodeURIComponent(location)}`);
            if (intensity) parts.push(`intensity=${encodeURIComponent(intensity)}`);
            return parts.join('|');
          })();

          try {
            encounterConversationId = window.localStorage.getItem(storageKey);
          } catch {
            // ignore
          }

          const forcedConversationId = String(encounterConfig?.conversationId || '').trim();
          if (forcedConversationId) {
            encounterConversationId = forcedConversationId;
            try {
              window.localStorage.setItem(storageKey, forcedConversationId);
            } catch {
              // ignore
            }
          }

          if (!encounterConversationId) {
            const created = await characterAPI.createConversation(
              currentCharacter.id,
              encounterTitle
            );
            if (created.success && created.data?.id) {
              encounterConversationId = String(created.data.id);
              try {
                window.localStorage.setItem(storageKey, encounterConversationId);
              } catch {
                // ignore
              }
            }
          }

          if (encounterConversationId) {
            await characterAPI.updateConversationTitle(encounterConversationId, encounterTitle);

            setConversation({
              id: encounterConversationId,
              characterId: currentCharacter.id,
              userId: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            const messagesResult = await characterAPI.getMessages(encounterConversationId);
            if (messagesResult.success && messagesResult.data) {
              setMessages(messagesResult.data.map((m: any) => {
                const urls = Array.isArray(m.image_urls)
                  ? m.image_urls
                  : (m.image_url ? [m.image_url] : []);

                return {
                  ...m,
                  imageUrl: m.image_url || urls[0],
                  imageUrls: urls,
                  timestamp: new Date(m.timestamp)
                };
              }));
            } else {
              setMessages([]);
            }

            return;
          }
        }

        const convResult = await characterAPI.getConversation(currentCharacter.id);
        if (convResult.success && convResult.data) {
          setConversation(convResult.data);
          const messagesResult = await characterAPI.getMessages(convResult.data.id);
          if (messagesResult.success && messagesResult.data) {
            setMessages(messagesResult.data.map((m: any) => {
              const urls = Array.isArray(m.image_urls)
                ? m.image_urls
                : (m.image_url ? [m.image_url] : []);

              return {
                ...m,
                imageUrl: m.image_url || urls[0],
                imageUrls: urls,
                timestamp: new Date(m.timestamp)
              };
            }));
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
  }, [currentCharacter.id, chatMode, encounterConfig?.scenarioId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return;

    const userMessageContent = inputMessage;
    setInputMessage('');

    const nextHeat = applyHeatUpdateFromUserText(userMessageContent);
    const nextBondAddon = await updateBondFromUserText(userMessageContent);

    const systemPromptAddon = [nextBondAddon, chatMode === 'encounter' ? encounterSystemPromptAddon : '']
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .join('\n\n');

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
      const llmResponse = await lmStudioService.sendMessage(chatContext, currentCharacter, {
        heat: nextHeat,
        systemPromptAddon: systemPromptAddon || undefined,
      });

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

  const wardrobeColorOptions = [
    { id: 'default', label: 'Default', value: '' },
    { id: 'black', label: 'Black', value: 'black' },
    { id: 'white', label: 'White', value: 'white' },
    { id: 'red', label: 'Red', value: 'red' },
    { id: 'blue', label: 'Blue', value: 'blue' },
    { id: 'emerald', label: 'Emerald', value: 'emerald' },
    { id: 'pink', label: 'Pink', value: 'pink' },
    { id: 'purple', label: 'Purple', value: 'purple' },
    { id: 'amber', label: 'Amber', value: 'amber' },
    { id: 'rose', label: 'Rose', value: 'rose' },
    { id: 'cyan', label: 'Cyan', value: 'cyan' },
  ];

  const wardrobeRegularOutfits: Array<{ id: ClothingStyle; label: string; image: string; description: string }> = [
    { id: ClothingStyle.CASUAL, label: 'Casual', image: '/clothes/cute.jpg', description: 'Relaxed everyday style - comfortable and approachable look' },
    { id: ClothingStyle.FORMAL, label: 'Formal', image: '/clothes/formal.png', description: 'Classic evening elegance - refined and sophisticated outfit' },
    { id: ClothingStyle.SPORTY, label: 'Sporty', image: '/clothes/sport.jpg', description: 'Active and energetic - athletic vibe with practical details' },
    { id: ClothingStyle.ELEGANT, label: 'Elegant', image: '/clothes/elegent.jpg', description: 'Timeless sophistication - graceful, polished appearance' },
    { id: ClothingStyle.CUTE, label: 'Cute', image: '/clothes/cute.jpg', description: 'Adorable and sweet - charming and playful look' },
    { id: ClothingStyle.EDGY, label: 'Edgy', image: '/clothes/edgy.jpg', description: 'Bold modern style - confident attitude with striking accents' },
    { id: ClothingStyle.TRADITIONAL, label: 'Traditional', image: '/clothes/traditional.jpg', description: 'Cultural elegance - rich patterns and traditional details' },
    { id: ClothingStyle.FANTASY, label: 'Fantasy', image: '/clothes/fantasy.jpg', description: 'Magical and dreamy - enchanting fairytale outfit' },
  ];

  const wardrobeAdultOutfits: Array<{ id: ClothingStyle; label: string; image: string; description: string }> = [
    { id: ClothingStyle.LINGERIE, label: 'Lingerie', image: '/clothes/lingerie.jpg', description: 'Intimate apparel - delicate lace lingerie set for romantic moments' },
    { id: ClothingStyle.NAKED, label: 'Naked', image: '/clothes/nude.jpg', description: 'Natural beauty - completely nude, embracing natural form' },
    { id: ClothingStyle.BIKINI, label: 'Bikini', image: '/clothes/bikini.jpg', description: 'Beach ready - revealing bikini perfect for sunny days' },
    { id: ClothingStyle.UNDERWEAR, label: 'Underwear', image: '/clothes/underwear.jpg', description: 'Intimate wear - sexy underwear set for private moments' },
    { id: ClothingStyle.REVEALING, label: 'Revealing', image: '/clothes/revealing.jpg', description: 'Bold style - daring outfit that shows more skin' },
    { id: ClothingStyle.BODYSUIT, label: 'Bodysuit', image: '/clothes/bodysuit.jpg', description: 'Form fitting - tight bodysuit that accentuates curves' },
    { id: ClothingStyle.CROTCHLESS, label: 'Crotchless Panties', image: '/clothes/lingerie.jpg', description: 'Extremely explicit - sheer lace panties with fully open crotch, designed for instant access and maximum exposure' },
    { id: ClothingStyle.NIPPLE_PASTIES, label: 'Nipple Pasties', image: '/clothes/Nipple Pasties.jpg', description: 'Tiny pasties only, otherwise topless, provocative minimalist lingerie' },
  ];

  const WardrobeOutfitCard = ({
    outfit,
  }: {
    outfit: { id: ClothingStyle; label: string; image: string; description: string };
  }) => {
    const selected = pendingWardrobeClothing === outfit.id;
    const colorKey = outfit.id;
    const selectedColor = wardrobeOutfitColors[colorKey] || '';
    const showColorPicker = outfit.id !== ClothingStyle.NAKED;
    const matchesSearch =
      !wardrobeSearch.trim() ||
      `${outfit.label} ${outfit.description}`.toLowerCase().includes(wardrobeSearch.trim().toLowerCase());

    if (!matchesSearch) return null;

    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setPendingWardrobeClothing(outfit.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setPendingWardrobeClothing(outfit.id);
        }}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-150 cursor-pointer ${selected
          ? 'border-pink-500/70 bg-pink-500/10 ring-2 ring-pink-500/15'
          : 'border-dark-600/80 bg-dark-800/40 hover:border-pink-500/35 hover:bg-dark-800/60'
          }`}
      >
        <div className="relative aspect-[16/18] bg-gradient-to-br from-dark-700 to-dark-900">
          <img
            src={outfit.image}
            alt={outfit.label}
            className="w-full h-full object-cover opacity-80 transition-opacity duration-150"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[2px]" />

          {selected && (
            <div className="absolute top-3 right-3">
              <div className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs font-medium">
                Selected
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-white font-semibold tracking-tight truncate">{outfit.label}</h4>
              </div>
            </div>

            {showColorPicker && (
              <div className="mt-2">
                <div className="flex flex-wrap justify-start gap-1.5 mt-2 px-1">
                  {wardrobeColorOptions.map((c) => {
                    const isActive = (selectedColor || '') === (c.value || '');
                    const bg =
                      c.id === 'default'
                        ? 'bg-gradient-to-br from-gray-600 to-gray-700'
                        : c.id === 'white'
                          ? 'bg-gradient-to-br from-white to-gray-100'
                          : c.id === 'black'
                            ? 'bg-gradient-to-br from-black to-gray-900'
                            : c.id === 'red'
                              ? 'bg-gradient-to-br from-red-400 to-red-600'
                              : c.id === 'blue'
                                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                : c.id === 'emerald'
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                  : c.id === 'pink'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                                    : c.id === 'purple'
                                      ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                      : c.id === 'amber'
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                        : c.id === 'rose'
                                          ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                                          : c.id === 'cyan'
                                            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600'
                                            : 'bg-gradient-to-br from-violet-400 to-violet-600';

                    return (
                      <button
                        key={`${outfit.id}-${c.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWardrobeOutfitColors((prev) => ({
                            ...prev,
                            [colorKey]: c.value,
                          }));
                        }}
                        className={`w-5 h-5 rounded-full border-2 aspect-square transition-all duration-150 shadow-lg ${bg} ${c.id === 'white' ? 'border-gray-300' : 'border-white/30'} ${isActive
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900 scale-110 shadow-xl'
                          : 'hover:scale-105'
                          }`}
                        title={c.label}
                        aria-label={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleResetChat = async () => {
    if (!conversation) return;

    if (chatMode === 'encounter' && currentCharacter.id && encounterConfig?.scenarioId) {
      const storageKey = `encounter_conversation_${currentCharacter.id}_${encounterConfig.scenarioId}`;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }

    const ok = await dialog.confirm({
      title: 'Reset chat history?',
      message: 'This will delete the entire conversation history. This cannot be undone.',
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
        selectedFormat,
        imagePlan,
        intentMessageContent,
        messageId
      );
      
      if (imageUrl && imageUrl.length > 0) {
        if (isMountedRef.current) {
          await appendMessageImageUrl(messageId, imageUrl);
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
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
      const llmResponse = await lmStudioService.sendMessage(chatContext, currentCharacter, { heat });

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

  const handleOutfitChange = async (clothing: ClothingStyle, color?: string) => {
    const resolvedColorRaw = typeof color === 'string' && color.trim().length > 0 ? color.trim() : undefined;
    const resolvedColor = resolvedColorRaw ? normalizeA1111ColorName(resolvedColorRaw) : undefined;

    // Update character's clothing
    const updatedCharacter = {
      ...currentCharacter,
      appearance: {
        ...currentCharacter.appearance,
        clothing: clothing,
        clothingColor: resolvedColor
      }
    };

    setCurrentCharacter(updatedCharacter);
    setShowWardrobe(false);

    // Save to database using direct update
    if (currentCharacter.id) {
      try {
        const result = await characterAPI.updateCharacterDirect(currentCharacter.id, {
          clothing: clothing,
          clothing_color: resolvedColor || null
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
    const colorLabel = resolvedColor ? ` (${resolvedColor})` : '';
    const outfitMessage: Partial<ChatMessage> = {
      conversationId: conversation?.id || 'temp',
      characterId: currentCharacter.id || 'temp',
      content: `*${currentCharacter.name || 'The character'} changes into a ${clothing}${colorLabel} outfit*`,
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
        customClothing: customOutfit,
        clothingColor: undefined
      }
    };

    setCurrentCharacter(updatedCharacter);
    setShowWardrobe(false);

    // Save to database using direct update
    if (currentCharacter.id) {
      try {
        const result = await characterAPI.updateCharacterDirect(currentCharacter.id, {
          clothing: ClothingStyle.CUSTOM,
          custom_clothing: customOutfit,
          clothing_color: null
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

  const handleLeaveEncounter = async () => {
    if (!isEncounter) {
      onBack();
      return;
    }

    const ok = await dialog.confirm({
      title: 'Leave Encounter?',
      message: 'The scene will pause. You can come back to Encounters to start a new scene any time.',
      confirmText: 'Leave',
      cancelText: 'Stay',
      destructive: true,
    });

    if (!ok) return;
    onBack();
  };

  const handleChangeEncounterOptions = async () => {
    if (!isEncounter) return;

    const ok = await dialog.confirm({
      title: 'Change encounter setup?',
      message: 'You will return to Encounters setup. This scene will remain paused unless you restart it.',
      confirmText: 'Go to Setup',
      cancelText: 'Stay',
      destructive: false,
    });

    if (!ok) return;
    router.push('/encounters');
  };

  const handleRestartEncounterScene = async () => {
    if (!isEncounter || !conversation) return;

    const ok = await dialog.confirm({
      title: 'Restart scene?',
      message: 'This will clear the current scene conversation and start fresh.',
      confirmText: 'Restart',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    if (currentCharacter.id && encounterConfig?.scenarioId) {
      const storageKey = `encounter_conversation_${currentCharacter.id}_${encounterConfig.scenarioId}`;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }

    const result = await characterAPI.resetConversation(conversation.id);
    if (result.success) {
      setMessages([]);
      setConversation(null);
      await initChat();
    }
  };

  const handleRewindEncounter = async () => {
    if (!isEncounter || !conversation) return;
    if (isTyping) return;

    const lastCharacterIndex = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.sender === 'character') return i;
      }
      return -1;
    })();

    if (lastCharacterIndex === -1) return;

    const lastUserIndex = (() => {
      for (let i = lastCharacterIndex - 1; i >= 0; i--) {
        if (messages[i]?.sender === 'user') return i;
      }
      return -1;
    })();

    const ok = await dialog.confirm({
      title: 'Rewind the last exchange?',
      message: 'This will delete the most recent assistant response (and the user message before it when available).',
      confirmText: 'Rewind',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    const idsToDelete = new Set<string>();
    const charMsg = messages[lastCharacterIndex];
    if (charMsg?.id) idsToDelete.add(charMsg.id);
    if (lastUserIndex !== -1) {
      const userMsg = messages[lastUserIndex];
      if (userMsg?.id) idsToDelete.add(userMsg.id);
    }

    for (const id of idsToDelete) {
      const res = await characterAPI.deleteMessage(id);
      if (!res?.success) {
        await dialog.alert({
          title: 'Error',
          message: 'Failed to rewind the scene. Please try again.',
        });
        return;
      }
    }

    setMessages((prev) => prev.filter((m) => !idsToDelete.has(m.id)));
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
                      className={`w-full h-full object-cover ${isEncounter ? 'opacity-70 saturate-75 contrast-90' : ''}`}
                    />
                    <div className={`absolute inset-0 pointer-events-none ${isEncounter ? 'bg-gradient-to-t from-black/55 via-black/10 to-transparent' : 'bg-gradient-to-t from-black/40 via-transparent to-transparent'}`} />
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
            className={`flex-1 min-h-0 flex flex-col bg-gradient-to-b from-dark-900/30 to-dark-800/30 mt-0 transition-[margin] duration-500 ease-in-out ${
              isLargeScreen ? 'mr-[450px]' : 'mr-0'
            }`}
          >
            {/* Chat Header */}
            {isEncounter ? (
              <div className="relative overflow-hidden border-b border-dark-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900/80 to-dark-950" />
                <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_30%,rgba(236,72,153,0.18),transparent_55%)]" />
                <div className="relative px-5 sm:px-8 lg:px-12 py-8 sm:py-10 backdrop-blur-sm">
                  <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="text-xs tracking-[0.22em] uppercase text-pink-200/70">
                        Scene
                      </div>
                      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                        {encounterScenario?.title || 'Encounter'}
                      </h1>
                      <div className="mt-3 text-sm sm:text-[15px] leading-relaxed text-dark-200/90 max-w-3xl">
                        {encounterScenario?.shortDescription || ''}
                      </div>
                      <div className="mt-5 text-[12px] text-dark-300/90">
                        {[
                          encounterConfig?.options?.mood?.trim() ? `Mood: ${encounterConfig.options.mood.trim()}` : null,
                          encounterConfig?.options?.location?.trim() ? `Location: ${encounterConfig.options.location.trim()}` : null,
                          encounterConfig?.options?.intensity ? `Intensity: ${encounterConfig.options.intensity}` : null,
                          bondLevelName ? `Bond: ${bondLevelName}` : null,
                        ]
                          .filter(Boolean)
                          .join('  •  ')}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => setBlurImages((v) => !v)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                          blurImages
                            ? 'text-pink-200 bg-pink-500/10 border-pink-500/30'
                            : 'text-dark-200 bg-dark-900/30 border-dark-700/60 hover:border-pink-500/25 hover:bg-dark-900/40'
                        }`}
                        title={blurImages ? 'Unblur images' : 'Blur images'}
                      >
                        Blur
                      </button>
                      <button
                        onClick={handleRewindEncounter}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-dark-700/60 bg-dark-900/30 text-dark-200 hover:bg-dark-900/40 hover:border-pink-500/20 transition-all duration-200"
                        title="Rewind the last exchange"
                      >
                        Rewind
                      </button>
                      <button
                        onClick={handleRestartEncounterScene}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-dark-700/60 bg-dark-900/30 text-dark-200 hover:bg-dark-900/40 hover:border-pink-500/20 transition-all duration-200"
                        title="Restart this scene"
                      >
                        Restart
                      </button>
                      <button
                        onClick={handleChangeEncounterOptions}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-dark-700/60 bg-dark-900/30 text-dark-200 hover:bg-dark-900/40 hover:border-pink-500/20 transition-all duration-200"
                        title="Change encounter options"
                      >
                        Options
                      </button>
                      <button
                        onClick={handleLeaveEncounter}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/15 transition-all duration-200"
                        title="Leave Encounter"
                      >
                        Leave Encounter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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

                  {/* Actions - Right */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBlurImages((v) => !v)}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        blurImages
                          ? 'text-pink-300 bg-pink-400/10'
                          : 'text-dark-400 hover:text-pink-300 hover:bg-pink-400/10'
                      }`}
                      title={blurImages ? 'Unblur images' : 'Blur images'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7S2 12 2 12z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
                      </svg>
                    </button>

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
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 min-h-0 relative">
              {!isEncounter && (
                <div className="absolute left-4 sm:left-6 lg:left-8 top-4 bottom-4 hidden lg:block pointer-events-none">
                  <HeatMeter value={heat} variant="embedded" className="h-full" />
                </div>
              )}

              {/* Scrollable Only */}
              <div className={`h-full min-h-0 overflow-y-auto ${isEncounter ? 'px-5 sm:px-8 lg:px-12 py-8 sm:py-10' : 'p-4 sm:p-6 lg:p-8'}`}>
                <div className={`${isEncounter ? 'max-w-5xl mx-auto space-y-10' : 'max-w-4xl mx-auto space-y-5 lg:pl-20'}`}>
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                      >
                      <div
                        className={`flex w-full ${isEncounter ? 'items-start' : 'items-end gap-3'} ${message.sender === 'system'
                          ? 'justify-center'
                          : isEncounter
                            ? 'justify-start'
                            : message.sender === 'user'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                      >
                        {!isEncounter && message.sender !== 'user' && message.sender !== 'system' && (
                          <div className="w-9 h-9 rounded-2xl bg-dark-800/60 border border-dark-700/60 backdrop-blur-md flex items-center justify-center text-xs font-semibold text-pink-200 shadow-sm shadow-black/20 select-none">
                            {(currentCharacter.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          )}

                        <div className={`${message.sender === 'system' ? 'max-w-2xl w-full' : isEncounter ? 'w-full' : 'max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]'}`}>
                          <div
                            className={isEncounter
                              ? `relative ${message.sender === 'system'
                                ? 'px-4 py-3 rounded-2xl bg-dark-900/30 text-dark-200 border border-dark-700/50'
                                : 'px-0 py-0 bg-transparent border-0 shadow-none ring-0'}`
                              : `px-5 py-4 rounded-3xl relative group/msg ring-1 ${message.sender === 'user'
                                ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/25 ring-pink-500/20'
                                : message.sender === 'system'
                                  ? 'bg-dark-900/40 text-dark-200 border border-dark-700/60 ring-white/5'
                                  : 'bg-dark-800/40 text-dark-200 border border-dark-700/60 backdrop-blur-md shadow-md shadow-black/20 ring-white/5'
                                }`}
                          >
                            <div className="relative">
                              <div className={`whitespace-pre-wrap ${isEncounter ? 'text-[17px] leading-8 text-dark-100' : 'text-[15px] leading-relaxed'}`}>
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
                              </div>
                            </div>

                            {!isEncounter && (
                              <div className={`mt-3 pt-3 border-t border-white/10 flex items-center justify-end gap-1 ${message.sender === 'system' ? 'hidden' : ''}`}>
                              {extractDialogueText(message.content) && (
                                <TTSButton
                                  text={extractDialogueText(message.content)}
                                  className="p-1 text-pink-300/70 hover:text-pink-200 hover:bg-pink-500/10 rounded-lg transition-all"
                                  title="Generate voice"
                                />
                              )}
                              {message.sender === 'character' && getMessageImageUrls(message).length === 0 && !message.isGeneratingImage && (
                                <button
                                  onClick={() => handleGenerateMessageImage(message.id, message.content)}
                                  className="p-1 text-pink-300/70 hover:text-pink-200 hover:bg-pink-500/10 rounded-lg transition-all"
                                  title="Generate image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                              {message.sender === 'character' && (
                                <button
                                  onClick={() => handleRegenerateCharacterMessage(message.id, message.content)}
                                  className="p-1 text-pink-300/70 hover:text-pink-200 hover:bg-pink-500/10 rounded-lg transition-all"
                                  title="Regenerate message"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1 text-red-300/70 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete message"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              </div>
                            )}

                          {/* Generated Images Below Message */}
                          {(getMessageImageUrls(message).length > 0 || message.isGeneratingImage) && (
                            <div className="mt-2">
                              <div className="flex items-start gap-2">
                                <div className="flex items-start gap-2">
                                  {getMessageImageUrls(message)
                                    .slice(0, 2)
                                    .map((url, idx) => (
                                      <div
                                        key={`${message.id}-img-${idx}`}
                                        className="relative rounded-2xl overflow-hidden border border-pink-500/25 bg-black/10 shadow-lg shadow-black/30 w-[104px] group/img"
                                      >
                                        <img
                                          src={url}
                                          alt="Scene"
                                          className="w-[104px] h-[132px] object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                          style={blurImages ? { filter: 'blur(12px)' } : undefined}
                                          onClick={() => {
                                            setZoomedImageUrl(url);
                                            setIsZoomed(true);
                                          }}
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRegenerateMessageImageAtIndex(message.id, message.content, idx);
                                            }}
                                            className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-pink-200 border border-white/10 hover:border-pink-500/30 transition-all"
                                            title="Regenerate image"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteMessageImageAtIndex(message.id, idx);
                                            }}
                                            className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-200 border border-white/10 hover:border-red-500/30 transition-all"
                                            title="Delete image"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                  {getMessageImageUrls(message).length > 2 && (
                                    <button
                                      onClick={() => openMessageImagesModal(message, 0)}
                                      className="w-[104px] h-[132px] rounded-2xl border border-pink-500/25 bg-gradient-to-br from-dark-800/50 to-dark-900/30 text-pink-100 hover:bg-pink-500/10 transition-all duration-200 flex flex-col items-center justify-center gap-1"
                                      title="View all images"
                                    >
                                      <span className="text-xl font-semibold">+{Math.max(getMessageImageUrls(message).length - 2, 1)}</span>
                                      <span className="text-[11px] text-pink-200/80">View all</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleGenerateMoreImagesForMessage(message.id, message.content)}
                                    className="px-3 py-2 rounded-2xl text-xs font-semibold bg-gradient-to-r from-pink-600/15 to-dark-700/30 text-pink-100 border border-pink-500/20 hover:border-pink-500/35 hover:bg-pink-500/10 transition-all duration-200"
                                    title="Generate another image for this message"
                                  >
                                    More images
                                  </button>
                                  {message.isGeneratingImage && (
                                    <div className="px-3 py-2 rounded-2xl text-xs bg-dark-800/40 text-pink-200 border border-pink-500/15">
                                      Generating...
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={`mt-3 text-[11px] ${message.sender === 'system'
                          ? 'text-center text-dark-400'
                          : isEncounter
                            ? 'text-left text-dark-400'
                            : message.sender === 'user'
                              ? 'text-right text-pink-200/70'
                              : 'text-left text-dark-400'
                          }`}
                        >
                          {isEncounter && message.sender !== 'system'
                            ? `${message.sender === 'user' ? 'You' : currentCharacter.name || 'Her'}${message.timestamp instanceof Date ? '  ·  ' : ''}`
                            : ''}
                          {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>

                        {!isEncounter && message.sender === 'user' && (
                          <div className="w-9 h-9 rounded-2xl bg-pink-600/20 border border-pink-500/20 backdrop-blur-md flex items-center justify-center text-xs font-semibold text-pink-200 shadow-sm shadow-black/20 select-none" title="You">
                            Y
                          </div>
                        )}
                      </div>
                    </motion.div>
                    ))}
                  </AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className={`${isEncounter ? 'bg-transparent border-0 shadow-none ring-0 px-0 py-0' : 'bg-dark-800/40 text-dark-200 px-5 py-3 rounded-3xl border border-dark-700/60 ring-1 ring-white/5 backdrop-blur-md shadow-md shadow-black/20'}`}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 lg:p-6 border-t border-dark-700/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                {showFormatSelector && pendingGeneration && (
                  <div className="flex justify-center mb-3" onClick={(e) => e.stopPropagation()}>
                    <FormatSelector
                      selectedFormat={selectedFormat}
                      onFormatChange={handleFormatSelectAndGenerate}
                      disabled={false}
                    />
                  </div>
                )}
                {/* Buttons Above Input */}
                {!isEncounter && (
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
                )}

                {/* Input with Send Button */}
                <div className="relative">
                  {isEncounter ? (
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="What do you do or say?"
                      rows={3}
                      className="w-full px-5 py-4 pr-16 bg-dark-900/25 text-dark-100 rounded-2xl border border-dark-700/60 focus:border-pink-500/35 focus:outline-none focus:ring-2 focus:ring-pink-500/15 backdrop-blur-sm placeholder:text-dark-300 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-5 py-3 pr-16 bg-dark-800/50 text-dark-200 rounded-2xl border border-pink-500/50 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 backdrop-blur-sm placeholder-pink-400"
                    />
                  )}

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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWardrobe(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 bg-gradient-to-br from-dark-800/95 to-dark-900/95 backdrop-blur-md border-b border-dark-600/60 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-pink-200 tracking-tight">Wardrobe</h2>
                  </div>
                  <button
                    onClick={() => setShowWardrobe(false)}
                    className="w-10 h-10 flex items-center justify-center text-dark-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-center gap-2 p-1 bg-dark-950/30 border border-dark-600/60 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setWardrobeTab('regular');
                        const wardrobeContent = document.getElementById('wardrobe-content');
                        if (wardrobeContent) {
                          wardrobeContent.scrollTop = 0;
                        }
                      }}
                      className={`h-9 px-4 rounded-xl text-sm font-medium transition-all ${wardrobeTab === 'regular'
                        ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                        : 'text-dark-300 hover:text-white'
                        }`}
                    >
                      Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWardrobeTab('adult');
                        const wardrobeContent = document.getElementById('wardrobe-content');
                        if (wardrobeContent) {
                          wardrobeContent.scrollTop = 0;
                        }
                      }}
                      className={`h-9 px-4 rounded-xl text-sm font-medium transition-all ${wardrobeTab === 'adult'
                        ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                        : 'text-dark-300 hover:text-white'
                        }`}
                    >
                      Adult
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWardrobeTab('custom');
                        const wardrobeContent = document.getElementById('wardrobe-content');
                        if (wardrobeContent) {
                          wardrobeContent.scrollTop = 0;
                        }
                      }}
                      className={`h-9 px-4 rounded-xl text-sm font-medium transition-all ${wardrobeTab === 'custom'
                        ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                        : 'text-dark-300 hover:text-white'
                        }`}
                    >
                      Custom
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-pink-400">Current</div>
                      <div className="text-sm text-white font-medium truncate">
                        {currentCharacter.appearance?.clothing === ClothingStyle.CUSTOM ? (
                          <span className="text-green-400">Custom</span>
                        ) : (
                          <span className="capitalize">{currentCharacter.appearance?.clothing || 'Default'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-[360px]">
                    <div className="relative">
                      <input
                        type="text"
                        value={wardrobeSearch}
                        onChange={(e) => setWardrobeSearch(e.target.value)}
                        placeholder="Search outfits..."
                        className="w-full h-11 px-4 bg-dark-950/30 text-white rounded-2xl border border-dark-600/60 focus:border-pink-500/40 focus:outline-none focus:ring-2 focus:ring-pink-500/15 placeholder:text-dark-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div id="wardrobe-content" className="flex-1 px-6 py-6 overflow-y-auto">

              {/* Regular Outfits Section */}
              {wardrobeTab === 'regular' && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-pink-300">Regular Outfits</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wardrobeRegularOutfits.map((outfit) => (
                      <WardrobeOutfitCard key={outfit.id} outfit={outfit} />
                    ))}
                  </div>
                </div>
              )}

              {/* NSFW Outfits Section */}
              {wardrobeTab === 'adult' && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-pink-300">Adult Outfits</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wardrobeAdultOutfits.map((outfit) => (
                      <WardrobeOutfitCard key={outfit.id} outfit={outfit} />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Outfit Section */}
              {wardrobeTab === 'custom' && (
                <div className="border-t border-dark-700 pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-pink-300">Custom Outfit</h3>
                  </div>
                  <div className="bg-dark-700/30 rounded-2xl p-4 border border-dark-600">
                    <p className="text-pink-400 text-sm mb-3">Describe your custom outfit in detail:</p>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col lg:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="e.g., Victorian gothic dress with lace trim and corset..."
                          className="flex-1 px-4 py-3 bg-dark-800/50 text-white rounded-xl border border-pink-500/50 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 placeholder-pink-400"
                          value={pendingWardrobeCustomClothing}
                          onChange={(e) => setPendingWardrobeCustomClothing(e.target.value)}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setPendingWardrobeClothing(ClothingStyle.CUSTOM);
                          }}
                          className={`px-6 py-3 rounded-xl transition-all duration-200 shadow-lg font-medium ${pendingWardrobeClothing === ClothingStyle.CUSTOM
                            ? 'bg-green-500/20 text-green-200 border border-green-500/30 shadow-green-500/10'
                            : 'bg-dark-800/40 text-dark-200 border border-dark-600 hover:border-green-500/40 hover:text-white'
                            }`}
                        >
                          Select Custom
                        </motion.button>
                      </div>

                      {currentCharacter.appearance?.customClothing && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-dark-400 text-sm">Last used:</span>
                          <button
                            onClick={() => setPendingWardrobeCustomClothing(currentCharacter.appearance.customClothing!)}
                            className="text-left text-sm text-green-400 hover:text-green-300 hover:underline truncate max-w-xl"
                          >
                            "{currentCharacter.appearance.customClothing}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>

              <div className="shrink-0 border-t border-dark-600/60 px-6 py-4 bg-dark-950/20">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="text-sm text-dark-300">
                    {pendingWardrobeClothing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-dark-400">Selected:</span>
                        <span className="text-white font-medium capitalize">{pendingWardrobeClothing}</span>
                        {pendingWardrobeClothing !== ClothingStyle.CUSTOM && pendingWardrobeClothing !== ClothingStyle.NAKED && wardrobeOutfitColors[pendingWardrobeClothing] && (
                          <span className="text-pink-200">({wardrobeOutfitColors[pendingWardrobeClothing]})</span>
                        )}
                      </div>
                    ) : (
                      <span>Select an outfit to continue</span>
                    )}
                  </div>

                  <div className="flex-1" />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWardrobe(false)}
                      className="h-11 px-4 rounded-2xl bg-dark-800/40 text-dark-200 border border-dark-600 hover:border-dark-500 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWardrobeImageGeneration()}
                      className="h-11 px-4 rounded-2xl bg-dark-800/40 text-pink-200 border border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all"
                    >
                      Generate image
                    </button>
                    <button
                      type="button"
                      disabled={!pendingWardrobeClothing || (pendingWardrobeClothing === ClothingStyle.CUSTOM && !pendingWardrobeCustomClothing.trim())}
                      onClick={() => {
                        if (!pendingWardrobeClothing) return;
                        if (pendingWardrobeClothing === ClothingStyle.CUSTOM) {
                          const t = pendingWardrobeCustomClothing.trim();
                          if (!t) return;
                          handleCustomClothing(t);
                          return;
                        }
                        const color =
                          pendingWardrobeClothing === ClothingStyle.NAKED
                            ? ''
                            : wardrobeOutfitColors[pendingWardrobeClothing] || '';
                        handleOutfitChange(pendingWardrobeClothing, color || undefined);
                      }}
                      className="h-11 px-5 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-500 text-white font-semibold hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Apply
                    </button>
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

      {/* All Images Modal */}
      <AnimatePresence>
        {showAllImagesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeAllImagesModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-dark-800/95 to-dark-950/95 border border-dark-600/70 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-pink-200">All Images</h2>
                  <div className="text-xs text-dark-300">{activeMessageImageIndex + 1} / {activeMessageImages.length}</div>
                </div>
                <button
                  onClick={closeAllImagesModal}
                  className="w-10 h-10 flex items-center justify-center text-dark-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {activeMessageImages.length > 0 && (
                  <div className="mb-5">
                    <div className="relative rounded-3xl overflow-hidden border border-pink-500/15 bg-gradient-to-br from-black/30 to-black/10">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <img
                      src={activeMessageImages[activeMessageImageIndex]}
                      alt="Message image"
                      className="w-full h-[52vh] object-contain cursor-zoom-in"
                      style={blurImages ? { filter: 'blur(12px)' } : undefined}
                      onClick={() => {
                        setZoomedImageUrl(activeMessageImages[activeMessageImageIndex]);
                        setIsZoomed(true);
                      }}
                    />

                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!activeMessageId) return;
                          handleRegenerateMessageImageAtIndex(activeMessageId, activeMessageContent, activeMessageImageIndex);
                        }}
                        className="w-11 h-11 rounded-2xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-pink-500/30 hover:text-pink-200 hover:bg-black/60 transition-all"
                        title="Regenerate this image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!activeMessageId) return;
                          handleDeleteMessageImageAtIndex(activeMessageId, activeMessageImageIndex);
                        }}
                        className="w-11 h-11 rounded-2xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-red-500/30 hover:text-red-200 hover:bg-black/60 transition-all"
                        title="Delete this image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {activeMessageImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveMessageImageIndex((i) => (i - 1 + activeMessageImages.length) % activeMessageImages.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-pink-500/30 hover:text-pink-200 hover:bg-black/60 transition-all"
                          title="Previous"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setActiveMessageImageIndex((i) => (i + 1) % activeMessageImages.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-pink-500/30 hover:text-pink-200 hover:bg-black/60 transition-all"
                          title="Next"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                )}

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {activeMessageImages.map((url, idx) => (
                    <button
                      key={`message-img-${idx}`}
                      className={`relative shrink-0 rounded-2xl overflow-hidden border transition-all duration-200 group/thumb ${idx === activeMessageImageIndex
                        ? 'border-pink-500/80 ring-2 ring-pink-500/20'
                        : 'border-white/10 hover:border-pink-500/35'
                        }`}
                      onClick={() => setActiveMessageImageIndex(idx)}
                    >
                      <img
                        src={url}
                        alt="Chat image"
                        className="w-[128px] h-[84px] object-cover"
                        style={blurImages ? { filter: 'blur(12px)' } : undefined}
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!activeMessageId) return;
                            handleRegenerateMessageImageAtIndex(activeMessageId, activeMessageContent, idx);
                          }}
                          className="p-1 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-pink-200 border border-white/10 hover:border-pink-500/30 transition-all"
                          title="Regenerate"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!activeMessageId) return;
                            handleDeleteMessageImageAtIndex(activeMessageId, idx);
                          }}
                          className="p-1 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-200 border border-white/10 hover:border-red-500/30 transition-all"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
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
