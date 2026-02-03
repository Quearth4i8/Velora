'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import { CharacterStyle, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, EyeType, ClothingStyle, Environment, HairColor, EyeColor } from '@/lib/types';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { useDialog } from '@/components/ui/DialogProvider';
import { Eye, Sparkles } from 'lucide-react';
import { getAspectRatioOptionsForModel, getDimensionsFromAspectRatio, MODEL_DEFAULT_SETTINGS } from '@/config/aspect-ratios';

export default function GalleryPage() {
  const [filter, setFilter] = useState<'all' | 'sfw' | 'nsfw' | 'gallery'>('all');
  const [prompt, setPrompt] = useState('');
  const [specialPrompt, setSpecialPrompt] = useState('');
  const [specialNegativePrompt, setSpecialNegativePrompt] = useState('');
  const [specialFocus, setSpecialFocus] = useState<'custom' | 'eyes' | 'face' | 'scene' | 'object'>('eyes');
  const [specialRawPrompt, setSpecialRawPrompt] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpecialGenerating, setIsSpecialGenerating] = useState(false);
  const [communityImages, setCommunityImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingMoreImages, setIsLoadingMoreImages] = useState(false);
  const [imagesOffset, setImagesOffset] = useState(0);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();
  const dialog = useDialog();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [masonryColumns, setMasonryColumns] = useState(1);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const isNSFWImage = (image: any): boolean => {
    if (!image?.generationPrompt) return false;
    const nsfwKeywords = ['naked', 'nude', 'lingerie', 'bikini', 'underwear', 'revealing', 'bodysuit'];
    const promptText = String(image.generationPrompt).toLowerCase();
    return nsfwKeywords.some(keyword => promptText.includes(keyword));
  };

  const dedupeCommaTags = (input: string) => {
    const parts = String(input || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const result: string[] = [];
    for (const part of parts) {
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(part);
    }
    return result.join(', ');
  };

  const joinAndDedupeTags = (...pieces: Array<string | undefined | null | false>) => {
    const joined = pieces
      .filter((piece): piece is string => typeof piece === 'string' && piece.trim().length > 0)
      .join(', ');
    return dedupeCommaTags(joined);
  };

  const buildSpecialPrompt = (userPrompt: string, style: CharacterStyle) => {
    const cleaned = String(userPrompt || '').trim();
    if (!cleaned) return '';

    if (specialRawPrompt) {
      return cleaned;
    }

    const isCentaur = /(^|\b)(centaur|taur)(\b|$)/i.test(cleaned);
    const centaurAnatomy = isCentaur ? 'equine lower body, horse body, four legs, four hooves' : '';

    const stylePrefixes: Record<CharacterStyle, string> = {
      [CharacterStyle.ANIME]:
        'high quality, best quality, masterpiece, highres, very aesthetic, absurdres, anime art, illustration, clean lineart, vibrant colors',
      [CharacterStyle.ANIME_ILLUSTRIOUS]:
        'masterpiece, best quality, amazing quality, absurdres, high quality, best quality, amazing quality, anime art, illustration, clean lineart, vibrant colors',
      [CharacterStyle.MOE_FUSSION]:
        'masterpiece, best quality, 1girl, solo, full body',
      [CharacterStyle.REALISTIC]:
        'high quality, best quality, masterpiece, highres, very aesthetic, absurdres, photorealistic, professional photography, high resolution',
      [CharacterStyle.ARTISTIC]:
        'high quality, best quality, masterpiece, highres, very aesthetic, absurdres, artistic, digital painting, concept art, detailed',
      [CharacterStyle.SPECIAL]:
        'masterpiece, best quality, amazing quality, absurdres,',
    };

    const focusPrefixes: Record<typeof specialFocus, string> = {
      eyes: 'extreme close-up, single face, single set of eyes, eyes only, detailed irises, glossy highlights, symmetrical eyes, soft shading',
      face: 'close-up portrait, single face, detailed face, skin texture, sharp focus',
      scene: 'wide shot, environment, cinematic lighting, depth of field',
      object: 'product shot, centered composition, sharp focus, studio lighting',
      custom: '',
    };

    const pieces = [stylePrefixes[style], focusPrefixes[specialFocus], centaurAnatomy, cleaned].filter(Boolean);
    return dedupeCommaTags(pieces.join(', '));
  };

  const buildSpecialNegativePrompt = (userNegativePrompt: string) => {
    const base =
      'low quality, worst quality, jpeg artifacts, watermark, signature, text, blurry, duplicate, duplicates, multiple faces, two faces, twins, extra face, extra head, extra eyes, extra mouth, extra nose';
    const cleaned = String(userNegativePrompt || '').trim();

    const isCentaur = /(^|\b)(centaur|taur)(\b|$)/i.test(String(specialPrompt || '').trim());
    const centaurNegative = isCentaur
      ? 'bipedal, human legs, human lower body, only two legs, two-legged centaur, missing hind legs, missing horse legs'
      : '';

    return dedupeCommaTags(joinAndDedupeTags(base, centaurNegative, cleaned));
  };

  const handleSpecialGenerate = async () => {
    if (!specialPrompt.trim()) return;

    setIsSpecialGenerating(true);
    try {
      const { automatic1111API } = await import('@/lib/automatic1111');

      const isConnected = await automatic1111API.checkConnection();
      if (!isConnected) {
        throw new Error('Automatic1111 is not running or not accessible');
      }

      const resolvedModel = automatic1111API.getModelForStyle(generationSettings.style);
      const dimensions = getDimensionsFromAspectRatio(generationSettings.aspectRatio || 'portrait', resolvedModel);

      const modelSwitched = await automatic1111API.switchModel(resolvedModel);
      if (!modelSwitched) {
        console.warn(`Failed to switch to model: ${resolvedModel}, using current model`);
      }

      const finalPrompt = buildSpecialPrompt(specialPrompt, generationSettings.style);
      const finalNegativePrompt = buildSpecialNegativePrompt(specialNegativePrompt);

      const payload = {
        prompt: finalPrompt,
        negative_prompt: finalNegativePrompt,
        width: dimensions.width,
        height: dimensions.height,
        steps: generationSettings.steps || 30,
        cfg_scale: generationSettings.cfgScale || 8,
        sampler_name: generationSettings.sampler || 'DPM++ 2M Karras',
        seed: generationSettings.seed === -1 ? -1 : generationSettings.seed,
        model_name: resolvedModel,
        override_settings: {
          sd_model_checkpoint: resolvedModel,
        },
      };

      const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';
      const response = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Automatic1111 API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      const base64Image = result.images[0];
      let targetCharacterId = null;

      try {
        const charactersResult = await characterAPI.getCharacters();
        if (charactersResult.success && charactersResult.data) {
          const existingGalleryChar = charactersResult.data.find((char: any) => char.name === 'Gallery Generated');

          if (existingGalleryChar) {
            targetCharacterId = existingGalleryChar.id;
          } else {
            const galleryCharacter = {
              name: 'Gallery Generated',
              currentStep: 7,
              identity: {
                age: 25,
                ethnicity: Ethnicity.MIXED_EXOTIC,
                skinTone: '#ffe0bd',
              },
              body: {
                height: Height.AVERAGE,
                physique: Physique.ATHLETIC,
                chestSize: ChestSize.AVERAGE,
                buttSize: ButtSize.AVERAGE,
              },
              appearance: {
                hairStyle: HairStyle.STRAIGHT,
                hairColor: HairColor.BLACK,
                eyeColor: EyeColor.BLUE,
                eyeType: EyeType.NORMAL,
                clothing: ClothingStyle.CASUAL,
                environment: Environment.LIBRARY,
              },
              personality: {
                archetype: 'balanced',
                isCustom: false,
                traits: {
                  submissiveDominant: 5,
                  insecureConfident: 5,
                  coldPassionate: 5,
                  reservedOutgoing: 5,
                  seriousPlayful: 5,
                },
              },
              generation: {
                style: generationSettings.style as any,
                model: resolvedModel as any,
              },
              isGalleryOnly: true,
            };

            const createResult = await characterAPI.createCharacter(galleryCharacter);
            if (createResult.success && createResult.data) {
              targetCharacterId = createResult.data.id;
            }
          }
        }
      } catch (error) {
        console.error('Error with gallery character:', error);
      }

      if (!targetCharacterId) {
        throw new Error('Could not create or find gallery character for image generation');
      }

      const uploadResult = await characterAPI.addCharacterImage(
        targetCharacterId,
        base64Image,
        finalPrompt,
        resolvedModel,
        generationSettings.style
      );

      if (!uploadResult.success) {
        throw new Error('Failed to add generated image to gallery');
      }

      await fetchAllCharacterImages(true);
      setSpecialPrompt('');
    } catch (error) {
      console.error('Failed to generate image:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to generate image. Please check Automatic1111 and try again.',
      });
    } finally {
      setIsSpecialGenerating(false);
    }
  };

  const toggleSelectImage = (imageId: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  };

  const handleDeleteSelectedImages = async () => {
    const ids = Array.from(selectedImageIds);
    if (ids.length === 0) return;

    const ok = await dialog.confirm({
      title: `Delete ${ids.length} image${ids.length === 1 ? '' : 's'}?`,
      message: 'This will permanently delete the selected images from the gallery. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    try {
      const selected = new Set(ids);
      const galleryOnlyByCharacter = new Map<string, string[]>();

      for (const img of communityImages) {
        if (!img?.id || !selected.has(img.id)) continue;
        if (img.isGalleryOnly && img.characterId) {
          const existing = galleryOnlyByCharacter.get(img.characterId) || [];
          existing.push(img.id);
          galleryOnlyByCharacter.set(img.characterId, existing);
        }
      }

      const results = await Promise.all(ids.map((id) => characterAPI.deleteCharacterImageFromGallery(id)));
      const allOk = results.every((r) => r.success);
      if (!allOk) throw new Error('Failed to delete one or more images');

      await Promise.all(
        Array.from(galleryOnlyByCharacter.keys()).map(async (characterId) => {
          const remaining = communityImages.filter(
            (img) => img.characterId === characterId && !selected.has(img.id)
          );
          if (remaining.length === 0) {
            await characterAPI.deleteCharacter(characterId);
          }
        })
      );

      await fetchAllCharacterImages(true);
      setSelectedImageIds(new Set());
      setIsSelectMode(false);
      await dialog.alert({ title: 'Deleted', message: `${ids.length} image${ids.length === 1 ? '' : 's'} deleted successfully` });
    } catch (error) {
      console.error('Error deleting selected images:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to delete selected images. Please try again.',
      });
    }
  };

  const filteredImages = communityImages.filter((img) => {
    if (filter === 'all') return true;
    if (filter === 'sfw') return !isNSFWImage(img);
    if (filter === 'nsfw') return isNSFWImage(img);
    if (filter === 'gallery') return img.isGalleryOnly;
    return true;
  }).sort((a, b) => {
    // Sort by createdAt (newest first) - handle undefined dates by putting them at the end
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
  });

  // Generation settings
  const [generationSettings, setGenerationSettings] = useState({
    style: CharacterStyle.REALISTIC,
    quality: 'standard',
    aspectRatio: 'square',
    steps: 20,
    cfgScale: 7,
    sampler: 'DPM++ 2M Karras',
    negativePrompt: '',
    seed: -1
  });

  useEffect(() => {
    const { automatic1111API } = require('@/lib/automatic1111');
    const model = automatic1111API.getModelForStyle(generationSettings.style);
    if (model && MODEL_DEFAULT_SETTINGS[model]) {
      setGenerationSettings(prev => ({
        ...prev,
        ...MODEL_DEFAULT_SETTINGS[model]
      }));
    }
  }, [generationSettings.style]);

  // Fetch all character images on component mount
  useEffect(() => {
    fetchAllCharacterImages(true);
  }, []);

  useEffect(() => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(0);
    }
  }, [filter]);

  useEffect(() => {
    if (!isSelectMode) {
      setSelectedImageIds(new Set());
      return;
    }

    if (isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(0);
    }
  }, [isSelectMode, isZoomed]);

  useEffect(() => {
    if (zoomedImageIndex >= filteredImages.length && filteredImages.length > 0) {
      setZoomedImageIndex(0);
    }
  }, [filteredImages, zoomedImageIndex]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (isSidebarOpen && !target.closest('.sidebar-container') && !target.closest('.sidebar-toggle-button')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in event ? event.matches : mediaQuery.matches;
      setIsDesktop(matches);
      if (matches) {
        setIsSidebarOpen(false);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const fetchAllCharacterImages = async (reset = false) => {
    try {
      const pageSize = 60;
      const nextOffset = reset ? 0 : imagesOffset;

      if (reset) {
        setIsLoadingImages(true);
        setImagesOffset(0);
        setHasMoreImages(true);
      } else {
        setIsLoadingMoreImages(true);
      }

      const result = await characterAPI.getAllCharacterImagesPaged({
        limit: pageSize,
        offset: nextOffset,
      });

      const page = result.success && Array.isArray(result.data) ? result.data : [];
      if (result.success) {
        setCommunityImages((prev) => (reset ? page : [...prev, ...page]));
        setImagesOffset(nextOffset + page.length);
        setHasMoreImages(page.length === pageSize);
      } else {
        console.error('Failed to fetch images:', result.error);
        if (reset) {
          setCommunityImages([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch community images:', error);
      if (reset) {
        setCommunityImages([]);
      }
    } finally {
      setIsLoadingImages(false);
      setIsLoadingMoreImages(false);
    }
  };

  const handleLoadMoreImages = async () => {
    if (isLoadingImages || isLoadingMoreImages || !hasMoreImages) return;
    await fetchAllCharacterImages(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1920) return 5;
      if (w >= 1280) return 4;
      if (w >= 768) return 3;
      if (w >= 640) return 2;
      return 1;
    };

    const update = () => setMasonryColumns(compute());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const masonryColumnedImages = useMemo(() => {
    const cols = Math.max(1, masonryColumns);
    const buckets: any[][] = Array.from({ length: cols }, () => []);
    filteredImages.forEach((img, idx) => {
      buckets[idx % cols].push(img);
    });
    return buckets;
  }, [filteredImages, masonryColumns]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;
    if (!hasMoreImages) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        handleLoadMoreImages();
      },
      {
        root: null,
        rootMargin: '1200px 0px 1200px 0px',
        threshold: 0,
      }
    );

    obs.observe(node);
    return () => {
      obs.disconnect();
    };
  }, [hasMoreImages, isLoadingImages, isLoadingMoreImages, imagesOffset, masonryColumns]);

  const handleImageClick = (index: number) => {
    if (index >= 0 && index < filteredImages.length) {
      setZoomedImageIndex(index);
      setIsZoomed(true);
    }
  };

  const handlePreviousImage = () => {
    setZoomedImageIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setZoomedImageIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteImage = async (imageId: string) => {
    const ok = await dialog.confirm({
      title: 'Delete image?',
      message: 'Are you sure you want to delete this image? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    try {
      // Find the image to get character information
      const imageToDelete = communityImages.find(img => img.id === imageId);
      
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);

      if (result.success) {
        // Check if this was a gallery-only character and if there are no more images
        if (imageToDelete?.isGalleryOnly && imageToDelete.characterId) {
          // Check if this was the last image for this character
          const remainingImages = communityImages.filter(img => 
            img.characterId === imageToDelete.characterId && img.id !== imageId
          );
          
          if (remainingImages.length === 0) {
            // This was the last image, delete the character
            await characterAPI.deleteCharacter(imageToDelete.characterId);
          }
        }
        
        // Refresh the gallery to remove the deleted image
        await fetchAllCharacterImages(true);
        await dialog.alert({ title: 'Deleted', message: 'Image deleted successfully' });
      } else {
        console.error('Failed to delete image:', result.error);
        await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      await dialog.alert({
        title: 'Error',
        message: 'An error occurred while deleting the image. Check console for details.',
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Import Automatic1111 API dynamically to avoid SSR issues
      const { automatic1111API } = await import('@/lib/automatic1111');

      // Check if Automatic1111 is available
      const isConnected = await automatic1111API.checkConnection();
      if (!isConnected) {
        throw new Error('Automatic1111 is not running or not accessible');
      }

      // Enhanced prompt function to match character generation quality
      const getEnhancedPrompt = (userPrompt: string, style: CharacterStyle) => {
        const stylePrompts: Record<CharacterStyle, string> = {
          [CharacterStyle.ANIME]:
            'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, anime art, illustration, clean lineart, vibrant colors, solo, full body',
          [CharacterStyle.ANIME_ILLUSTRIOUS]:
            'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, anime art, illustration, clean lineart, vibrant colors, solo, full body',
          [CharacterStyle.MOE_FUSSION]:
            'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, anime art, illustration, clean lineart, vibrant colors, solo, full body',
          [CharacterStyle.REALISTIC]:
            'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, photorealistic, professional photography, sharp focus, solo, full body',
          [CharacterStyle.ARTISTIC]:
            'masterpiece, best quality, highres, very aesthetic, absurdres, lazypos, digital painting, concept art, detailed, solo, full body',
          [CharacterStyle.SPECIAL]: 'masterpiece, best quality, amazing quality, absurdres,',
        };

        const stylePrefix = stylePrompts[style] || stylePrompts[CharacterStyle.REALISTIC];

        const cleaned = String(userPrompt || '').trim();
        const isCentaur = /(^|\b)(centaur|taur)(\b|$)/i.test(cleaned);
        const centaurAnatomy = isCentaur ? 'equine lower body, horse body, four legs, four hooves' : '';

        return joinAndDedupeTags(stylePrefix, centaurAnatomy, cleaned);
      };

      const resolvedModel = automatic1111API.getModelForStyle(generationSettings.style);
      const dimensions = getDimensionsFromAspectRatio(generationSettings.aspectRatio || 'portrait', resolvedModel);

      const modelSwitched = await automatic1111API.switchModel(resolvedModel);
      if (!modelSwitched) {
        console.warn(`Failed to switch to model: ${resolvedModel}, using current model`);
      }

      const cleanedPrompt = String(prompt || '').trim();
      const isCentaur = /(^|\b)(centaur|taur)(\b|$)/i.test(cleanedPrompt);

      const baseNegative = joinAndDedupeTags(
        'lazyneg',
        'low quality',
        'worst quality',
        'jpeg artifacts',
        'watermark',
        'signature',
        'text',
        'blurry',
        'bad anatomy',
        'bad hands',
        'missing fingers',
        'extra fingers',
        'extra digit',
        'fewer digits',
        'extra limbs',
        'missing limbs',
        'fused fingers',
        'too many fingers',
        'cropped',
        'out of frame'
      );

      const centaurNegative = isCentaur
        ? 'bipedal, human legs, human lower body, only two legs, two-legged centaur, missing hind legs, missing horse legs'
        : '';

      const finalNegativePrompt = joinAndDedupeTags(
        baseNegative,
        centaurNegative,
        generationSettings.negativePrompt || ''
      );

      const payload = {
        prompt: getEnhancedPrompt(prompt, generationSettings.style),
        negative_prompt: finalNegativePrompt,
        width: dimensions.width,
        height: dimensions.height,
        steps: generationSettings.steps || 30,
        cfg_scale: generationSettings.cfgScale || 8,
        sampler_name: generationSettings.sampler || 'DPM++ 2M Karras',
        seed: generationSettings.seed === -1 ? -1 : generationSettings.seed,
        model_name: resolvedModel,
        override_settings: {
          sd_model_checkpoint: resolvedModel,
        },
      };

      console.log('Generating image with prompt:', prompt);

      const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860';
      const response = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Automatic1111 API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('No images returned from Automatic1111');
      }

      const base64Image = result.images[0];

      let targetCharacterId = null;

      try {
        const charactersResult = await characterAPI.getCharacters();
        if (charactersResult.success && charactersResult.data) {
          const existingGalleryChar = charactersResult.data.find((char: any) =>
            char.name === 'Gallery Generated'
          );

          if (existingGalleryChar) {
            targetCharacterId = existingGalleryChar.id;
          } else {
            const galleryCharacter = {
              name: 'Gallery Generated',
              currentStep: 7,
              identity: {
                age: 25,
                ethnicity: Ethnicity.MIXED_EXOTIC,
                skinTone: '#ffe0bd'
              },
              body: {
                height: Height.AVERAGE,
                physique: Physique.ATHLETIC,
                chestSize: ChestSize.AVERAGE,
                buttSize: ButtSize.AVERAGE
              },
              appearance: {
                hairStyle: HairStyle.STRAIGHT,
                hairColor: HairColor.BLACK,
                eyeColor: EyeColor.BLUE,
                eyeType: EyeType.NORMAL,
                clothing: ClothingStyle.CASUAL,
                environment: Environment.LIBRARY
              },
              personality: {
                archetype: 'balanced',
                isCustom: false,
                traits: {
                  submissiveDominant: 5,
                  insecureConfident: 5,
                  coldPassionate: 5,
                  reservedOutgoing: 5,
                  seriousPlayful: 5
                }
              },
              generation: {
                style: generationSettings.style as any,
                model: resolvedModel as any
              },
              isGalleryOnly: true
            };

            const createResult = await characterAPI.createCharacter(galleryCharacter);
            if (createResult.success && createResult.data) {
              targetCharacterId = createResult.data.id;
            }
          }
        }
      } catch (error) {
        console.error('Error with gallery character:', error);
      }

      if (!targetCharacterId) {
        throw new Error('Could not create or find gallery character for image generation');
      }

      const uploadResult = await characterAPI.addCharacterImage(
        targetCharacterId,
        base64Image,
        prompt,
        resolvedModel,
        generationSettings.style
      );

      if (!uploadResult.success) {
        throw new Error('Failed to add generated image to gallery');
      }

      await fetchAllCharacterImages(true);
      setPrompt('');

      console.log('Image generated and added to gallery successfully');
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSidebarContent = () => (
    <div className="space-y-4">
      <div className="bg-dark-800/40 backdrop-blur-sm border border-dark-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Generate</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
          placeholder="Describe what you want to generate..."
          disabled={isGenerating}
        />

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="mt-3 w-full bg-pink-600 hover:bg-pink-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white font-semibold h-10 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <div className="bg-dark-800/40 backdrop-blur-sm border border-dark-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Special Lab</h2>
          <button
            onClick={() => setSpecialOpen((prev) => !prev)}
            className="text-dark-300 hover:text-white transition-colors"
          >
            {specialOpen ? 'Hide' : 'Show'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {specialOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSpecialFocus('eyes')}
                  className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-xs transition-colors ${specialFocus === 'eyes'
                    ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                    : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                    }`}
                  type="button"
                >
                  <Eye className="w-4 h-4" />
                  Eyes
                </button>
                <button
                  onClick={() => setSpecialFocus('face')}
                  className={`h-8 px-3 rounded-lg border text-xs transition-colors ${specialFocus === 'face'
                    ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                    : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                    }`}
                  type="button"
                >
                  Face
                </button>
                <button
                  onClick={() => setSpecialFocus('scene')}
                  className={`h-8 px-3 rounded-lg border text-xs transition-colors ${specialFocus === 'scene'
                    ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                    : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                    }`}
                  type="button"
                >
                  Scene
                </button>
                <button
                  onClick={() => setSpecialFocus('object')}
                  className={`h-8 px-3 rounded-lg border text-xs transition-colors ${specialFocus === 'object'
                    ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                    : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                    }`}
                  type="button"
                >
                  Object
                </button>
                <button
                  onClick={() => setSpecialFocus('custom')}
                  className={`h-8 px-3 rounded-lg border text-xs transition-colors ${specialFocus === 'custom'
                    ? 'bg-pink-600/20 border-pink-500/40 text-pink-200'
                    : 'bg-dark-900/40 border-dark-700 text-dark-200 hover:bg-dark-800/60'
                    }`}
                  type="button"
                >
                  Custom
                </button>
              </div>

              <textarea
                value={specialPrompt}
                onChange={(e) => setSpecialPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-dark-950/60 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                placeholder="Describe exactly what you want..."
                disabled={isSpecialGenerating}
              />

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-dark-200 select-none">
                  <input
                    type="checkbox"
                    checked={specialRawPrompt}
                    onChange={(e) => setSpecialRawPrompt(e.target.checked)}
                    className="accent-pink-500"
                  />
                  Raw prompt (no prefix)
                </label>
              </div>

              <textarea
                value={specialNegativePrompt}
                onChange={(e) => setSpecialNegativePrompt(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-dark-950/40 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                placeholder="Optional negative prompt"
                disabled={isSpecialGenerating}
              />

              <button
                onClick={handleSpecialGenerate}
                disabled={!specialPrompt.trim() || isSpecialGenerating}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white font-semibold h-10 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isSpecialGenerating ? 'Generating...' : 'Generate'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-dark-800/40 backdrop-blur-sm border border-dark-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Settings</h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Style</label>
            <select
              value={generationSettings.style}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, style: e.target.value as CharacterStyle }))}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value={CharacterStyle.REALISTIC}>Realistic</option>
              <option value={CharacterStyle.ANIME}>Anime</option>
              <option value={CharacterStyle.ANIME_ILLUSTRIOUS}>Anime Illustrative</option>
              <option value={CharacterStyle.MOE_FUSSION}>Moe Fussion</option>
              <option value={CharacterStyle.ARTISTIC}>Artistic</option>
              <option value={CharacterStyle.SPECIAL}>Special</option>
            </select>
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Quality</label>
            <select
              value={generationSettings.quality}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, quality: e.target.value }))}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Aspect Ratio</label>
            <select
              value={generationSettings.aspectRatio}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, aspectRatio: e.target.value }))}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              {getAspectRatioOptionsForModel(require('@/lib/automatic1111').automatic1111API.getModelForStyle(generationSettings.style)).map((option) => {
                const { automatic1111API } = require('@/lib/automatic1111');
                const selectedModel = automatic1111API.getModelForStyle(generationSettings.style);
                const dims = getDimensionsFromAspectRatio(option.id, selectedModel);
                return (
                  <option key={option.id} value={option.id}>
                    {option.label} ({dims.width}x{dims.height})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Steps: {generationSettings.steps}</label>
            <input
              type="range"
              min="10"
              max="50"
              value={generationSettings.steps}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, steps: parseInt(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">CFG Scale: {generationSettings.cfgScale}</label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={generationSettings.cfgScale}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, cfgScale: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Sampler</label>
            <select
              value={generationSettings.sampler}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, sampler: e.target.value }))}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
              <option value="Euler a">Euler a</option>
              <option value="Euler">Euler</option>
              <option value="DDIM">DDIM</option>
            </select>
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Seed</label>
            <input
              type="number"
              value={generationSettings.seed}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, seed: parseInt(e.target.value) || -1 }))}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="-1 for random"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1">Negative Prompt</label>
            <textarea
              value={generationSettings.negativePrompt}
              onChange={(e) => setGenerationSettings(prev => ({ ...prev, negativePrompt: e.target.value }))}
              rows={3}
              className="w-full p-2 text-sm bg-dark-900 text-white rounded-lg border border-dark-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
              placeholder="What to avoid in the image..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />

        {/* Sidebar Toggle Button */}
        {!isDesktop && (
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
            }}
            className="sidebar-toggle-button fixed left-4 top-20 z-[60] w-10 h-10 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg flex items-center justify-center text-pink-400 hover:text-pink-300 hover:bg-dark-700/90 transition-all duration-300"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Collapsible Sidebar */}
        <AnimatePresence>
          {!isDesktop && isSidebarOpen && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="sidebar-container fixed left-0 top-16 bottom-0 w-[360px] z-50 bg-dark-900 shadow-2xl"
            >
              <div className="h-full overflow-y-auto px-4 py-6">
                {renderSidebarContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-nowrap min-h-[calc(100vh-4rem)]">
          {/* Desktop Sidebar */}
          <motion.div
            className="hidden lg:block bg-dark-900/40 backdrop-blur-md border-r border-dark-800 overflow-hidden shrink-0 sticky top-16 self-start"
            style={{ height: 'calc(100vh - 4rem)' }}
            animate={{ width: isDesktopSidebarCollapsed ? 0 : 360 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative h-full">
              <button
                onClick={() => setIsDesktopSidebarCollapsed(true)}
                className="sidebar-toggle-button absolute right-4 top-4 z-10 w-10 h-10 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg flex items-center justify-center text-pink-400 hover:text-pink-300 hover:bg-dark-700/90 transition-all duration-300"
                style={{ opacity: isDesktopSidebarCollapsed ? 0 : 1, pointerEvents: isDesktopSidebarCollapsed ? 'none' : 'auto' }}
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="h-full overflow-y-auto px-2 py-6 pt-16">
                {renderSidebarContent()}
              </div>
            </div>
          </motion.div>

          {isDesktop && isDesktopSidebarCollapsed && !isZoomed && (
            <button
              onClick={() => setIsDesktopSidebarCollapsed(false)}
              className="sidebar-toggle-button fixed left-6 top-24 z-[60] w-10 h-10 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg hidden lg:flex items-center justify-center text-pink-400 hover:text-pink-300 hover:bg-dark-700/90 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <motion.div
            className={`flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'lg:pl-20' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`w-full ${isDesktopSidebarCollapsed ? 'max-w-none' : 'max-w-none'} mx-auto`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex items-center justify-between gap-4 w-full">
                  <h1 className="text-3xl font-bold text-white">Gallery</h1>

                  <div className="flex items-center gap-3 justify-end">
                    {isSelectMode ? (
                      <>
                        <button
                          onClick={handleDeleteSelectedImages}
                          disabled={selectedImageIds.size === 0}
                          className="h-10 px-4 rounded-lg border transition-colors bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Delete ({selectedImageIds.size})
                        </button>
                        <button
                          onClick={() => setIsSelectMode(false)}
                          className="h-10 px-4 rounded-lg border transition-colors bg-dark-800/50 border-dark-700 text-dark-200 hover:text-white hover:bg-dark-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsSelectMode(true)}
                        className="h-10 px-4 rounded-lg border transition-colors bg-dark-800/50 border-dark-700 text-dark-200 hover:text-white hover:bg-dark-700"
                      >
                        Select
                      </button>
                    )}

                    <button
                      onClick={toggleBlurNSFW}
                      className={`h-10 px-4 rounded-lg border transition-colors ${blurNSFW
                        ? 'bg-pink-600/20 border-pink-500/30 text-pink-200'
                        : 'bg-dark-800/50 border-dark-700 text-dark-200 hover:text-white hover:bg-dark-700'
                        }`}
                    >
                      Blur NSFW: {blurNSFW ? 'On' : 'Off'}
                    </button>

                    <div className="inline-flex rounded-lg bg-dark-800/50 border border-dark-700 p-1">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${filter === 'all'
                          ? 'bg-pink-600 text-white'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('sfw')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${filter === 'sfw'
                          ? 'bg-pink-600 text-white'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                          }`}
                      >
                        SFW
                      </button>
                      <button
                        onClick={() => setFilter('gallery')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${filter === 'gallery'
                          ? 'bg-purple-600 text-white'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                          }`}
                      >
                        Gallery
                      </button>
                      <button
                        onClick={() => setFilter('nsfw')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${filter === 'nsfw'
                          ? 'bg-pink-600 text-white'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                          }`}
                      >
                        NSFW
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800/30 backdrop-blur-sm border border-dark-700 rounded-xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-8">Community Images</h2>

                {isLoadingImages ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-600/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-pink-500/30">
                      <svg className="animate-spin h-10 w-10 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-dark-200 mb-3">Loading Images...</h3>
                    <p className="text-dark-400 max-w-md mx-auto">
                      Fetching images from all characters...
                    </p>
                  </div>
                ) : communityImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500/10 to-pink-600/10 rounded-3xl flex items-center justify-center mb-8 border border-pink-500/20 relative group">
                      <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <svg className="w-12 h-12 text-pink-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">No Discoveries Yet</h3>
                    <p className="text-dark-400 max-w-sm mx-auto leading-relaxed mb-8">
                      Your gallery is waiting for its first masterpiece. Generate some images or create characters to start your collection.
                    </p>
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-95"
                    >
                      Start Generating
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 sm:gap-4">
                    {masonryColumnedImages.map((col, colIdx) => (
                      <div key={`col-${colIdx}`} className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4">
                        {col.map((image, indexInCol) => {
                          const index = colIdx + indexInCol * masonryColumnedImages.length;
                          const isSelected = !!image?.id && selectedImageIds.has(image.id);
                          return (
                            <div
                              key={image.id || `${colIdx}-${indexInCol}`}
                              className="group relative overflow-hidden rounded-xl bg-dark-900/50 border border-dark-600/50 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer"
                              onClick={() => {
                                if (isSelectMode) {
                                  if (image?.id) toggleSelectImage(image.id);
                                  return;
                                }
                                handleImageClick(index);
                              }}
                            >
                              {isSelectMode && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (image?.id) toggleSelectImage(image.id);
                                  }}
                                  className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-lg border flex items-center justify-center backdrop-blur-md transition-colors ${isSelected
                                    ? 'bg-pink-600/90 border-pink-500/40 text-white'
                                    : 'bg-dark-900/70 border-dark-700/60 text-white/70 hover:bg-dark-800'
                                    }`}
                                  aria-label={isSelected ? 'Deselect image' : 'Select image'}
                                >
                                  {isSelected ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-white/40" />
                                  )}
                                </button>
                              )}

                              <div className="relative overflow-hidden">
                                <img
                                  src={image.imageUrl}
                                  alt={`Generated image ${index + 1}`}
                                  className={`w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 ${blurNSFW && isNSFWImage(image) ? 'blur-md' : ''}`}
                                  loading={index < 12 ? 'eager' : 'lazy'}
                                />
                              </div>

                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                  <p className="text-white text-sm font-medium truncate mb-2">{image.characterName || 'Unknown'}</p>
                                  <div className="flex gap-2">
                                    {!isSelectMode && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteImage(image.id);
                                        }}
                                        className="flex-1 bg-red-500/80 hover:bg-red-600/90 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingImages && filteredImages.length > 0 && (
                  <div className="mt-8 flex items-center justify-center">
                    <button
                      onClick={handleLoadMoreImages}
                      disabled={!hasMoreImages || isLoadingMoreImages}
                      className="px-6 py-3 rounded-2xl border border-dark-700 bg-dark-900/40 text-dark-200 hover:bg-dark-800/60 hover:border-pink-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMoreImages ? 'Loading…' : hasMoreImages ? 'Load more' : 'All loaded'}
                    </button>
                  </div>
                )}
              </div>

              <div ref={loadMoreSentinelRef} className="h-1" />
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isZoomed && (
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
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative h-full flex items-center justify-center p-4"
              >
                <div
                  className="relative max-w-6xl max-h-[95vh] w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.img
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    src={filteredImages[zoomedImageIndex]?.imageUrl}
                    alt={`Zoomed image ${zoomedImageIndex + 1}`}
                    className={`max-w-full max-h-full object-contain rounded-lg ${blurNSFW && filteredImages[zoomedImageIndex] && isNSFWImage(filteredImages[zoomedImageIndex]) ? 'blur-lg' : ''
                      }`}
                  />

                  {filteredImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviousImage();
                        }}
                        className="fixed left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors z-50"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="fixed right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors z-50"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
