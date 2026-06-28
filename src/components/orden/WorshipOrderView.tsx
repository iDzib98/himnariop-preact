import { useState, useEffect } from 'preact/hooks';
import { getOrder, setReturnTo } from '../../services/ordenStorage';
import type { WorshipOrder, WorshipSlide } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getBookById } from '../../data/books';
import { getHimno } from '../../services/api';
import type { Himno } from '../../types/himno';
import { ChevronLeftIcon, TvIcon, PrintIcon, PersonIcon, StandingIcon, GroupIcon, SittingIcon } from '../ui/Icons';
import { WorshipOrderTv } from './WorshipOrderTv';
import styles from './WorshipOrderView.module.css';

interface Props {
  orderId: string;
  onNavigate: (path: string) => void;
}

export function WorshipOrderView({ orderId, onNavigate }: Props) {
  const [order, setOrder] = useState<WorshipOrder | undefined>(getOrder(orderId));
  const [hymnCache, setHymnCache] = useState<Record<number, Himno>>({});
  const [showTv, setShowTv] = useState(false);
  const { color, theme } = useSettings();

  useEffect(() => {
    setOrder(getOrder(orderId));
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const hymnSlides = order.slides.filter(s => s.type === 'hymn');
    for (const slide of hymnSlides) {
      const num = slide.hymnNumber!;
      if (!hymnCache[num]) {
        getHimno(num).then(h => {
          if (h) setHymnCache(prev => ({ ...prev, [num]: h }));
        });
      }
    }
  }, [order]);

  const navigateWithReturn = (path: string) => {
    setReturnTo(window.location.hash);
    window.location.hash = path;
  };

  if (!order) {
    return (
      <div class={styles.container} data-theme={theme}>
        <div class={styles.empty}>
          <p>Orden de culto no encontrada</p>
          <button class={`${styles.navBtn} ${styles[color]}`} onClick={() => onNavigate('orden')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (showTv) {
    return (
      <WorshipOrderTv
        order={order}
        hymnCache={hymnCache}
        onClose={() => setShowTv(false)}
        theme={theme}
        color={color}
      />
    );
  }

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate('orden')}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.headerTitle}>{order.title}</h1>
        <div class={styles.headerActions}>
          <button class={styles.headerBtn} onClick={() => setShowTv(true)} title="Proyectar">
            <TvIcon size={22} />
          </button>
          <button class={styles.headerBtn} onClick={() => window.print()} title="Imprimir">
            <PrintIcon size={22} />
          </button>
        </div>
      </header>

      <main class={styles.main}>
        {order.slides.map(slide => (
          <SlideCard
            key={slide.id}
            slide={slide}
            hymnCache={hymnCache}
            onNavigate={navigateWithReturn}
            color={color}
          />
        ))}

        {order.slides.length === 0 && (
          <div class={styles.emptySlides}>
            <p>Esta orden no tiene slides</p>
            <button class={`${styles.editBtn} ${styles[color]}`} onClick={() => onNavigate(`orden/${orderId}/editar`)}>
              Agregar slides
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SlideCard({ slide, hymnCache, onNavigate, color: _color }: {
  slide: WorshipSlide;
  hymnCache: Record<number, Himno>;
  onNavigate: (path: string) => void;
  color: string;
}) {
  switch (slide.type) {
    case 'slide':
      return (
        <div class={`${styles.slideCard} ${styles.slideCardTitle}`}>
          <h2 class={styles.slideTitle}>{slide.title}</h2>
          {slide.subtitle && <p class={styles.slideSubtitle}>{slide.subtitle}</p>}
          {slide.posture && (
            <span class={`${styles.outlinedBadge} ${slide.posture === 'standing' ? styles.standingOutline : styles.sittingOutline}`}>
              {slide.posture === 'standing' ? <StandingIcon size={16} /> : <SittingIcon size={16} />}
              <span class={styles.badgeLabel}>{slide.posture === 'standing' ? 'De pie' : 'Sentado'}</span>
            </span>
          )}
        </div>
      );

    case 'hymn': {
      const hymn = hymnCache[slide.hymnNumber!];
      return (
        <div
          class={`${styles.slideCard} ${styles.clickable}`}
          onClick={() => onNavigate(String(slide.hymnNumber))}
        >
          <div class={styles.slideLabel}>HIMNO</div>
          <h2 class={styles.slideTitle}>Himno {slide.hymnNumber}{hymn ? `. ${hymn.titulo}` : ''}</h2>
          {!hymn && <p class={styles.hint}>Cargando...</p>}
          {slide.posture && (
            <span class={`${styles.outlinedBadge} ${slide.posture === 'standing' ? styles.standingOutline : styles.sittingOutline}`}>
              {slide.posture === 'standing' ? <StandingIcon size={16} /> : <SittingIcon size={16} />}
              <span class={styles.badgeLabel}>{slide.posture === 'standing' ? 'De pie' : 'Sentado'}</span>
            </span>
          )}
        </div>
      );
    }

    case 'bible-reading': {
      const book = slide.bookId ? getBookById(slide.bookId) : undefined;
      const chapter = slide.chapter || 1;
      const verseRange = slide.startVerse && slide.endVerse
        ? `${slide.startVerse}-${slide.endVerse}`
        : slide.startVerse
          ? `${slide.startVerse}`
          : '';
      const flowIcon = slide.readingFlow
        ? <span class={`${styles.outlinedBadge} ${styles.flowOutline}`}>
            {slide.readingFlow === 'pulpit' ? <PersonIcon size={16} />
            : slide.readingFlow === 'congregation' ? <GroupIcon size={16} />
            : slide.readingFlow === 'together' ? <><PersonIcon size={16} /><GroupIcon size={16} /></>
            : <><PersonIcon size={16} /><GroupIcon size={16} /></>}
            <span class={styles.badgeLabel}>
              {slide.readingFlow === 'pulpit' ? 'Púlpito'
              : slide.readingFlow === 'congregation' ? 'Iglesia'
              : slide.readingFlow === 'together' ? 'Todos juntos'
              : 'Antifonal'}
            </span>
          </span>
        : null;

      return (
        <div
          class={`${styles.slideCard} ${styles.clickable}`}
          onClick={() => {
            const base = `biblia/${encodeURIComponent(slide.bookId || '')}/${chapter}`;
            if (slide.startVerse && slide.endVerse) {
              onNavigate(`${base}/${slide.startVerse}/${slide.endVerse}`);
            } else {
              onNavigate(base);
            }
          }}
        >
          <div class={styles.slideLabel}>LECTURA</div>
          <h2 class={styles.slideTitle}>{book?.nombre || slide.bookId} {chapter}{verseRange ? `:${verseRange}` : ''}</h2>
          <div class={styles.slideMeta}>
            {slide.posture && (
              <span class={`${styles.outlinedBadge} ${slide.posture === 'standing' ? styles.standingOutline : styles.sittingOutline}`}>
                {slide.posture === 'standing' ? <StandingIcon size={16} /> : <SittingIcon size={16} />}
                <span class={styles.badgeLabel}>{slide.posture === 'standing' ? 'De pie' : 'Sentado'}</span>
              </span>
            )}
            {flowIcon}
          </div>
        </div>
      );
    }
  }
}
