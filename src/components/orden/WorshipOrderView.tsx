import { useState, useEffect } from 'preact/hooks';
import { getOrder, saveOrder, setReturnTo } from '../../services/ordenStorage';
import type { WorshipOrder, WorshipSlide } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getBookById } from '../../data/books';
import { getHimno } from '../../services/api';
import type { Himno, UserSong } from '../../types/himno';
import { getUserSong } from '../../services/userSongStorage';
import { getCloudSong } from '../../services/cloudSongService';
import { getFirebaseDb } from '../../services/firebase';
import { getCurrentUser } from '../../services/authService';
import { getChurch, getLocalChurchIds } from '../../services/churchService';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeftIcon, TvIcon, PrintIcon, PersonIcon, StandingIcon, GroupIcon, SittingIcon, ShareIcon, MusicNoteIcon, ImageIcon } from '../ui/Icons';
import { WorshipOrderTv } from './WorshipOrderTv';
import { ShareDialog } from './ShareDialog';
import styles from './WorshipOrderView.module.css';

function fromFirestoreDoc(id: string, data: any): WorshipOrder {
  const fallback = data.sharing || 'private';
  return {
    id: data.id || id,
    title: data.title || '',
    slides: (data.slides || []) as WorshipSlide[],
    authorId: data.authorId || '',
    authorName: data.authorName || '',
    isPublic: data.isPublic === true || fallback === 'public',
    churchId: data.churchId || (fallback === 'church' ? data.churchId : undefined) || undefined,
    date: data.date || undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    description: data.description || undefined,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
    cloudId: id,
  };
}

interface Props {
  orderId: string;
  onNavigate: (path: string) => void;
}

export function WorshipOrderView({ orderId, onNavigate }: Props) {
  const [order, setOrder] = useState<WorshipOrder | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [hymnCache, setHymnCache] = useState<Record<number, Himno>>({});
  const [userSongCache, setUserSongCache] = useState<Record<string, UserSong>>({});
  const [showTv, setShowTv] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const { color, theme } = useSettings();

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    setAccessError('');

    const local = getOrder(orderId);
    const user = getCurrentUser();
    const cloudId = local?.cloudId || orderId;

    // Show cached version immediately
    if (local) {
      setOrder(local);
    }

    // Try to fetch from cloud in background
    try {
      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, 'ordenes', cloudId));
      if (snap.exists()) {
        const cloud = fromFirestoreDoc(snap.id, snap.data());
        const isChurchMember = cloud.churchId && (
          getLocalChurchIds().includes(cloud.churchId) ||
          (user && await getChurch(cloud.churchId).then(c => c?.memberIds.includes(user.uid)).catch(() => false))
        );
        if (!cloud.isPublic && cloud.authorId !== user?.uid && !isChurchMember) {
          setAccessError('No tienes acceso a esta orden de culto');
          setLoading(false);
          return;
        }
        saveOrder(cloud);
        setOrder(cloud);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch order from cloud:', err);
    }

    if (!local) {
      setAccessError('');
    }
    setLoading(false);
  }

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
    const userSongSlides = order.slides.filter(s => s.type === 'user-song');
    for (const slide of userSongSlides) {
      const id = slide.userSongId!;
      if (!userSongCache[id]) {
        const local = getUserSong(id);
        if (local) {
          setUserSongCache(prev => ({ ...prev, [id]: local }));
        } else {
          getCloudSong(id).then(s => {
            if (s) setUserSongCache(prev => ({ ...prev, [id]: s }));
          });
        }
      }
    }
  }, [order]);

  const navigateWithReturn = (path: string) => {
    setReturnTo(window.location.hash);
    window.location.hash = path;
  };

  if (loading && !order) {
    return (
      <div class={styles.container} data-theme={theme}>
        <header class={`${styles.header} ${styles[color]}`}>
          <button class={styles.backBtn} onClick={() => onNavigate('orden')}>
            <ChevronLeftIcon size={24} />
          </button>
          <h1 class={styles.headerTitle}>Cargando orden...</h1>
        </header>
        <main class={styles.main}>
          <div class={styles.empty}>
            <p>Cargando orden de culto...</p>
          </div>
        </main>
      </div>
    );
  }

  if (accessError) {
    return (
      <div class={styles.container} data-theme={theme}>
        <div class={styles.empty}>
          <p>{accessError}</p>
          <button class={`${styles.navBtn} ${styles[color]}`} onClick={() => onNavigate('orden')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

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
        userSongCache={userSongCache}
        onClose={() => setShowTv(false)}
        theme={theme}
        color={color}
      />
    );
  }

  return (
    <div class={styles.container} data-theme={theme}>
      {showShare && order && (
        <ShareDialog
          order={order}
          onClose={() => setShowShare(false)}
          onShared={(updated) => setOrder(updated)}
        />
      )}
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate('orden')}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.headerTitle}>{order.title}</h1>
        {loading && <span class={styles.syncBadge}>Sincronizando...</span>}
        <div class={styles.headerActions}>
          <button class={styles.headerBtn} onClick={() => setShowShare(true)} title="Compartir">
            <ShareIcon size={20} />
          </button>
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
            userSongCache={userSongCache}
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

function SlideCard({ slide, hymnCache, userSongCache, onNavigate, color: _color }: {
  slide: WorshipSlide;
  hymnCache: Record<number, Himno>;
  userSongCache: Record<string, UserSong>;
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

    case 'user-song': {
      const userSong = userSongCache[slide.userSongId!];
      return (
        <div
          class={`${styles.slideCard} ${styles.clickable}`}
          onClick={() => onNavigate(`canto/${slide.userSongId}`)}
        >
          <div class={styles.slideLabel}><MusicNoteIcon size={14} /> MI CANTO</div>
          <h2 class={styles.slideTitle}>{slide.title || userSong?.titulo || 'Canto personalizado'}</h2>
          {!userSong && <p class={styles.hint}>Cargando...</p>}
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
        ? slide.startVerse !== slide.endVerse
          ? `${slide.startVerse}-${slide.endVerse}`
          : `${slide.startVerse}`
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

    case 'presentation': {
      const thumb = slide.imageUrls?.[0];
      return (
        <div class={`${styles.slideCard} ${styles.presentationCard}`}>
          <div class={styles.slideLabel}><ImageIcon size={14} /> PRESENTACIÓN</div>
          <div class={styles.presentationContent}>
            <div class={styles.presentationInfo}>
              <h2 class={styles.slideTitle}>{slide.title || 'Presentación'}</h2>
            </div>
            {thumb && (
              <img src={thumb} alt="preview" class={styles.presentationThumb} />
            )}
          </div>
        </div>
      );
    }
  }
}
