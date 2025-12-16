'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterDraft, ChatMessage, ClothingStyle } from '@/lib/types';
import { CharacterGalleryComponent } from './CharacterGallery';
import { useRouter } from 'next/navigation';

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
            <div className="absolute right-0 top-0 w-[450px] h-full z-10 hidden lg:block">
              <div className="relative group h-full p-4">
                <div className="relative h-full overflow-hidden rounded-3xl border-2 border-purple-500/20 shadow-2xl shadow-purple-500/10">
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
                  className="flex items-center text-dark-400 hover:text-dark-200 transition-colors group"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium">Back to Selection</span>
                </button>
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
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-dark-800/50 text-dark-200 border border-dark-700/50 backdrop-blur-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <div className={`mt-1 text-xs text-dark-500 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
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
                      <div className="bg-dark-800/50 text-dark-200 px-5 py-3 rounded-2xl border border-dark-700/50 backdrop-blur-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-5 py-3 bg-dark-800/50 text-dark-200 rounded-2xl border border-dark-700/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm placeholder-dark-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">
                      Press Enter to send
                    </div>
                  </div>
                  
                  {/* Gallery Button */}
                  <button
                    onClick={() => setShowGallery(true)}
                    className="px-4 py-3 bg-dark-800/50 text-purple-300 rounded-2xl border border-purple-500/30 hover:bg-purple-600/20 transition-all duration-200 flex items-center justify-center"
                    title="View Gallery"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Wardrobe Button */}
                  <button
                    onClick={() => setShowWardrobe(true)}
                    className="px-4 py-3 bg-dark-800/50 text-pink-300 rounded-2xl border border-pink-500/30 hover:bg-pink-600/20 transition-all duration-200 flex items-center justify-center"
                    title="Change Outfit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 font-medium"
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
              className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Outfit</h2>
                <button
                  onClick={() => setShowWardrobe(false)}
                  className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(ClothingStyle).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleOutfitChange(style)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      currentCharacter.appearance?.clothing === style
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                        : 'border-dark-600 bg-dark-700/50 text-dark-200 hover:border-pink-500/50 hover:bg-pink-500/10'
                    }`}
                  >
                    <div className="text-lg font-medium capitalize mb-2">
                      {style.replace('_', ' ')}
                    </div>
                    <div className="text-sm opacity-75">
                      {currentCharacter.appearance?.clothing === style ? 'Current' : 'Select'}
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
