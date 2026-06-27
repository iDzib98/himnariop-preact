import { useState } from 'preact/hooks';
import { useAudio, type PlaybackSpeed } from '../../hooks/useAudio';
import { PlayIcon, PauseIcon, StopIcon } from '../ui/Icons';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  himnoNumero: number;
  color: string;
  theme: string;
}

const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

export function AudioPlayer({ himnoNumero, color, theme }: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isPlaying,
    isLoaded,
    currentTime,
    duration,
    speed,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    formatTime
  } = useAudio(himnoNumero);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLDivElement;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    seek(percentage * duration);
  };

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextIndex]);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    play();
  };

  const handleStop = () => {
    stop();
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        class={`${styles.fab} ${styles[color]}`}
        onClick={handleExpand}
        title="Reproducir himno"
        data-print-hide
      >
        <PlayIcon size={28} />
      </button>
    );
  }

  return (
    <div class={`${styles.miniPlayer} ${styles[color]}`} data-theme={theme} data-print-hide>
      <div class={styles.controls}>
        <button class={styles.controlBtn} onClick={handleStop} title="Detener">
          <StopIcon size={20} />
        </button>

        <button
          class={styles.playBtn}
          onClick={isPlaying ? pause : play}
          disabled={!isLoaded}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
        </button>

        <button class={styles.speedBtn} onClick={cycleSpeed} title="Velocidad">
          {speed}x
        </button>
      </div>

      <div class={styles.progressContainer}>
        <span class={styles.time}>{formatTime(currentTime)}</span>
        <div class={styles.progressBar} onClick={handleSeek}>
          <div class={styles.progressFill} style={{ width: `${progress}%` }} />
          <div class={styles.progressThumb} style={{ left: `${progress}%` }} />
        </div>
        <span class={styles.time}>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
