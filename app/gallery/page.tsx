'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import { CharacterStyle, Ethnicity, Height, Physique, ChestSize, ButtSize, HairStyle, EyeType, ClothingStyle, Environment, HairColor, EyeColor } from '@/lib/types';
import { useBlurNSFW } from '@/lib/useBlurNSFW';

export default function GalleryPage() {
  const [filter, setFilter] = useState<'all' | 'sfw' | 'nsfw'>('all');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [communityImages, setCommunityImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const { blurNSFW, toggleBlurNSFW } = useBlurNSFW();

  const isNSFWImage = (image: any): boolean => {
    if (!image?.generationPrompt) return false;
    const nsfwKeywords = ['naked', 'nude', 'lingerie', 'bikini', 'underwear', 'revealing', 'bodysuit'];
    const promptText = String(image.generationPrompt).toLowerCase();
    return nsfwKeywords.some(keyword => promptText.includes(keyword));
  };

  const filteredImages = communityImages.filter((img) => {
    if (filter === 'all') return true;
    if (filter === 'sfw') return !isNSFWImage(img);
    if (filter === 'nsfw') return isNSFWImage(img);
    return true;
  });
  
  // Generation settings
  const [generationSettings, setGenerationSettings] = useState({
    style: CharacterStyle.REALISTIC,
    quality: 'standard',
    aspectRatio: '1:1',
    steps: 20,
    cfgScale: 7,
    sampler: 'DPM++ 2M Karras',
    negativePrompt: '',
    seed: -1
  });

  // Fetch all character images on component mount
  useEffect(() => {
    fetchAllCharacterImages();
  }, []);

  useEffect(() => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomedImageIndex(0);
    }
  }, [filter]);

  useEffect(() => {
    if (zoomedImageIndex >= filteredImages.length && filteredImages.length > 0) {
      setZoomedImageIndex(0);
    }
  }, [filteredImages, zoomedImageIndex]);

  const fetchAllCharacterImages = async () => {
    try {
      setIsLoadingImages(true);
      const result = await characterAPI.getAllCharacterImages();
      
      if (result.success && result.data) {
        setCommunityImages(result.data);
      } else {
        console.error('Failed to fetch images:', result.error);
        setCommunityImages([]);
      }
    } catch (error) {
      console.error('Failed to fetch community images:', error);
      setCommunityImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

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
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);
      
      if (result.success) {
        // Refresh the gallery to remove the deleted image
        await fetchAllCharacterImages();
        alert('Image deleted successfully');
      } else {
        console.error('Failed to delete image:', result.error);
        alert('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('An error occurred while deleting the image. Check console for details.');
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
      const getEnhancedPrompt = (userPrompt: string, style: string) => {
        const stylePrompts = {
          'anime': 'lazypos, masterpiece, best quality, ultra-detailed, high quality anime art, illustration, clean lines, vibrant colors, solo character, single person, only one character',
          'realistic': 'lazypos, masterpiece, best quality, ultra-realistic, photorealistic, professional photography, detailed, high resolution, 8k, solo character, single person, only one character',
          'artistic': 'lazypos, masterpiece, best quality, artistic, digital painting, concept art, detailed, stunning, high quality, solo character, single person, only one character',
        };
        
        const stylePrefix = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.realistic;
        return `${stylePrefix}, ${userPrompt}`;
      };

      const getDimensionsFromAspectRatio = (aspectRatio: string) => {
      switch (aspectRatio) {
        case 'portrait':
        case '9:16':
          return { width: 768, height: 1024 };
        case 'landscape':
        case '16:9':
          return { width: 1024, height: 768 };
        case 'square':
        case '1:1':
          return { width: 896, height: 896 };
        case 'cinematic':
        case '21:9':
          return { width: 832, height: 1216 };
        case 'mobile':
        case '9:19':
          return { width: 720, height: 1280 };
        default:
          return { width: 768, height: 1024 };
      }
    };

      const dimensions = getDimensionsFromAspectRatio(generationSettings.aspectRatio || 'portrait');
      const resolvedModel = automatic1111API.getModelForStyle(generationSettings.style);
      const payload = {
        prompt: getEnhancedPrompt(prompt, generationSettings.style),
        negative_prompt: `lazyneg, ${generationSettings.negativePrompt || 'low quality, worst quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, deformed, disfigured, malformed, mutated, ugly, disgusting, distorted, bad proportions, extra limbs, missing limbs, fused fingers, too many fingers, long neck'}`,
        width: dimensions.width,
        height: dimensions.height,
        steps: generationSettings.steps || 30,
        cfg_scale: generationSettings.cfgScale || 8,
        sampler_name: generationSettings.sampler || 'DPM++ 2M Karras',
        seed: generationSettings.seed === -1 ? -1 : generationSettings.seed,
        model_name: resolvedModel,
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
                ethnicity: Ethnicity.MIXED,
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

      await fetchAllCharacterImages();
      setPrompt('');
      
      console.log('Image generated and added to gallery successfully');
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const SidebarContent = () => (
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
              <option value={CharacterStyle.ARTISTIC}>Artistic</option>
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
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Wide (4:3)</option>
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
        <div className="hidden lg:block fixed left-0 top-16 bottom-0 w-[360px] z-40 bg-dark-900/40 backdrop-blur-md border-r border-dark-800">
          <div className="h-full overflow-y-auto px-4 py-6">
            <SidebarContent />
          </div>
        </div>

        <motion.div
          className="px-4 sm:px-6 lg:px-8 py-8 lg:ml-[360px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Gallery</h1>
              </div>

              <div className="flex justify-center sm:justify-end">
                <div className="inline-flex items-center gap-3">
                  <button
                    onClick={toggleBlurNSFW}
                    className={`h-10 px-4 rounded-lg border transition-colors ${
                      blurNSFW
                        ? 'bg-pink-600/20 border-pink-500/30 text-pink-200'
                        : 'bg-dark-800/50 border-dark-700 text-dark-200 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    Blur NSFW: {blurNSFW ? 'On' : 'Off'}
                  </button>

                  <div className="inline-flex rounded-lg bg-dark-800/50 border border-dark-700 p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      filter === 'all'
                        ? 'bg-pink-600 text-white'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('sfw')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      filter === 'sfw'
                        ? 'bg-pink-600 text-white'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    SFW
                  </button>
                  <button
                    onClick={() => setFilter('nsfw')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      filter === 'nsfw'
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

            <div className="lg:hidden mb-6">
              <SidebarContent />
            </div>

            <div className="bg-dark-800/30 backdrop-blur-sm border border-dark-700 rounded-xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-8">Community Images</h2>

              <div className="masonry-grid">
                  {isLoadingImages ? (
                    <div className="col-span-full text-center py-16">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                        <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    <div className="col-span-full text-center py-16">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 border border-purple-500/30">
                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-dark-200 mb-3">No Images Yet</h3>
                      <p className="text-dark-400 max-w-md mx-auto">
                        No character images found. Generate some images or create characters to see them here.
                      </p>
                    </div>
                  ) : (
                    filteredImages.map((image, index) => (
                      <div
                        key={image.id || index}
                        className="masonry-item group relative overflow-hidden rounded-xl bg-dark-900/50 border border-dark-600/50 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer"
                        onClick={() => handleImageClick(index)}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={image.imageUrl}
                            alt={`Generated image ${index + 1}`}
                            className={`w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 ${blurNSFW && isNSFWImage(image) ? 'blur-md' : ''}`}
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-white text-sm font-medium truncate mb-2">{image.characterName || 'Unknown'}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                }}
                                className="flex-1 bg-red-500/80 hover:bg-red-600/90 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </div>

            <style jsx>{`
              .masonry-grid {
                column-count: 1;
                column-gap: 1rem;
                width: 100%;
              }
              
              .masonry-item {
                break-inside: avoid;
                margin-bottom: 1rem;
                width: 100%;
              }
              
              @media (min-width: 640px) {
                .masonry-grid {
                  column-count: 2;
                  column-gap: 1rem;
                }
                .masonry-item {
                  margin-bottom: 1rem;
                }
              }
              
              @media (min-width: 768px) {
                .masonry-grid {
                  column-count: 3;
                  column-gap: 1.25rem;
                }
                .masonry-item {
                  margin-bottom: 1.25rem;
                }
              }
              
              @media (min-width: 1024px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.5rem;
                }
                .masonry-item {
                  margin-bottom: 1.5rem;
                }
              }
              
              @media (min-width: 1280px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.5rem;
                }
                .masonry-item {
                  margin-bottom: 1.5rem;
                }
              }
              
              @media (min-width: 1536px) {
                .masonry-grid {
                  column-count: 4;
                  column-gap: 1.75rem;
                }
                .masonry-item {
                  margin-bottom: 1.75rem;
                }
              }
            `}</style>
          </div>
        </motion.div>

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
                    className={`max-w-full max-h-full object-contain rounded-lg ${
                      blurNSFW && filteredImages[zoomedImageIndex] && isNSFWImage(filteredImages[zoomedImageIndex]) ? 'blur-lg' : ''
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
