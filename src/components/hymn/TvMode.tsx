import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { Himno } from '../../types/himno';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlayIcon, PauseIcon } from '../ui/Icons';
import { useAudio } from '../../hooks/useAudio';
import styles from './TvMode.module.css';

interface TvModeProps {
  himno: Himno;
  onClose: () => void;
  color: string;
  theme: string;
}

const SLIDE_WIDTH = 800;
const SLIDE_HEIGHT = 600;

export function TvMode({ himno, onClose, color, theme }: TvModeProps) {
  const [slide, setSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const { isPlaying, play, pause } = useAudio(himno.numero);

  const totalSlides = 2 + himno.versos.length; // title + intro + verses + authors

  const goNext = useCallback(() => {
    setSlide(s => (s + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setSlide(s => (s - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

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
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [onClose]);

  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scaleX = viewportWidth / SLIDE_WIDTH;
      const scaleY = viewportHeight / SLIDE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const minSwipe = 50;

    if (Math.abs(deltaX) > minSwipe) {
      if (deltaX > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          goPrev();
          break;
        case 'Escape':
          exitFullscreen();
          break;
        case 'Home':
          exitFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, exitFullscreen]);

  const renderSlide = () => {
    switch (slide) {
      case 0:
        return (
          <div class={`${styles.slide} ${styles.titleSlide}`}>
            <h1 class={styles.slideTitle}>Himno {himno.numero}</h1>
            <h2 class={styles.slideSubtitle}>{himno.titulo}</h2>
            {himno.intro && <p class={styles.slideIntro}>{himno.intro}</p>}
            {himno.referencias.length > 0 && (
              <ul class={styles.slideRefs}>
                {himno.referencias.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            )}
          </div>
        );

      default:
        if (slide <= himno.versos.length) {
          const verso = himno.versos[slide - 1];
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
                {himno.autores.map((autor, i) => (
                  <li key={i} class={styles.author}>{autor}</li>
                ))}
              </ul>
            </div>
          );
        }

        return null;
    }
  };

  const themeClass = theme === 'light' ? styles.light : theme === 'sepia' ? styles.sepia : theme === 'oled' ? styles.oled : '';

  return (
    <div class={`${styles.container} ${themeClass}`}>
      <header class={`${styles.header} ${styles.visible}`}>
        <button class={styles.exitBtn} onClick={exitFullscreen} title="Salir (Esc)">
          <CloseIcon size={24} />
        </button>
        <button
          class={styles.playBtn}
          onClick={(e) => {
            e.stopPropagation();
            isPlaying ? pause() : play();
          }}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
        </button>
      </header>

      <main
        class={styles.main}
        onClick={goNext}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          class={styles.slideWrapper}
          ref={wrapperRef}
          style={{ transform: `scale(${scale})` }}
        >
          {renderSlide()}
        </div>
      </main>

      <footer class={`${styles.footer} ${styles.visible}`}>
        <button class={styles.arrowBtn} onClick={(e) => { e.stopPropagation(); goPrev(); }} title="Anterior">
          <ChevronLeftIcon size={24} />
        </button>
        <div class={styles.progress}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              class={`${styles.dot} ${i === slide ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSlide(i);
              }}
            />
          ))}
        </div>
        <button class={styles.arrowBtn} onClick={(e) => { e.stopPropagation(); goNext(); }} title="Siguiente">
          <ChevronRightIcon size={24} />
        </button>
      </footer>
    </div>
  );
}
