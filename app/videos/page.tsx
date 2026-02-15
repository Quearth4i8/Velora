'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import { VideoWithDetails, VideoRequestStatus } from '@/lib/types';
import { useDialog } from '@/components/ui/DialogProvider';
import { Heart, Play, Plus, Trash2, Sparkles, Film, Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VideosPage() {
  const { user } = useAuth();
  const dialog = useDialog();
  
  // State for videos
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
  const [videoRequests, setVideoRequests] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'requests' | 'submit'>('gallery');
  
  // State for image selection
  const [userImages, setUserImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [promptIdea, setPromptIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for video player modal and in-view videos
  const [playingVideo, setPlayingVideo] = useState<VideoWithDetails | null>(null);
  const [visibleVideos, setVisibleVideos] = useState<Set<string>>(new Set());

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch videos from videos table
      const videosResult = await characterAPI.getVideos({ limit: 100 });
      if (videosResult.success && videosResult.data) {
        setVideos(videosResult.data);
      }

      // Fetch user's own requests
      if (user) {
        const userRequestsResult = await characterAPI.getUserVideoRequests();
        if (userRequestsResult.success && userRequestsResult.data) {
          setUserRequests(userRequestsResult.data);
        }
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user images when switching to submit tab
  useEffect(() => {
    if (activeTab === 'submit' && user) {
      fetchUserImages();
    }
  }, [activeTab, user]);

  const fetchUserImages = async () => {
    setIsLoadingImages(true);
    try {
      const result = await characterAPI.getUserImages(100);
      if (result.success && result.data) {
        setUserImages(result.data);
      }
    } catch (error) {
      console.error('Error fetching user images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user) {
      await dialog.alert({
        title: 'Sign In Required',
        message: 'Please sign in to submit a video request.',
      });
      return;
    }

    if (!selectedImage) {
      await dialog.alert({
        title: 'Select an Image',
        message: 'Please select an image for your video request.',
      });
      return;
    }

    if (!promptIdea.trim()) {
      await dialog.alert({
        title: 'Enter a Prompt',
        message: 'Please describe what kind of video you\'d like to create.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await characterAPI.createVideoRequest({
        imageId: selectedImage.id,
        characterId: selectedImage.characterId,
        promptIdea: promptIdea.trim(),
      });

      if (result.success) {
        await dialog.alert({
          title: 'Request Submitted!',
          message: 'Your video request has been submitted. The most popular requests will be chosen for generation.',
        });
        setPromptIdea('');
        setSelectedImage(null);
        setActiveTab('requests');
        await fetchData();
      } else {
        throw result.error || new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting video request:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to submit video request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (requestId: string, isLiked: boolean) => {
    if (!user) {
      await dialog.alert({
        title: 'Sign In Required',
        message: 'Please sign in to like video requests.',
      });
      return;
    }

    try {
      const result = isLiked
        ? await characterAPI.unlikeVideoRequest(requestId)
        : await characterAPI.likeVideoRequest(requestId);

      if (result.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    const confirmed = await dialog.confirm({
      title: 'Delete Request?',
      message: 'This will permanently delete your video request. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      const result = await characterAPI.deleteVideoRequest(requestId);
      if (result.success) {
        await fetchData();
      } else {
        throw result.error || new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to delete request. Only pending requests can be deleted.',
      });
    }
  };

  const handleLikeVideo = async (videoId: string, isLiked: boolean) => {
    if (!user) {
      await dialog.alert({
        title: 'Sign In Required',
        message: 'Please sign in to like videos.',
      });
      return;
    }

    try {
      const result = isLiked
        ? await characterAPI.unlikeVideo(videoId)
        : await characterAPI.likeVideo(videoId);

      if (result.success) {
        // Update local state
        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, likesCount: isLiked ? v.likesCount - 1 : v.likesCount + 1, userHasLiked: !isLiked }
            : v
        ));
      }
    } catch (error) {
      console.error('Error toggling video like:', error);
    }
  };

  const getStatusIcon = (status: VideoRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <Film className="w-4 h-4 text-pink-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: VideoRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'generating':
        return 'Generating...';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Not Selected';
      default:
        return status;
    }
  };

  const getStatusColor = (status: VideoRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'generating':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-dark-700 text-dark-300';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <AnimatedBackground />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Character Videos
              </h1>
              <p className="text-dark-400 mt-2">
                Watch AI-generated videos of your favorite characters. Submit your own requests and vote for the best ideas!
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Film className="w-4 h-4" />
              <span>{videos.length} videos available</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-7xl mx-auto mb-8"
        >
          <div className="flex flex-wrap gap-2 p-1.5 bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5">
            {[
              { id: 'gallery', label: 'Video Gallery', icon: Film },
              { id: 'requests', label: 'Requests', icon: Sparkles },
              { id: 'submit', label: 'Submit Request', icon: Plus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-20">
                    <Film className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-300 mb-2">No Videos Yet</h3>
                    <p className="text-dark-500 max-w-md mx-auto">
                      Be the first to submit a video request! Select an image and describe the video you want to see.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video, index) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        index={index}
                        isVisible={visibleVideos.has(video.id)}
                        onPlay={() => setPlayingVideo(video)}
                        onLike={handleLikeVideo}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  </div>
                ) : videoRequests.length === 0 && userRequests.length === 0 ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-300 mb-2">No Active Requests</h3>
                    <p className="text-dark-500 max-w-md mx-auto mb-6">
                      There are no pending video requests. Submit your own idea and gather likes to get it chosen!
                    </p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition-all duration-200"
                    >
                      Submit a Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Your Requests Section */}
                    {user && userRequests.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-pink-400" />
                          Your Requests
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {userRequests.map((request, index) => (
                            <RequestCard
                              key={request.id}
                              request={request}
                              index={index}
                              onLike={handleLike}
                              onDelete={handleDeleteRequest}
                              isOwner={true}
                              getStatusIcon={getStatusIcon}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Pending Requests */}
                    {videoRequests.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-pink-400" />
                          Vote for Your Favorites
                        </h2>
                        <p className="text-dark-400 mb-4">
                          The most liked requests will be chosen for video generation. Vote now to support the ideas you love!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {videoRequests.map((request, index) => (
                            <RequestCard
                              key={request.id}
                              request={request}
                              index={index}
                              onLike={handleLike}
                              onDelete={handleDeleteRequest}
                              isOwner={request.userId === user?.id}
                              getStatusIcon={getStatusIcon}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Submit Tab */}
            {activeTab === 'submit' && (
              <motion.div
                key="submit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {!user ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-300 mb-2">Sign In Required</h3>
                    <p className="text-dark-500 max-w-md mx-auto">
                      Please sign in to submit video requests.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 mb-6">
                      <h2 className="text-xl font-semibold text-white mb-2">Submit a Video Request</h2>
                      <p className="text-dark-400 mb-6">
                        Select one of your character images and describe the video you want to see. The most popular requests will be chosen for generation!
                      </p>

                      {/* Selected Image Preview */}
                      {selectedImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-pink-500/30"
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={selectedImage.imageUrl}
                              alt="Selected"
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-white mb-1">{selectedImage.characterName}</h4>
                              <p className="text-sm text-dark-400">Selected for video generation</p>
                            </div>
                            <button
                              onClick={() => setSelectedImage(null)}
                              className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Prompt Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Describe your video idea
                        </label>
                        <textarea
                          value={promptIdea}
                          onChange={(e) => setPromptIdea(e.target.value)}
                          placeholder="e.g., A gentle breeze moving her hair, looking at the camera with a soft smile..."
                          className="w-full h-32 px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 resize-none"
                        />
                        <p className="text-xs text-dark-500 mt-2">
                          Be descriptive! Include details about movement, expression, camera angle, etc.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmitRequest}
                          disabled={isSubmitting || !selectedImage || !promptIdea.trim()}
                          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Submit Request
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Image Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {selectedImage ? 'Choose a Different Image' : 'Select an Image'}
                      </h3>
                      
                      {isLoadingImages ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                        </div>
                      ) : userImages.length === 0 ? (
                        <div className="text-center py-12 bg-dark-900/30 rounded-2xl border border-white/5">
                          <p className="text-dark-500">
                            You don&apos;t have any images yet. Generate some characters first!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {userImages.map((image, index) => (
                            <motion.button
                              key={image.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              onClick={() => setSelectedImage(image)}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                selectedImage?.id === image.id
                                  ? 'border-pink-500 ring-2 ring-pink-500/30'
                                  : 'border-white/5 hover:border-white/20'
                              }`}
                            >
                              <img
                                src={image.imageUrl}
                                alt={image.characterName}
                                className="w-full h-full object-cover"
                              />
                              {selectedImage?.id === image.id && (
                                <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                  <CheckCircle className="w-8 h-8 text-pink-400" />
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <div className="aspect-video bg-dark-900 rounded-2xl overflow-hidden">
                {playingVideo.videoUrl ? (
                  <video
                    src={playingVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-dark-500">Video not available</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white">{playingVideo.title}</h3>
                <p className="text-dark-400">{playingVideo.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Request Card Component
function RequestCard({
  request,
  index,
  onLike,
  onDelete,
  isOwner,
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
}: {
  request: any;
  index: number;
  onLike: (id: string, isLiked: boolean) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
  getStatusIcon: (status: VideoRequestStatus) => React.ReactNode;
  getStatusLabel: (status: VideoRequestStatus) => string;
  getStatusColor: (status: VideoRequestStatus) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-dark-800 overflow-hidden">
        <img
          src={request.imageUrl}
          alt={request.characterName}
          className="w-full h-full object-cover"
        />
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            {getStatusLabel(request.status)}
          </span>
        </div>
        {/* Delete Button (Owner Only) */}
        {isOwner && request.status === 'pending' && (
          <button
            onClick={() => onDelete(request.id)}
            className="absolute top-3 right-3 p-2 bg-dark-900/80 hover:bg-red-500/20 text-dark-400 hover:text-red-400 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{request.characterName}</h3>
        
        {/* Prompt with expand/collapse */}
        <div className="mb-3">
          <p className={`text-sm text-dark-400 ${expanded ? '' : 'line-clamp-2'}`}>
            {request.promptIdea}
          </p>
          {request.promptIdea.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-pink-400 hover:text-pink-300 mt-1 flex items-center gap-1"
            >
              {expanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => onLike(request.id, request.userHasLiked || false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              request.userHasLiked
                ? 'bg-pink-500/20 text-pink-400'
                : 'bg-dark-800 text-dark-400 hover:text-pink-400 hover:bg-pink-500/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${request.userHasLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{request.likesCount}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Video Card with Intersection Observer for auto-play
function VideoCard({
  video,
  index,
  isVisible,
  onPlay,
  onLike,
}: {
  video: VideoWithDetails;
  index: number;
  isVisible: boolean;
  onPlay: () => void;
  onLike: (videoId: string, isLiked: boolean) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              // Video is in view - play muted preview
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {
                // Autoplay prevented, that's okay
              });
            } else {
              // Video is out of view - pause
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-pink-500/30 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Preview / Thumbnail */}
      <div className="relative aspect-video bg-dark-800 overflow-hidden">
        {/* Video element for auto-play preview */}
        {video.videoUrl && (
          <video
            ref={videoRef}
            src={video.videoUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
          />
        )}
        {/* Thumbnail (shows when not hovered or video loading) */}
        <img
          src={video.thumbnailUrl || video.characterImageUrl || '/default-video-thumb.jpg'}
          alt={video.title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        />
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onPlay}
            className="w-14 h-14 bg-pink-500/90 hover:bg-pink-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </button>
        </div>
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-pink-500/10 text-pink-400 border-pink-500/20">
            Active
          </span>
        </div>
        {/* Duration badge if available */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-white">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">
          {video.title}
        </h3>
        <p className="text-sm text-dark-400 line-clamp-2 mb-3">
          {video.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500">
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <Play className="w-3 h-3" />
              {video.viewsCount}
            </span>
            <button
              onClick={() => onLike(video.id, video.userHasLiked || false)}
              className={`flex items-center gap-1 transition-all duration-200 ${
                video.userHasLiked
                  ? 'text-pink-400'
                  : 'text-dark-400 hover:text-pink-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${video.userHasLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{video.likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
