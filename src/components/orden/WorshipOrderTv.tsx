import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { JSX } from 'preact';
import type { WorshipOrder, WorshipSlide, ReadingFlow } from '../../types/orden';
import type { Himno, UserSong } from '../../types/himno';
import type { BibleVerse } from '../../services/bibleApi';
import { getHimno } from '../../services/api';
import { fetchChapter } from '../../services/bibleApi';
import { getCloudSong } from '../../services/cloudSongService';
import { getUserSong } from '../../services/userSongStorage';
import { getBookById } from '../../data/books';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PersonIcon, StandingIcon, GroupIcon, SittingIcon, PlayIcon, PauseIcon, StopIcon } from '../ui/Icons';
import { useAudio, type PlaybackSpeed } from '../../hooks/useAudio';
import styles from './WorshipOrderTv.module.css';

const SLIDE_WIDTH = 800;

const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

function TvAudioButton({ hymnNumber }: { hymnNumber: number }) {
  const { isPlaying, isLoaded, audioError, stop, play, pause, speed, setSpeed } = useAudio(hymnNumber);
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };
  if (!isLoaded || audioError) return null;
  return (
    <div class={styles.audioControls}>
      {isPlaying && (
        <button class={styles.ctrlBtn} onClick={(e) => { e.stopPropagation(); stop(); }} title="Detener">
          <StopIcon size={18} />
        </button>
      )}
      <button
        class={styles.ctrlBtn}
        onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : play(); }}
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </button>
      {isPlaying && (
        <button class={styles.speedBtn} onClick={(e) => { e.stopPropagation(); cycleSpeed(); }} title="Velocidad">
          {speed}x
        </button>
      )}
    </div>
  );
}

function getVerseReaders(verseIdx: number, total: number, flow?: ReadingFlow): ('pulpit' | 'congregation' | 'together')[] {
  if (!flow) return ['congregation'];
  switch (flow) {
    case 'pulpit': return ['pulpit'];
    case 'congregation': return ['congregation'];
    case 'together': return ['together'];
    case 'antiphonal':
      if (verseIdx === total - 1) return ['together'];
      return verseIdx % 2 === 0 ? ['pulpit'] : ['congregation'];
    default: return ['congregation'];
  }
}

interface VerseSlide {
  verses: string[];
  title: string;
  slide: WorshipSlide;
  hymn?: Himno;
  bibleRange?: { start: number; end: number };
}

interface Props {
  order: WorshipOrder;
  hymnCache: Record<number, Himno>;
  userSongCache?: Record<string, UserSong>;
  onClose: () => void;
  theme: string;
  color: string;
}

function renderSubContent(vs: VerseSlide, subIdx: number, total: number, color: string): JSX.Element | null {
  if (total === 0) return null;

  if (vs.slide.type === 'hymn' && vs.hymn) {
    const hymn = vs.hymn;
    if (subIdx === 0) {
      return (
        <div class={styles.verseTitleSlide}>
          <h1 class={styles.tvHymnTitle}>Himno {hymn.numero}</h1>
          <h2 class={styles.tvHymnSubtitle}>{hymn.titulo}</h2>
          {hymn.intro && <p class={styles.tvHymnIntro}>{hymn.intro}</p>}
          {hymn.referencias.length > 0 && (
            <ul class={styles.tvHymnRefs}>
              {hymn.referencias.map((ref, i) => <li key={i}>{ref}</li>)}
            </ul>
          )}
        </div>
      );
    }
    if (subIdx <= hymn.versos.length) {
      const verso = hymn.versos[subIdx - 1];
      const lines = verso.lineas.slice(0, 8);
      return (
        <div class={styles.verseContent}>
          <h2 class={`${styles.verseNameText} ${styles[`${color}-text`] || ''}`}>{verso.nombre}</h2>
          {lines.map((linea, i) => <p key={i} class={styles.verseLine}>{linea}</p>)}
        </div>
      );
    }
    if (subIdx === total - 1) {
      return (
        <div class={styles.authorsSlide}>
          <h2 class={styles.authorsTitleText}>Créditos</h2>
          <ul class={styles.authorsList}>
            {hymn.autores.map((autor, i) => <li key={i} class={styles.authorName}>{autor}</li>)}
          </ul>
        </div>
      );
    }
    return null;
  }

  if (subIdx === 0) {
    return (
      <div class={styles.verseTitleSlide}>
        {vs.slide.type === 'bible-reading' && <p class={styles.verseLabel}>Lectura bíblica</p>}
        <h2 class={styles.verseTitle}>{vs.title}</h2>
        {vs.slide.type === 'bible-reading' && vs.slide.readingFlow && (
          <div class={styles.flowIndicator}>
            {vs.slide.readingFlow === 'pulpit' ? <span class={styles.flowItem}><PersonIcon size={16} /><span>Púlpito</span></span>
            : vs.slide.readingFlow === 'congregation' ? <span class={styles.flowItem}><GroupIcon size={16} /><span>Iglesia</span></span>
            : vs.slide.readingFlow === 'together' ? <span class={styles.flowItem}><span class={styles.togetherIcons}><PersonIcon size={16} /><GroupIcon size={16} /></span><span>Todos juntos</span></span>
            : vs.slide.readingFlow === 'antiphonal' ? <span class={styles.flowItem}><span class={styles.togetherIcons}><PersonIcon size={16} /><GroupIcon size={16} /></span><span>Antifonal</span></span>
            : null}
          </div>
        )}
        {vs.verses.length > 0 && vs.slide.type !== 'bible-reading' && (
          <p class={styles.verseCount}>{vs.verses.length} verso{vs.verses.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    );
  }

  const verseIdx = subIdx - 1;
  const text = vs.verses[verseIdx];
  if (!text) return null;

  if (vs.slide.type === 'bible-reading') {
    const dotIdx = text.indexOf('. ');
    if (dotIdx > 0) {
      const num = text.slice(0, dotIdx + 1);
      const rest = text.slice(dotIdx + 2);
      return (
        <div class={styles.verseContent}>
          <div class={styles.verseText}>
            <p class={styles.verseLine}><span class={`${styles.verseNum} ${styles[`${color}-text`] || ''}`}>{num}</span> {rest}</p>
          </div>
        </div>
      );
    }
  }

  const lines = text.split('\n');

  return (
    <div class={styles.verseContent}>
      <div class={styles.verseText}>
        {lines.map((line, i) => <p key={i} class={styles.verseLine}>{line}</p>)}
      </div>
    </div>
  );
}

export function WorshipOrderTv({ order, hymnCache, userSongCache = {}, onClose, theme, color }: Props) {
  const [verseSlides, setVerseSlides] = useState<VerseSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentSubSlide, setCurrentSubSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const [uiVisible, setUiVisible] = useState(true);
  const [extraVisible, setExtraVisible] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const uiTimerRef = useRef<number>(0);
  const extraTimerRef = useRef<number>(0);

  const showUI = useCallback(() => {
    setUiVisible(true);
    clearTimeout(uiTimerRef.current);
    uiTimerRef.current = window.setTimeout(() => setUiVisible(false), 1000);
  }, []);

  const showExtra = useCallback(() => {
    setExtraVisible(true);
    clearTimeout(extraTimerRef.current);
    extraTimerRef.current = window.setTimeout(() => setExtraVisible(false), 3000);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateScale = () => {
      const scaleX = window.innerWidth / SLIDE_WIDTH;
      setScale(window.innerHeight > window.innerWidth ? Math.max(1, scaleX) : scaleX);
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleMouseMove = () => { showUI(); showExtra(); };
    window.addEventListener('mousemove', handleMouseMove);

    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen().catch(() => {});
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(uiTimerRef.current);
      clearTimeout(extraTimerRef.current);
    };
  }, []);

  useEffect(() => {
    uiTimerRef.current = window.setTimeout(() => setUiVisible(false), 1000);
    extraTimerRef.current = window.setTimeout(() => setExtraVisible(false), 3000);
    return () => {
      clearTimeout(uiTimerRef.current);
      clearTimeout(extraTimerRef.current);
    };
  }, []);

  useEffect(() => {
    loadSlideData();
  }, [order, hymnCache]);

  async function loadSlideData() {
    const results: VerseSlide[] = [];

    for (const slide of order.slides) {
      switch (slide.type) {
        case 'slide':
          results.push({ verses: [], title: slide.title || '', slide });
          break;

        case 'hymn': {
          const num = slide.hymnNumber!;
          let hymn: Himno | undefined = hymnCache[num];
          if (!hymn) {
            try { hymn = await getHimno(num); } catch {}
          }
          const verses = hymn
            ? hymn.versos.map(v => `${v.nombre}\n${v.lineas.join('\n')}`)
            : [];
          results.push({
            verses,
            title: hymn ? `Himno ${num}. ${hymn.titulo}` : `Himno ${num}`,
            slide,
            hymn,
          });
          break;
        }

        case 'user-song': {
          const songId = slide.userSongId!;
          let userSong: UserSong | undefined = userSongCache?.[songId];
          if (!userSong) {
            const local = getUserSong(songId);
            if (local) {
              userSong = local;
            } else {
              try { userSong = await getCloudSong(songId) || undefined; } catch {}
            }
          }
          const verses = userSong
            ? userSong.versos.map(v => `${v.nombre}\n${v.lineas.join('\n')}`)
            : [];
          results.push({
            verses,
            title: userSong ? userSong.titulo : (slide.title || 'Canto'),
            slide,
            hymn: undefined,
          });
          break;
        }

        case 'bible-reading': {
          const bookId = slide.bookId || '';
          const ch = slide.chapter || 1;
          const book = getBookById(bookId);
          let allVerses: BibleVerse[] = [];
          try { allVerses = await fetchChapter(bookId, ch); } catch {}

          const start = slide.startVerse || 1;
          const end = slide.endVerse || allVerses.length;

          const filtered = allVerses.filter(v => {
            const vn = parseInt(v.verse, 10);
            return vn >= start && vn <= end;
          });

          results.push({
            verses: filtered.map(v => `${v.verse}. ${v.text}`),
            title: `${book?.nombre || bookId} ${ch}${start !== 1 || end !== allVerses.length ? (start !== end ? `:${start}-${end}` : `:${start}`) : ''}`,
            slide,
            bibleRange: { start, end },
          });
          break;
        }
      }
    }

    setVerseSlides(results);
  }

  const currentVs = verseSlides[currentSlide];
  const totalSubSlides = currentVs?.slide.type === 'hymn'
    ? 2 + currentVs.verses.length
    : currentVs?.verses.length > 0
      ? currentVs.verses.length + 1
      : 0;

  const goPrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setCurrentSubSlide(0);
      showUI(); showExtra();
    }
  }, [currentSlide, showUI, showExtra]);

  const goNextSlide = useCallback(() => {
    if (currentSlide < verseSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setCurrentSubSlide(0);
      showUI(); showExtra();
    }
  }, [currentSlide, verseSlides.length, showUI, showExtra]);

  const goPrevSub = useCallback(() => {
    if (currentSubSlide > 0) {
      setCurrentSubSlide(prev => prev - 1);
      showUI(); showExtra();
    }
  }, [currentSubSlide, showUI, showExtra]);

  const goNextSub = useCallback(() => {
    if (currentSubSlide < totalSubSlides - 1) {
      setCurrentSubSlide(prev => prev + 1);
      showUI(); showExtra();
    }
  }, [currentSubSlide, totalSubSlides, showUI, showExtra]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          if (e.key === 'ArrowUp') goPrevSlide();
          else goNextSlide();
          break;
        case ' ':
          e.preventDefault();
          goNextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrevSub();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNextSub();
          break;
        case 'Escape':
        case 'Home':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrevSlide, goNextSlide, goPrevSub, goNextSub, onClose]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        if (currentSubSlide < totalSubSlides - 1) {
          goNextSub();
        } else {
          goNextSlide();
        }
      } else {
        if (currentSubSlide > 0) {
          goPrevSub();
        } else {
          goPrevSlide();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentSubSlide, totalSubSlides, goNextSub, goNextSlide, goPrevSub, goPrevSlide]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;

    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -threshold) goNextSlide();
      if (dy > threshold) goPrevSlide();
    } else {
      if (dx < -threshold) goNextSub();
      if (dx > threshold) goPrevSub();
    }
  };

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (e.button === 2) {
      if (currentSubSlide > 0) {
        goPrevSub();
      } else {
        goPrevSlide();
      }
    } else if (e.button === 0) {
      if (currentSubSlide < totalSubSlides - 1) {
        goNextSub();
      } else {
        goNextSlide();
      }
    }
  }, [currentSubSlide, totalSubSlides, goPrevSub, goNextSub, goPrevSlide, goNextSlide]);

  if (verseSlides.length === 0) {
    return (
      <div class={styles.loader} ref={wrapperRef} data-theme={theme}>
        <div class={styles.loading}>Cargando...</div>
      </div>
    );
  }

  const vs = verseSlides[currentSlide];
  const isPlainSlide = vs.slide.type === 'slide';
  const showSubNav = totalSubSlides > 0;

  return (
    <div
      class={styles.wrapper}
      ref={wrapperRef}
      data-theme={theme}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div class={styles.stage} style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div class={styles.slideContent}>
          {isPlainSlide ? (
            <div class={styles.titleSlide}>
              <h1 class={styles.tvTitle}>{vs.slide.title}</h1>
              {vs.slide.subtitle && <p class={styles.tvSubtitle}>{vs.slide.subtitle}</p>}
            </div>
          ) : renderSubContent(vs, currentSubSlide, totalSubSlides, color)}
        </div>
      </div>

      <div class={`${styles.bottomLeft} ${extraVisible ? '' : styles.hidden}`}>
        {vs.slide.posture && (isPlainSlide || currentSubSlide === 0) && (
          <div class={`${styles.postureIndicator} ${vs.slide.posture === 'standing' ? styles.standingBg : styles.sittingBg}`}>
            {vs.slide.posture === 'standing' ? <StandingIcon size={18} /> : <SittingIcon size={18} />}
            <span>{vs.slide.posture === 'standing' ? 'De pie' : 'Sentado'}</span>
          </div>
        )}
        {vs.slide.type === 'bible-reading' && !isPlainSlide && currentSubSlide > 0 && vs.slide.readingFlow && (
          <div class={styles.flowIndicator}>
            {(() => {
              const readers = getVerseReaders(currentSubSlide - 1, vs.verses.length, vs.slide.readingFlow);
              return readers.map((r, i) =>
                r === 'pulpit' ? <span key={i} class={styles.flowItem}><PersonIcon size={16} /><span>Púlpito</span></span>
                  : r === 'congregation' ? <span key={i} class={styles.flowItem}><GroupIcon size={16} /><span>Iglesia</span></span>
                  : <span key={i} class={styles.flowItem}><span class={styles.togetherIcons}><PersonIcon size={16} /><GroupIcon size={16} /></span><span>Todos</span></span>
              );
            })()}
          </div>
        )}
      </div>

      <div class={`${styles.closeTopLeft} ${uiVisible ? '' : styles.hidden}`}>
        <button class={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <CloseIcon size={22} />
        </button>
      </div>

      {vs.slide.type === 'hymn' && vs.hymn && (
        <div class={`${styles.topCenter} ${extraVisible ? '' : styles.hidden}`}>
          <TvAudioButton hymnNumber={vs.hymn.numero} />
        </div>
      )}


      <div class={`${styles.rightNav} ${uiVisible ? '' : styles.hidden}`}>
        <button class={styles.navArrow} onClick={(e) => { e.stopPropagation(); goPrevSlide(); }} disabled={currentSlide === 0}>
          <ChevronUpIcon size={22} />
        </button>
        <div class={styles.rightDots}>
          {verseSlides.map((_, i) => (
            <button
              key={i}
              class={`${styles.dot} ${i === currentSlide ? styles.activeDot : ''}`}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); setCurrentSubSlide(0); showUI(); showExtra(); }}
            />
          ))}
        </div>
        <button class={styles.navArrow} onClick={(e) => { e.stopPropagation(); goNextSlide(); }} disabled={currentSlide === verseSlides.length - 1}>
          <ChevronDownIcon size={22} />
        </button>
      </div>

      <div class={`${styles.bottomCenter} ${uiVisible && showSubNav ? '' : styles.hidden}`}>
          <button class={styles.bottomArrow} onClick={(e) => { e.stopPropagation(); goPrevSub(); }} disabled={currentSubSlide <= 0} title="Verso anterior">
              <ChevronLeftIcon size={22} />
            </button>
            <span class={styles.bottomCounter}>
              {vs.slide.type === 'bible-reading' && vs.bibleRange
                ? currentSubSlide > 0
                  ? `${currentSubSlide} / ${totalSubSlides - 1}`
                  : `Versículos ${vs.bibleRange.start}–${vs.bibleRange.end}`
                : vs.slide.type === 'hymn'
                  ? currentSubSlide === 0
                    ? `Himno ${vs.hymn?.numero || ''}`
                    : currentSubSlide === totalSubSlides - 1
                      ? 'Créditos'
                      : `Verso ${currentSubSlide}`
                  : vs.slide.type === 'user-song'
                    ? currentSubSlide === 0
                      ? `${vs.title}`
                      : currentSubSlide === totalSubSlides - 1
                        ? 'Créditos'
                        : `Verso ${currentSubSlide}`
                    : currentSubSlide > 0
                    ? `${currentSubSlide} / ${totalSubSlides - 1}`
                    : `${totalSubSlides - 1} verso${totalSubSlides - 1 !== 1 ? 's' : ''}`
              }
            </span>
            <button class={styles.bottomArrow} onClick={(e) => { e.stopPropagation(); goNextSub(); }} disabled={currentSubSlide >= totalSubSlides - 1} title="Verso siguiente">
          <ChevronRightIcon size={22} />
        </button>
      </div>
    </div>
  );
}
