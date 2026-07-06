import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { UserSong } from '../../types/himno';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlayIcon, PauseIcon } from '../ui/Icons';
import styles from './UserSongTv.module.css';

interface UserSongTvProps {
  song: UserSong;
  onClose: () => void;
  color: string;
  theme: string;
}

const SLIDE_WIDTH = 800;
const UI_HIDE_DELAY = 1000;
const EXTRA_HIDE_DELAY = 3000;

export function UserSongTv({ song, onClose, color, theme }: UserSongTvProps) {
  const [slide, setSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const [uiVisible, setUiVisible] = useState(true);
  const [extraVisible, setExtraVisible] = useState(true);
  const uiTimer = useRef<number>(0);
  const extraTimer = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const audioAvailable = !!song.audioUrl;

  const totalSlides = 2 + song.versos.length;

  const showUi = useCallback(() => {
    setUiVisible(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUiVisible(false), UI_HIDE_DELAY);
  }, []);

  const showExtra = useCallback(() => {
    setExtraVisible(true);
    clearTimeout(extraTimer.current);
    extraTimer.current = window.setTimeout(() => setExtraVisible(false), EXTRA_HIDE_DELAY);
  }, []);

  const goNext = useCallback(() => {
    setSlide(s => Math.min(s + 1, totalSlides - 1));
    showUi(); showExtra();
  }, [totalSlides, showUi, showExtra]);

  const goPrev = useCallback(() => {
    setSlide(s => Math.max(s - 1, 0));
    showUi(); showExtra();
  }, [showUi, showExtra]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const container = document.documentElement;
    const requestFs = () => {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    };
    requestFs();

    const handleFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [onClose]);

  useEffect(() => {
    const calculateScale = () => {
      const scaleX = window.innerWidth / SLIDE_WIDTH;
      setScale(window.innerHeight > window.innerWidth ? Math.max(1, scaleX) : scaleX);
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => { showUi(); showExtra(); };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(uiTimer.current);
      clearTimeout(extraTimer.current);
    };
  }, [showUi, showExtra]);

  useEffect(() => {
    showUi(); showExtra();
  }, [slide, showUi, showExtra]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) goPrev();
      else goNext();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          goPrev();
          break;
        case 'Escape':
        case 'Home':
          exitFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, exitFullscreen]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  const renderSlide = () => {
    switch (slide) {
      case 0:
        return (
          <div class={`${styles.slide} ${styles.titleSlide}`}>
            <h1 class={styles.slideTitle}>{song.titulo}</h1>
            {song.intro && <p class={styles.slideIntro}>{song.intro}</p>}
            {song.referencias.length > 0 && (
              <ul class={styles.slideRefs}>
                {song.referencias.map((ref, i) => <li key={i}>{ref}</li>)}
              </ul>
            )}
          </div>
        );

      default:
        if (slide <= song.versos.length) {
          const verso = song.versos[slide - 1];
          const lines = verso.lineas.slice(0, 8);
          return (
            <div class={`${styles.slide} ${styles.verseSlide}`}>
              <div class={styles.verseContent}>
                <h2 class={`${styles.verseName} ${styles[`${color}-text`]}`}>{verso.nombre}</h2>
                {lines.map((linea, i) => (
                  <p key={i} class={styles.verseLine}>{linea}</p>
                ))}
              </div>
            </div>
          );
        }

        if (slide === totalSlides - 1) {
          return (
            <div class={`${styles.slide} ${styles.authorsSlide}`}>
              <h2 class={styles.authorsTitle}>Créditos</h2>
              <ul class={styles.authorsList}>
                {song.autores.map((autor, i) => (
                  <li key={i} class={styles.author}>{autor}</li>
                ))}
              </ul>
            </div>
          );
        }

        return null;
    }
  };

  const uiClass = uiVisible ? '' : styles.hidden;
  const extraClass = extraVisible ? '' : styles.hidden;

  return (
    <div class={styles.container} data-theme={theme} onContextMenu={(e) => e.preventDefault()}>
      <div class={`${styles.topLeft} ${uiClass}`}>
        <button class={styles.exitBtn} onClick={(e) => { e.stopPropagation(); exitFullscreen(); }} title="Salir (Esc)">
          <CloseIcon size={22} />
        </button>
      </div>

      {audioAvailable && (
        <div class={`${styles.topCenter} ${extraClass}`}>
          <div class={styles.audioControls}>
            <button class={styles.ctrlBtn} onClick={(e) => { e.stopPropagation(); toggleAudio(); }} title={audioPlaying ? 'Pausar' : 'Reproducir'}>
              {audioPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </button>
          </div>
          <audio
            ref={audioRef}
            src={song.audioUrl}
            onEnded={() => setAudioPlaying(false)}
            hidden
          />
        </div>
      )}

      <main
        class={styles.main}
        onClick={goNext}
        onMouseUp={(e) => { if (e.button === 2) goPrev(); }}
        onWheel={(e) => { if (e.deltaY > 0) goNext(); else goPrev(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div class={styles.slideWrapper} ref={wrapperRef} style={{ transform: `scale(${scale})` }}>
          {renderSlide()}
        </div>
      </main>

      <div class={`${styles.bottomCenter} ${uiClass}`}>
        <button class={styles.arrowBtn} onClick={(e) => { e.stopPropagation(); goPrev(); }} disabled={slide <= 0} title="Anterior">
          <ChevronLeftIcon size={22} />
        </button>
        {totalSlides > 20 ? (
          <span class={styles.slideCounter}>{slide + 1} / {totalSlides}</span>
        ) : (
          <div class={styles.progress}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                class={`${styles.dot} ${i === slide ? styles.activeDot : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSlide(i);
                  showUi(); showExtra();
                }}
              />
            ))}
          </div>
        )}
        <button class={styles.arrowBtn} onClick={(e) => { e.stopPropagation(); goNext(); }} disabled={slide >= totalSlides - 1} title="Siguiente">
          <ChevronRightIcon size={22} />
        </button>
      </div>
    </div>
  );
}
