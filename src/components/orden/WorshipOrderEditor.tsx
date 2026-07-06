import { useState, useEffect } from 'preact/hooks';
import { getOrder, saveOrder, generateId } from '../../services/ordenStorage';
import type { WorshipOrder, WorshipSlide, WorshipSlideType, Posture, ReadingFlow, Church } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getBookById, BOOKS } from '../../data/books';
import { getHimno, fetchHimnos } from '../../services/api';
import { fetchChapter } from '../../services/bibleApi';
import type { Himno, UserSong } from '../../types/himno';
import { getCurrentUser } from '../../services/authService';
import { saveOrderToCloud } from '../../services/cloudOrdenService';
import { getUserChurches } from '../../services/churchService';
import { getUserSongs } from '../../services/userSongStorage';
import { ChevronUpIcon, ChevronDownIcon, DeleteIcon, PlusIcon, ChevronLeftIcon, ShareIcon, MusicNoteIcon } from '../ui/Icons';
import styles from './WorshipOrderEditor.module.css';

interface Props {
  orderId: string;
  onNavigate: (path: string) => void;
}

type SlideTab = 'slide' | 'hymn' | 'bible-reading' | 'user-song';

export function WorshipOrderEditor({ orderId, onNavigate }: Props) {
  const [order, setOrder] = useState<WorshipOrder>(() => {
    const existing = getOrder(orderId);
    return existing || { id: orderId, title: '', slides: [], createdAt: Date.now(), updatedAt: Date.now() };
  });
  const [addTab, setAddTab] = useState<SlideTab | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPosture, setNewPosture] = useState<Posture>('sitting');
  const [newReadingFlow, setNewReadingFlow] = useState<ReadingFlow>('together');
  const [hymnInput, setHymnInput] = useState('');
  const [hymnPreview, setHymnPreview] = useState<Himno | null>(null);
  const [hymnSearch, setHymnSearch] = useState('');
  const [showHymnDropdown, setShowHymnDropdown] = useState(false);
  const [allHimnos, setAllHimnos] = useState<Himno[]>([]);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);

  useEffect(() => {
    fetchHimnos().then(setAllHimnos);
    setUserSongs(getUserSongs());
  }, []);

  const normalizedHymnQuery = hymnSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hymnSearchNum = parseInt(hymnSearch, 10);
  const filteredHimnos = allHimnos.filter(h => {
    if (!h) return false;
    const titleMatch = h.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery);
    const numMatch = !isNaN(hymnSearchNum) && h.numero === hymnSearchNum;
    const lyricMatch = h.versos.some(v => v.lineas.some(l =>
      l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery)
    ));
    return titleMatch || numMatch || lyricMatch;
  }).slice(0, 20);

  const filteredUserSongs = userSongs.filter(s => {
    const titleMatch = s.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery);
    const lyricMatch = s.versos.some(v => v.lineas.some(l =>
      l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery)
    ));
    return titleMatch || lyricMatch;
  }).slice(0, 10);

  const highlightMatch = (text: string) => {
    const idx = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(normalizedHymnQuery);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + hymnSearch.length);
    const after = text.slice(idx + hymnSearch.length);
    return <>{before}<u>{match}</u>{after}</>;
  };

  const findMatchingVerse = (h: Himno): string | null => {
    for (const verso of h.versos) {
      for (const linea of verso.lineas) {
        if (linea.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery)) {
          return linea;
        }
      }
    }
    return null;
  };

  const isTitleMatch = (h: Himno): boolean => {
    return !!(h.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedHymnQuery)
      || (!isNaN(hymnSearchNum) && h.numero === hymnSearchNum));
  };

  const selectHymn = (h: Himno) => {
    setHymnInput(String(h.numero));
    setHymnPreview(h as any);
    setHymnSearch('');
    setShowHymnDropdown(false);
  };

  const selectUserSong = (s: UserSong) => {
    setHymnPreview(s as any);
    setHymnInput(s.titulo);
    setHymnSearch('');
    setShowHymnDropdown(false);
  };
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [chapterInput, setChapterInput] = useState('1');
  const [startVerse, setStartVerse] = useState('1');
  const [endVerse, setEndVerse] = useState('');
  const [verseCount, setVerseCount] = useState(0);
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  const { color, theme } = useSettings();
  const [isPublic, setIsPublic] = useState(order.isPublic || false);
  const [shareChurchId, setShareChurchId] = useState(order.churchId || '');
  const [showPublicUrl, setShowPublicUrl] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const user = getCurrentUser();
  const [userChurches, setUserChurches] = useState<Church[]>([]);

  useEffect(() => {
    if (user) {
      getUserChurches(user.uid).then(setUserChurches);
    }
  }, [user]);

  const selectedBook = selectedBookId ? getBookById(selectedBookId) : undefined;
  const maxChapter = selectedBook ? selectedBook.chapters : 0;
  const chNum = parseInt(chapterInput, 10);
  const maxVerses = verseCount;

  useEffect(() => {
    if (!selectedBookId || !chNum || chNum < 1 || chNum > maxChapter) {
      setVerseCount(0);
      return;
    }
    fetchChapter(selectedBookId, chNum).then(verses => {
      const count = verses.length;
      setVerseCount(count);
      setStartVerse(prev => {
        const p = parseInt(prev, 10);
        return isNaN(p) || p < 1 ? '1' : p > count ? String(count) : prev;
      });
      setEndVerse(prev => {
        const p = parseInt(prev, 10);
        if (prev === '' || isNaN(p) || p < 1) return String(count);
        return p > count ? String(count) : prev;
      });
    });
  }, [selectedBookId, chNum]);

  useEffect(() => {
    if (parseInt(startVerse, 10) > parseInt(endVerse, 10)) {
      setEndVerse(startVerse);
    }
  }, [startVerse, endVerse]);

  const handleSelectBook = (bookId: string) => {
    const book = getBookById(bookId);
    if (!book) return;
    setSelectedBookId(bookId);
    setBookSearch(book.nombre);
    setShowBookDropdown(false);
    const prevCh = parseInt(chapterInput, 10);
    if (isNaN(prevCh) || prevCh < 1 || prevCh > book.chapters) {
      setChapterInput(String(book.chapters));
    }
  };

  useEffect(() => {
    if (hymnInput) {
      const num = parseInt(hymnInput, 10);
      if (!isNaN(num) && num >= 1 && num <= 706) {
        getHimno(num).then(h => setHymnPreview(h || null));
      } else {
        setHymnPreview(null);
      }
    } else {
      setHymnPreview(null);
    }
  }, [hymnInput]);

  const handleSave = async () => {
    const updated: WorshipOrder = {
      ...order,
      isPublic,
      churchId: shareChurchId || undefined,
      authorId: user?.uid || order.authorId,
      authorName: user?.displayName || user?.email || order.authorName,
      updatedAt: Date.now(),
    };
    if (user && (isPublic || shareChurchId)) {
      try {
        const cloudId = await saveOrderToCloud(updated, user.uid);
        updated.cloudId = cloudId;
      } catch (err) {
        console.error('Cloud save failed:', err);
      }
    }
    saveOrder(updated);
    onNavigate(`orden/${orderId}`);
  };

  const handleShareClick = async () => {
    if (!user) return;
    if (isPublic && order.cloudId) {
      setShowPublicUrl(!showPublicUrl);
      return;
    }
    setPublishLoading(true);
    try {
      const updated: WorshipOrder = {
        ...order,
        isPublic: true,
        churchId: shareChurchId || undefined,
        authorId: user.uid,
        authorName: user.displayName || user.email || '',
        updatedAt: Date.now(),
      };
      const cloudId = await saveOrderToCloud(updated, user.uid);
      updated.cloudId = cloudId;
      saveOrder(updated);
      setOrder(updated);
      setIsPublic(true);
      setShowPublicUrl(true);
    } catch (err) {
      console.error('Publish error:', err);
    }
    setPublishLoading(false);
  };

  const publicUrl = order.cloudId ? `${window.location.origin}/#orden/${order.cloudId}` : '';

  const addSlide = () => {
    if (!addTab) return;
    const slide: WorshipSlide = { id: generateId(), type: addTab };

    switch (addTab) {
      case 'slide':
        slide.title = newTitle;
        slide.subtitle = newSubtitle;
        slide.posture = newPosture;
        break;
      case 'hymn': {
        const num = hymnPreview && 'numero' in hymnPreview ? (hymnPreview as Himno).numero : parseInt(hymnInput, 10);
        if (!num || isNaN(num)) return;
        slide.hymnNumber = num;
        slide.posture = newPosture;
        break;
      }
      case 'user-song': {
        const userSong = hymnPreview as unknown as UserSong;
        if (!userSong || !userSong.id) return;
        slide.userSongId = userSong.id;
        slide.title = userSong.titulo;
        slide.posture = newPosture;
        break;
      }
      case 'bible-reading':
        if (!selectedBookId || !chNum || chNum < 1 || chNum > maxChapter) return;
        slide.bookId = selectedBookId;
        slide.chapter = chNum;
        if (startVerse) slide.startVerse = parseInt(startVerse, 10);
        if (endVerse) slide.endVerse = parseInt(endVerse, 10);
        slide.posture = newPosture;
        slide.readingFlow = newReadingFlow;
        break;
    }

    setOrder(prev => ({ ...prev, slides: [...prev.slides, slide], updatedAt: Date.now() }));

    setNewTitle('');
    setNewSubtitle('');
    setNewPosture('sitting');
    setNewReadingFlow('together');
    setHymnInput('');
    setHymnPreview(null);
    setBookSearch('');
    setSelectedBookId('');
    setChapterInput('1');
    setStartVerse('1');
    setEndVerse('');
    setVerseCount(0);
    setShowBookDropdown(false);
    setAddTab(null);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const slides = [...order.slides];
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    [slides[idx], slides[target]] = [slides[target], slides[idx]];
    setOrder(prev => ({ ...prev, slides, updatedAt: Date.now() }));
  };

  const removeSlide = (idx: number) => {
    setOrder(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== idx),
      updatedAt: Date.now()
    }));
  };

  const filteredBooks = BOOKS.filter(b =>
    b.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
      bookSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
  );

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate(`orden/${orderId}`)}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.headerTitle}>{order.title || 'Nueva Orden'}</h1>
        <button class={styles.saveBtn} onClick={handleSave}>Guardar</button>
      </header>

      <main class={styles.main}>
        <div class={styles.titleSection}>
          <label class={styles.label}>Título de la orden</label>
          <input
            class={styles.input}
            value={order.title}
            onInput={(e) => setOrder(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
            placeholder="Ej: Culto Dominical"
          />
        </div>

        <div class={styles.metaFields}>
          <div class={styles.metaRow}>
            <div class={styles.metaField}>
              <label class={styles.label}>Fecha</label>
              <input type="date" class={styles.input}
                value={order.date || ''}
                onInput={(e) => setOrder(prev => ({ ...prev, date: (e.target as HTMLInputElement).value || undefined }))} />
            </div>
            <div class={styles.metaField}>
              <label class={styles.label}>Hora inicio</label>
              <input type="time" class={styles.input}
                value={order.startTime || ''}
                onInput={(e) => setOrder(prev => ({ ...prev, startTime: (e.target as HTMLInputElement).value || undefined }))} />
            </div>
            <div class={styles.metaField}>
              <label class={styles.label}>Hora fin <span class={styles.optional}>(opcional)</span></label>
              <input type="time" class={styles.input}
                value={order.endTime || ''}
                onInput={(e) => setOrder(prev => ({ ...prev, endTime: (e.target as HTMLInputElement).value || undefined }))} />
            </div>
          </div>
          <div class={styles.metaField}>
            <label class={styles.label}>Descripción <span class={styles.optional}>(opcional)</span></label>
            <textarea class={`${styles.input} ${styles.textarea}`}
              value={order.description || ''}
              onInput={(e) => setOrder(prev => ({ ...prev, description: (e.target as HTMLInputElement).value || undefined }))}
              placeholder="Breve descripción del culto..."
              rows={2} />
          </div>
        </div>

        {user && (
          <div class={styles.sharingSection}>
            <div class={styles.sharingHeader}>
              <label class={styles.label}>Compartir</label>
              <button class={styles.shareIconBtn} onClick={handleShareClick} disabled={publishLoading}
                title={isPublic ? 'Ver enlace público' : 'Compartir como público'}>
                <ShareIcon size={20} />
                {isPublic && <span class={styles.publicBadge}>Público</span>}
              </button>
            </div>
            {showPublicUrl && publicUrl && (
              <div class={styles.publicUrlBox}>
                <input class={styles.publicUrlInput} value={publicUrl} readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button class={styles.copyBtn} onClick={() => {
                  navigator.clipboard.writeText(publicUrl).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}>
                  {linkCopied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
            {userChurches.length > 0 && (
              <div class={styles.sharingOptions}>
                <label class={styles.sharingToggle}>
                  <input type="checkbox" checked={!!shareChurchId}
                    onChange={() => {
                      if (shareChurchId) {
                        setShareChurchId('');
                      } else if (userChurches.length > 0) {
                        setShareChurchId(userChurches[0].id);
                      }
                    }} />
                  <span>Compartir en iglesia</span>
                </label>
                {!!shareChurchId && (
                  <select class={`${styles.select} ${styles.sharingSelect}`} value={shareChurchId}
                    onChange={(e) => setShareChurchId((e.target as HTMLSelectElement).value)}>
                    {userChurches.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        <div class={styles.slidesSection}>
          {order.slides.map((slide, idx) => (
            <div key={slide.id} class={styles.slideCard}>
              <div class={styles.slideCardHeader}>
                <span class={styles.slideType}>{slideTypeLabel(slide.type)}</span>
                <div class={styles.slideActions}>
                  <button class={styles.moveBtn} disabled={idx === 0} onClick={() => moveSlide(idx, -1)}>
                    <ChevronUpIcon size={18} />
                  </button>
                  <button class={styles.moveBtn} disabled={idx === order.slides.length - 1} onClick={() => moveSlide(idx, 1)}>
                    <ChevronDownIcon size={18} />
                  </button>
                  <button class={styles.removeBtn} onClick={() => removeSlide(idx)}>
                    <DeleteIcon size={18} />
                  </button>
                </div>
              </div>
              <div class={styles.slidePreview}>
                {slide.type === 'slide' && (
                  <>
                    <strong>{slide.title || '(Sin título)'}</strong>
                    {slide.subtitle && <span class={styles.subtitle}>{slide.subtitle}</span>}
                    {slide.posture && (
                      <span class={styles.postureBadge}>
                        {slide.posture === 'standing' ? 'DE PIE' : 'SENTADOS'}
                      </span>
                    )}
                  </>
                )}
                {slide.type === 'hymn' && (
                  <>
                    <span>Himno {slide.hymnNumber}</span>
                    {slide.posture && (
                      <span class={styles.postureBadge}>
                        {slide.posture === 'standing' ? 'DE PIE' : 'SENTADOS'}
                      </span>
                    )}
                  </>
                )}
                {slide.type === 'user-song' && (
                  <>
                    <MusicNoteIcon size={16} />
                    <span>{slide.title || 'Canto personalizado'}</span>
                    {slide.posture && (
                      <span class={styles.postureBadge}>
                        {slide.posture === 'standing' ? 'DE PIE' : 'SENTADOS'}
                      </span>
                    )}
                  </>
                )}
                {slide.type === 'bible-reading' && (
                  <>
                    <span>{getBookById(slide.bookId || '')?.nombre || slide.bookId} {slide.chapter}
                      {slide.startVerse && slide.endVerse
                        ? slide.startVerse !== slide.endVerse
                          ? `:${slide.startVerse}-${slide.endVerse}`
                          : `:${slide.startVerse}`
                        : slide.startVerse ? `:${slide.startVerse}` : ''}
                    </span>
                    {slide.posture && (
                      <span class={styles.postureBadge}>
                        {slide.posture === 'standing' ? 'DE PIE' : 'SENTADOS'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {addTab && (
          <div class={styles.addForm}>
            <div class={styles.addFormTabs}>
              {(['slide', 'hymn', 'user-song', 'bible-reading'] as SlideTab[]).map(tab => (
                <button
                  key={tab}
                  class={`${styles.addFormTab} ${addTab === tab ? styles.activeTab : ''} ${styles[color]}`}
                  onClick={() => setAddTab(tab)}
                >
                  {tab === 'slide' ? 'Título' : tab === 'hymn' ? 'Himno' : tab === 'user-song' ? 'Mi canto' : 'Lectura'}
                </button>
              ))}
            </div>

            {addTab === 'slide' && (
              <div class={styles.addFormBody}>
                <input class={styles.input} placeholder="Título" value={newTitle}
                  onInput={(e) => setNewTitle((e.target as HTMLInputElement).value)} />
                <input class={styles.input} placeholder="Subtítulo (opcional)" value={newSubtitle}
                  onInput={(e) => setNewSubtitle((e.target as HTMLInputElement).value)} />
                <div class={styles.postureToggle}>
                  <label>
                    <input type="radio" name="posture" checked={newPosture === 'sitting'}
                      onChange={() => setNewPosture('sitting')} /> Sentados
                  </label>
                  <label>
                    <input type="radio" name="posture" checked={newPosture === 'standing'}
                      onChange={() => setNewPosture('standing')} /> De pie
                  </label>
                </div>
              </div>
            )}

            {addTab === 'hymn' && (
              <div class={styles.addFormBody}>
                <div class={styles.autocompleteWrapper}>
                  <input class={styles.input} placeholder="Buscar himno por nombre, número o letra..." value={hymnSearch}
                    onInput={(e) => { setHymnSearch((e.target as HTMLInputElement).value); setShowHymnDropdown(true); }}
                    onFocus={() => setShowHymnDropdown(true)}
                    onBlur={() => setTimeout(() => setShowHymnDropdown(false), 200)} />
                  {showHymnDropdown && hymnSearch && filteredHimnos.length > 0 && (
                    <div class={styles.autocompleteDropdown}>
                      {filteredHimnos.map(h => (
                        <button key={h.numero} class={styles.autocompleteItem}
                          onMouseDown={() => selectHymn(h)}>
                          <strong>{h.numero}.</strong> {highlightMatch(h.titulo)}
                          {!isTitleMatch(h) && findMatchingVerse(h) && (
                            <div class={styles.matchVerse}>— {highlightMatch(findMatchingVerse(h)!)}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {showHymnDropdown && hymnSearch && filteredHimnos.length === 0 && (
                    <div class={styles.autocompleteDropdown}>
                      <span class={styles.autocompleteEmpty}>Sin resultados</span>
                    </div>
                  )}
                </div>
                {hymnPreview && (
                  <div class={styles.hymnPreview}>
                    <strong>Himno {hymnPreview.numero}. {hymnPreview.titulo}</strong>
                    <p class={styles.hymnPreviewVerses}>{hymnPreview.versos.length} verso(s)</p>
                  </div>
                )}
                <div class={styles.postureToggle}>
                  <label>
                    <input type="radio" name="hymnPosture" checked={newPosture === 'sitting'}
                      onChange={() => setNewPosture('sitting')} /> Sentados
                  </label>
                  <label>
                    <input type="radio" name="hymnPosture" checked={newPosture === 'standing'}
                      onChange={() => setNewPosture('standing')} /> De pie
                  </label>
                </div>
              </div>
            )}

            {addTab === 'user-song' && (
              <div class={styles.addFormBody}>
                <div class={styles.autocompleteWrapper}>
                  <input class={styles.input} placeholder="Buscar en Mis cantos..." value={hymnSearch}
                    onInput={(e) => { setHymnSearch((e.target as HTMLInputElement).value); setShowHymnDropdown(true); }}
                    onFocus={() => setShowHymnDropdown(true)}
                    onBlur={() => setTimeout(() => setShowHymnDropdown(false), 200)} />
                  {showHymnDropdown && hymnSearch && filteredUserSongs.length > 0 && (
                    <div class={styles.autocompleteDropdown}>
                      {filteredUserSongs.map(s => (
                        <button key={s.id} class={styles.autocompleteItem}
                          onMouseDown={() => selectUserSong(s)}>
                          <MusicNoteIcon size={14} />
                          <strong>{highlightMatch(s.titulo)}</strong>
                          <span class={styles.songAuthorBadge}>{s.autores[0] || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showHymnDropdown && hymnSearch && filteredUserSongs.length === 0 && filteredHimnos.length === 0 && (
                    <div class={styles.autocompleteDropdown}>
                      <span class={styles.autocompleteEmpty}>Sin resultados</span>
                    </div>
                  )}
                </div>
                {hymnPreview && (
                  <div class={styles.hymnPreview}>
                    <strong>{hymnPreview.titulo}</strong>
                    <p class={styles.hymnPreviewVerses}>{hymnPreview.versos.length} verso(s)</p>
                  </div>
                )}
                <div class={styles.postureToggle}>
                  <label>
                    <input type="radio" name="userSongPosture" checked={newPosture === 'sitting'}
                      onChange={() => setNewPosture('sitting')} /> Sentados
                  </label>
                  <label>
                    <input type="radio" name="userSongPosture" checked={newPosture === 'standing'}
                      onChange={() => setNewPosture('standing')} /> De pie
                  </label>
                </div>
              </div>
            )}

            {addTab === 'bible-reading' && (
              <div class={styles.addFormBody}>
                <div class={styles.autocompleteWrapper}>
                  <input class={styles.input} placeholder="Buscar libro..." value={bookSearch}
                    onInput={(e) => { setBookSearch((e.target as HTMLInputElement).value); setShowBookDropdown(true); }}
                    onFocus={() => setShowBookDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)} />
                  {showBookDropdown && bookSearch && (
                    <div class={styles.autocompleteDropdown}>
                      {filteredBooks.map(book => (
                        <button key={book.id} class={styles.autocompleteItem}
                          onMouseDown={() => handleSelectBook(book.id)}>
                          {book.nombre}
                        </button>
                      ))}
                      {filteredBooks.length === 0 && (
                        <span class={styles.autocompleteEmpty}>Sin resultados</span>
                      )}
                    </div>
                  )}
                </div>
                {selectedBook && (
                  <div class={styles.verseConfig}>
                    <div class={styles.verseRow}>
                      <label>Capítulo</label>
                      <select class={styles.select} value={chapterInput}
                        onChange={(e) => setChapterInput((e.target as HTMLSelectElement).value)}>
                        {Array.from({ length: maxChapter }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    {maxVerses > 0 && (
                      <>
                        <div class={styles.verseRow}>
                          <label>Versículo inicio</label>
                          <select class={styles.select} value={startVerse}
                            onChange={(e) => {
                              const v = (e.target as HTMLSelectElement).value;
                              setStartVerse(v);
                              if (parseInt(v, 10) > parseInt(endVerse, 10)) setEndVerse(v);
                            }}>
                            {Array.from({ length: maxVerses }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div class={styles.verseRow}>
                          <label>Versículo fin</label>
                          <select class={styles.select} value={endVerse}
                            onChange={(e) => {
                              const v = (e.target as HTMLSelectElement).value;
                              setEndVerse(v);
                              if (parseInt(v, 10) < parseInt(startVerse, 10)) setStartVerse(v);
                            }}>
                            {Array.from({ length: maxVerses }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div class={styles.postureToggle}>
                  <label>
                    <input type="radio" name="biblePosture" checked={newPosture === 'sitting'}
                      onChange={() => setNewPosture('sitting')} /> Sentados
                  </label>
                  <label>
                    <input type="radio" name="biblePosture" checked={newPosture === 'standing'}
                      onChange={() => setNewPosture('standing')} /> De pie
                  </label>
                </div>
                <div class={styles.readingFlowSection}>
                  <span class={styles.label}>Flujo de lectura</span>
                  <div class={styles.readingFlowOptions}>
                    <label class={styles.flowOption}>
                      <input type="radio" name="readingFlow" checked={newReadingFlow === 'pulpit'}
                        onChange={() => setNewReadingFlow('pulpit')} />
                      <span class={styles.flowLabel}>Púlpito</span>
                    </label>
                    <label class={styles.flowOption}>
                      <input type="radio" name="readingFlow" checked={newReadingFlow === 'congregation'}
                        onChange={() => setNewReadingFlow('congregation')} />
                      <span class={styles.flowLabel}>Iglesia</span>
                    </label>
                    <label class={styles.flowOption}>
                      <input type="radio" name="readingFlow" checked={newReadingFlow === 'together'}
                        onChange={() => setNewReadingFlow('together')} />
                      <span class={styles.flowLabel}>Todos juntos</span>
                    </label>
                    <label class={styles.flowOption}>
                      <input type="radio" name="readingFlow" checked={newReadingFlow === 'antiphonal'}
                        onChange={() => setNewReadingFlow('antiphonal')} />
                      <span class={styles.flowLabel}>Antifonal</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <button class={`${styles.confirmAddBtn} ${styles[color]}`} onClick={addSlide}>
              Agregar
            </button>
          </div>
        )}

        {!addTab && (
          <button class={`${styles.addSlideBtn} ${styles[color]}`} onClick={() => setAddTab('slide')}>
            <PlusIcon size={20} /> Agregar Slide
          </button>
        )}
      </main>
    </div>
  );
}

function slideTypeLabel(type: WorshipSlideType): string {
  switch (type) {
    case 'slide': return 'Título';
    case 'hymn': return 'Himno';
    case 'user-song': return 'Mi canto';
    case 'bible-reading': return 'Lectura';
  }
}
