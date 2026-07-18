import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { Fragment } from 'preact';
import type { BibleVerse } from '../../services/bibleApi';
import { fixVerseBreaks } from '../../services/rvr1960Api';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../ui/Icons';
import { AnnotationMarker } from '../ui/AnnotationMarker';
import styles from './BibleTvMode.module.css';

interface BibleTvModeProps {
  verses: BibleVerse[];
  bookName: string;
  chapter: number;
  onClose: () => void;
  theme: string;
}

const SLIDE_WIDTH = 800;
const UI_HIDE_DELAY = 1000;

export function BibleTvMode({ verses, bookName, chapter, onClose, theme }: BibleTvModeProps) {
  const [slide, setSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const [uiVisible, setUiVisible] = useState(true);
  const uiTimer = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const totalSlides = 1 + verses.length;

  const showUi = useCallback(() => {
    setUiVisible(true);
    window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUiVisible(false), UI_HIDE_DELAY);
  }, []);

  const goNext = useCallback(() => {
    setSlide(s => Math.min(s + 1, totalSlides - 1));
    showUi();
  }, [totalSlides, showUi]);

  const goPrev = useCallback(() => {
    setSlide(s => Math.max(s - 1, 0));
    showUi();
  }, [showUi]);

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
      const scaleX = window.innerWidth / SLIDE_WIDTH;
      setScale(window.innerHeight > window.innerWidth ? Math.max(1, scaleX) : scaleX);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => showUi();
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.clearTimeout(uiTimer.current);
    };
  }, [showUi]);

  useEffect(() => {
    showUi();
  }, [slide, showUi]);

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
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
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

  const uiClass = uiVisible ? '' : styles.hidden;

  return (
    <div class={styles.container} data-theme={theme} onMouseMove={showUi}>
      <div class={`${styles.topLeft} ${uiClass}`}>
        <button class={styles.exitBtn} onClick={(e) => { e.stopPropagation(); exitFullscreen(); }} title="Salir (Esc)">
          <CloseIcon size={22} />
        </button>
      </div>

      <main
        class={styles.main}
        onClick={goNext}
        onContextMenu={(e) => e.preventDefault()}
        onMouseUp={(e) => { if (e.button === 2) goPrev(); }}
        onWheel={(e) => { if (e.deltaY > 0) goNext(); else goPrev(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          class={styles.slideWrapper}
          ref={wrapperRef}
          style={{ transform: `scale(${scale})` }}
        >
          {slide === 0 ? (
            <div class={`${styles.slide} ${styles.titleSlide}`}>
              <h1 class={styles.slideTitle}>{bookName}</h1>
              <h2 class={styles.slideChapter}>Capítulo {chapter}</h2>
            </div>
          ) : (
            <div class={`${styles.slide} ${styles.verseSlide}`}>
              <div class={styles.verseContent}>
                <span class={styles.verseNum}>{verses[slide - 1].verse}</span>
                <p class={styles.verseText}>
                  {(() => {
                    const v = verses[slide - 1];
                    const processed = fixVerseBreaks(v.text, '\n');
                    const parts = processed.split('*');
                    return parts.map((part, i) => (
                      <Fragment key={i}>
                        {part}
                        {i < parts.length - 1 && v.annotations && (
                          <AnnotationMarker annotations={[v.annotations[i]]} />
                        )}
                      </Fragment>
                    ));
                  })()}
                </p>
              </div>
            </div>
          )}
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
                  showUi();
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
