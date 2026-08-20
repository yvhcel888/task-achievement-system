import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface PlayableSong {
  song_id: string;
  title: string;
  artist: string;
  ext: string;
  status: string;
  user_id?: string;
}

interface MusicPlayerContextValue {
  current: PlayableSong | null;
  playing: boolean;
  progress: number; // 秒
  duration: number; // 秒
  volume: number; // 0-1
  playSong: (song: PlayableSong, token: string) => void;
  toggle: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

function streamUrl(songId: string, token: string): string {
  return `/api/music/stream/${songId}?token=${encodeURIComponent(token)}`;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef<string>('');
  const [current, setCurrent] = useState<PlayableSong | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  // 单例 audio 元素
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audioRef.current = null;
    };
  }, []);

  // token 变化时刷新当前播放地址
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (tokenRef.current && tokenRef.current !== '') {
      const wasPlaying = !audio.paused;
      audio.src = streamUrl(current.song_id, tokenRef.current);
      if (wasPlaying) audio.play().catch(() => {});
    }
  }, [tokenRef, current]);

  const playSong = (song: PlayableSong, token: string) => {
    tokenRef.current = token;
    const audio = audioRef.current;
    if (!audio) return;
    if (current?.song_id === song.song_id) {
      audio.play().catch(() => {});
      return;
    }
    setCurrent(song);
    setProgress(0);
    setDuration(0);
    audio.src = streamUrl(song.song_id, token);
    audio.play().catch(() => {});
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const seek = (t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setProgress(t);
  };

  const setVolume = (v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  };

  const stop = () => {
    const audio = audioRef.current;
    audio?.pause();
    setCurrent(null);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const value = useMemo(
    () => ({ current, playing, progress, duration, volume, playSong, toggle, seek, setVolume, stop }),
    [current, playing, progress, duration, volume],
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return ctx;
}

export function fmtTime(t: number): string {
  if (!isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
