'use client';

import React from 'react';
import { Loader2, Pause, Volume2 } from 'lucide-react';

interface TTSButtonProps {
  text: string;
  className?: string;
  title?: string;
}

export function TTSButton({ text, className, title = 'Generate voice' }: TTSButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const previousUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      // Clean up previous URL when component unmounts
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const playUrl = (url: string) => {
    // Clean up previous URL if it exists and is different
    if (previousUrlRef.current && previousUrlRef.current !== url) {
      URL.revokeObjectURL(previousUrlRef.current);
    }
    previousUrlRef.current = url;

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
    } else {
      audioRef.current.src = url;
    }

    void audioRef.current.play();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      void audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleClick = async () => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    if (audioUrl) {
      togglePlay();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Use a small delay to ensure the state is set before playing
      setTimeout(() => {
        playUrl(url);
      }, 0);
    } catch (e) {
      console.error('TTS failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = isLoading ? Loader2 : isPlaying ? Pause : Volume2;

  return (
    <button
      onClick={handleClick}
      className={className}
      title={title}
      disabled={isLoading}
      type="button"
    >
      <Icon className={isLoading ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} />
    </button>
  );
}
