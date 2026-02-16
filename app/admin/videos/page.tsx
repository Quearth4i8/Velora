'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { VideoRequestWithDetails, VideoRequestStatus } from '@/lib/types';
import { useDialog } from '@/components/ui/DialogProvider';
import { 
  CheckCircle, XCircle, Play, Loader2, Film, Search, Eye,
  ThumbsUp, Upload, FileVideo
} from 'lucide-react';

export default function AdminVideosPage() {
  const dialog = useDialog();
  const [videoRequests, setVideoRequests] = useState<VideoRequestWithDetails[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoRequestWithDetails[]>([]);
  const [filter, setFilter] = useState<VideoRequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Video form state
  const [selectedVideo, setSelectedVideo] = useState<VideoRequestWithDetails | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    let filtered = videoRequests;
    
    if (filter !== 'all') {
      filtered = filtered.filter(v => v.status === filter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.characterName.toLowerCase().includes(query) ||
        v.promptIdea.toLowerCase().includes(query)
      );
    }
    
    setFilteredVideos(filtered);
  }, [filter, searchQuery, videoRequests]);

  const loadVideos = async () => {
    setIsLoading(true);
    const result = await characterAPI.getVideoRequests({ limit: 100 });
    if (result.success && result.data) {
      setVideoRequests(result.data);
      setFilteredVideos(result.data);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (videoId: string, status: VideoRequestStatus) => {
    try {
      const result = await characterAPI.adminUpdateVideoRequest(videoId, { 
        status,
        adminNotes: adminNotes || undefined
      });
      
      if (result.success) {
        await loadVideos();
        await dialog.alert({
          title: 'Status Updated',
          message: `Video request ${status} successfully.`,
        });
      }
    } catch (error) {
      console.error('Error updating video status:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to update video status.',
      });
    }
  };

  const handleAddVideo = async () => {
    if (!selectedVideo) return;
    if (!videoFile) {
      await dialog.alert({
        title: 'Video Required',
        message: 'Please select a video file to upload.',
      });
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Check authentication via local API
      const authRes = await fetch('/api/auth/session');
      const authData = await authRes.json();
      if (!authData.user) throw new Error('Not authenticated');

      const userId = authData.user.id;
      const videoFileName = `videos/${selectedVideo.id}/${Date.now()}_${videoFile.name}`;
      
      // Upload video to local storage
      setUploadProgress(10);
      const videoFormData = new FormData();
      videoFormData.append('file', videoFile);
      videoFormData.append('path', videoFileName);
      videoFormData.append('bucket', 'videos');
      
      const videoUploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: videoFormData,
      });
      
      if (!videoUploadRes.ok) throw new Error('Failed to upload video');
      const videoUploadData = await videoUploadRes.json();
      setUploadProgress(50);

      const finalVideoUrl = videoUploadData.url;
      let finalThumbnailUrl = '';

      // Upload thumbnail if provided
      if (thumbnailFile) {
        setUploadProgress(70);
        const thumbFileName = `thumbnails/${selectedVideo.id}/${Date.now()}_${thumbnailFile.name}`;
        
        const thumbFormData = new FormData();
        thumbFormData.append('file', thumbnailFile);
        thumbFormData.append('path', thumbFileName);
        thumbFormData.append('bucket', 'videos');
        
        const thumbUploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: thumbFormData,
        });
        
        if (!thumbUploadRes.ok) throw new Error('Failed to upload thumbnail');
        const thumbUploadData = await thumbUploadRes.json();
        
        finalThumbnailUrl = thumbUploadData.url;
      }

      setUploadProgress(90);

      // Create video entry in database
      const createResult = await characterAPI.createVideo({
        title: `${selectedVideo.characterName} - ${selectedVideo.promptIdea.slice(0, 50)}${selectedVideo.promptIdea.length > 50 ? '...' : ''}`,
        description: selectedVideo.promptIdea,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl || undefined,
        characterId: selectedVideo.characterId,
        characterImageId: selectedVideo.imageId,
        sourceType: 'video_request',
        sourceId: selectedVideo.id,
        adminNotes: adminNotes || undefined,
      });

      if (!createResult.success) {
        throw createResult.error || new Error('Failed to create video');
      }
      
      // Update the video request status to completed
      const updateResult = await characterAPI.adminUpdateVideoRequest(selectedVideo.id, {
        status: 'completed',
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl || undefined,
        adminNotes: adminNotes || undefined,
      });
      
      if (updateResult.success) {
        setUploadProgress(100);
        await loadVideos();
        
        // Reset form
        setSelectedVideo(null);
        setVideoFile(null);
        setThumbnailFile(null);
        setVideoPreviewUrl('');
        setThumbnailPreviewUrl('');
        setAdminNotes('');
        
        await dialog.alert({
          title: 'Video Added',
          message: 'Video has been uploaded and added to the gallery successfully.',
        });
      }
    } catch (error) {
      console.error('Error adding video:', error);
      await dialog.alert({
        title: 'Error',
        message: 'Failed to upload video. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status: VideoRequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'generating': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-dark-700 text-dark-400';
    }
  };

  const statusCounts = {
    all: videoRequests.length,
    pending: videoRequests.filter(v => v.status === 'pending').length,
    approved: videoRequests.filter(v => v.status === 'approved').length,
    generating: videoRequests.filter(v => v.status === 'generating').length,
    completed: videoRequests.filter(v => v.status === 'completed').length,
    rejected: videoRequests.filter(v => v.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Video Requests</h1>
        <p className="text-dark-400">Manage video generation requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['all', 'pending', 'approved', 'generating', 'completed', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-3 rounded-xl border transition-all ${
              filter === status 
                ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' 
                : 'bg-dark-900/50 border-white/5 text-dark-400 hover:border-white/10'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts[status]}</p>
            <p className="text-xs capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by character name or prompt..."
          className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <Film className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No video requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <motion.div
              key={video.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={video.imageUrl}
                  alt={video.characterName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(video.status)}`}>
                    {video.status}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 bg-dark-900/80 rounded-lg text-xs text-white">
                    <ThumbsUp className="w-3 h-3" />
                    {video.likesCount}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{video.characterName}</h3>
                <p className="text-sm text-dark-400 line-clamp-2 mb-3">{video.promptIdea}</p>
                
                <div className="text-xs text-dark-500 mb-4">
                  Submitted {new Date(video.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {video.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(video.id, 'approved')}
                        className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(video.id, 'rejected')}
                        className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {video.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(video.id, 'generating')}
                      className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark Generating
                    </button>
                  )}
                  {(video.status === 'generating' || video.status === 'approved') && (
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="w-full py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Add Video
                    </button>
                  )}
                  {video.status === 'completed' && video.videoUrl && (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Video
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-900 rounded-2xl border border-white/10 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add Video</h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-dark-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <img
                  src={selectedVideo.imageUrl}
                  alt={selectedVideo.characterName}
                  className="w-full aspect-video object-cover rounded-xl bg-dark-800"
                />
                <div className="mt-3">
                  <h3 className="font-medium text-white">{selectedVideo.characterName}</h3>
                  <p className="text-sm text-dark-400">{selectedVideo.promptIdea}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Video File *</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                          setVideoPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-6 bg-dark-800 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500/50 hover:bg-dark-700/50 transition-all"
                    >
                      {videoFile ? (
                        <>
                          <FileVideo className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-white">{videoFile.name}</span>
                          <span className="text-xs text-dark-400">({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-dark-400" />
                          <span className="text-sm text-dark-400">Click to select video file</span>
                        </>
                      )}
                    </label>
                  </div>
                  {videoPreviewUrl && (
                    <video
                      src={videoPreviewUrl}
                      className="mt-3 w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Thumbnail (optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-dark-800 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500/50 hover:bg-dark-700/50 transition-all"
                    >
                      {thumbnailFile ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-white">{thumbnailFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-dark-400" />
                          <span className="text-sm text-dark-400">Click to select thumbnail image</span>
                        </>
                      )}
                    </label>
                  </div>
                  {thumbnailPreviewUrl && (
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="mt-3 w-full h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes..."
                    className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-pink-500/50 h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="flex-1 py-3 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={isSubmitting || !videoFile}
                  className="flex-1 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Add Video
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
