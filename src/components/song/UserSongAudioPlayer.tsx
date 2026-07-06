import { useState, useRef, useEffect } from 'preact/hooks';
import { PlayIcon, PauseIcon, StopIcon } from '../ui/Icons';
import styles from '../hymn/AudioPlayer.module.css';

interface UserSongAudioPlayerProps {
  audioUrl: string;
  color: string;
}

const SPEEDS: number[] = [0.75, 1, 1.25, 1.5];

export function UserSongAudioPlayer({ audioUrl, color }: UserSongAudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsExpanded(false);
  };

  const handleSeek = (e: MouseEvent) => {
    if (!audioRef.current) return;
    const bar = e.currentTarget as HTMLDivElement;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextIndex]);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[nextIndex];
    }
  };

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExpand = () => {
    setIsExpanded(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {!isExpanded ? (
        <button
          class={`${styles.fab} ${styles[color]}`}
          onClick={handleExpand}
          title="Reproducir audio"
          data-print-hide
        >
          <PlayIcon size={28} />
        </button>
      ) : (
        <div class={`${styles.miniPlayer} ${styles[color]}`} data-print-hide>
          <div class={styles.controls}>
            <button class={styles.controlBtn} onClick={handleStop} title="Detener">
              <StopIcon size={20} />
            </button>

            <button class={styles.playBtn} onClick={handlePlayPause} title={isPlaying ? 'Pausar' : 'Reproducir'}>
              {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>

            <button class={styles.speedBtn} onClick={cycleSpeed} title="Velocidad">
              {speed}x
            </button>
          </div>

          <div class={styles.progressContainer} onClick={handleSeek}>
            <span class={styles.time}>{formatTime(currentTime)}</span>
            <div class={styles.progressBar}>
              <div class={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span class={styles.time}>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </>
  );
}
