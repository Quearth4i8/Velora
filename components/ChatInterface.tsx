'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, ClothingStyle, Environment } from '@/lib/types';
import { CharacterGalleryComponent } from './CharacterGallery';
import { useRouter } from 'next/navigation';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';

interface ChatInterfaceProps {
  character: CharacterDraft;
  onBack: () => void;
}

export function ChatInterface({ character, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      characterId: currentCharacter.id || 'temp',
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate character response
    setTimeout(() => {
      const characterMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        characterId: currentCharacter.id || 'temp',
        content: generateCharacterResponse(inputMessage, currentCharacter),
        sender: 'character',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleCharacterUpdate = (updatedCharacter: CharacterDraft) => {
    setCurrentCharacter(updatedCharacter);
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
    
    // Add a message about the outfit change
    const outfitMessage: ChatMessage = {
      id: Date.now().toString(),
      characterId: currentCharacter.id || 'temp',
      content: `*${currentCharacter.name || 'The character'} changes into a ${clothing} outfit*`,
      sender: 'character',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, outfitMessage]);
  };

  const handleCustomClothing = async (customOutfit: string) => {
    // Update character's clothing with custom outfit
    const updatedCharacter = {
      ...currentCharacter,
      appearance: {
        ...currentCharacter.appearance,
        clothing: customOutfit as ClothingStyle
      }
    };
    
    setCurrentCharacter(updatedCharacter);
    setShowWardrobe(false);
    
    // Add a message about custom outfit change
    const outfitMessage: ChatMessage = {
      id: Date.now().toString(),
      characterId: currentCharacter.id || 'temp',
      content: `*${currentCharacter.name || 'The character'} changes into a custom outfit: ${customOutfit}*`,
      sender: 'character',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, outfitMessage]);
  };

  const handleWardrobeImageGeneration = async () => {
    if (!currentCharacter.id) return;
    
    try {
      setIsTyping(true);
      setShowWardrobe(false);
      
      // Generate new image with current clothing (including NSFW options)
      const imageUrl = await automatic1111API.generateCharacterImage(currentCharacter);
      
      if (imageUrl) {
        const generationMessage: ChatMessage = {
          id: Date.now().toString(),
          characterId: currentCharacter.id || 'temp',
          content: `*New image generated with ${currentCharacter.appearance?.clothing || 'current'} outfit*`,
          sender: 'character',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, generationMessage]);
      }
    } catch (error) {
      console.error('Error generating wardrobe image:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
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
    
    // Add a message about the environment change
    const environmentMessage: ChatMessage = {
      id: Date.now().toString(),
      characterId: currentCharacter.id || 'temp',
      content: `*The scene changes to a ${environment.replace('_', ' ')}*`,
      sender: 'character',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, environmentMessage]);
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
          {currentCharacter.generation?.generatedImage && (
            <div className="absolute right-0 top-0 w-[450px] h-full z-10 lg:opacity-100 lg:translate-x-0 opacity-0 translate-x-full transition-all duration-500 ease-in-out">
              <div className="relative group h-full p-4">
                <div className="relative h-full overflow-hidden rounded-3xl border-2 border-pink-500/20 shadow-2xl shadow-pink-500/10">
                  <img
                    src={currentCharacter.generation.generatedImage}
                    alt="Generated Character"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 right-4">
                    <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
                      <p className="text-white text-lg font-medium">
                        {currentCharacter.name || 'Unnamed Character'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Area - Left Side Only */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-dark-900/30 to-dark-800/30 lg:mr-[450px] mr-0">
            {/* Chat Header */}
            <div className="px-8 py-6 border-b border-dark-700/50 backdrop-blur-sm">
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
                      <div className="text-sm text-pink-400 capitalize">{currentCharacter.personality?.archetype || 'Mysterious'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Empty space to match gallery layout */}
                <div className="w-8 h-8"></div>
              </div>
            </div>

            {/* Messages Area - Scrollable Only */}
            <div className="flex-1 overflow-y-auto p-8">
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
                          className={`px-5 py-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/20'
                              : 'bg-dark-800/50 text-dark-200 border border-dark-700/50 backdrop-blur-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
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
            <div className="p-6 border-t border-dark-700/50 backdrop-blur-sm">
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
              
              {/* Regular Outfits Section */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-pink-300">Regular Outfits</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'casual', label: 'Casual', image: '/images/clothing-casual.jpg', description: 'Everyday wear - comfortable jeans and t-shirt perfect for daily activities' },
                    { id: 'formal', label: 'Formal', image: '/images/clothing-formal.jpg', description: 'Elegant evening wear - sophisticated dress and heels for special occasions' },
                    { id: 'sporty', label: 'Sporty', image: '/images/clothing-sporty.jpg', description: 'Athletic wear - comfortable shorts and sports bra for active lifestyle' },
                    { id: 'elegant', label: 'Elegant', image: '/images/clothing-elegant.jpg', description: 'High fashion - stunning evening gown with jewelry for formal events' },
                    { id: 'cute', label: 'Cute', image: '/images/clothing-cute.jpg', description: 'Adorable style - colorful sundress and sandals for a sweet look' },
                    { id: 'edgy', label: 'Edgy', image: '/images/clothing-edgy.jpg', description: 'Alternative fashion - leather jacket and ripped jeans for bold style' },
                    { id: 'traditional', label: 'Traditional', image: '/images/clothing-traditional.jpg', description: 'Cultural attire - traditional dress with authentic accessories' },
                    { id: 'fantasy', label: 'Fantasy', image: '/images/clothing-fantasy.jpg', description: 'Magical style - mystical robes and enchanting accessories' }
                  ].map((outfit) => (
                    <motion.button
                      key={outfit.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOutfitChange(outfit.id as ClothingStyle)}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                        currentCharacter.appearance?.clothing === outfit.id
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
                        <div className="absolute inset-0 flex items-center justify-center" style={{display: 'none'}}>
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
                    { id: 'lingerie', label: 'Lingerie', image: '/images/clothing-lingerie.jpg', description: 'Intimate apparel - delicate lace lingerie set for romantic moments' },
                    { id: 'naked', label: 'Naked', image: '/images/clothing-naked.jpg', description: 'Natural beauty - completely nude, embracing natural form' },
                    { id: 'bikini', label: 'Bikini', image: '/images/clothing-bikini.jpg', description: 'Beach ready - revealing bikini perfect for sunny days' },
                    { id: 'underwear', label: 'Underwear', image: '/images/clothing-underwear.jpg', description: 'Intimate wear - sexy underwear set for private moments' },
                    { id: 'revealing', label: 'Revealing', image: '/images/clothing-revealing.jpg', description: 'Bold style - daring outfit that shows more skin' },
                    { id: 'bodysuit', label: 'Bodysuit', image: '/images/clothing-bodysuit.jpg', description: 'Form fitting - tight bodysuit that accentuates curves' }
                  ].map((outfit) => (
                    <motion.button
                      key={outfit.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOutfitChange(outfit.id as ClothingStyle)}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                        currentCharacter.appearance?.clothing === outfit.id
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
                        <div className="absolute inset-0 flex items-center justify-center" style={{display: 'none'}}>
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
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g., Victorian gothic dress with lace trim and corset..."
                      className="flex-1 px-4 py-3 bg-dark-800/50 text-white rounded-xl border border-pink-500/50 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 placeholder-pink-400"
                      id="customOutfitInput"
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
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      currentCharacter.appearance?.environment === env
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
    </>
  );
}
