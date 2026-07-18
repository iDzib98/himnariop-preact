import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { parseReference } from '../../services/referenceParser';
import { fetchVerses, type FetchedVerses } from '../../services/verseFetcher';
import { fixVerseBreaks } from '../../services/rvr1960Api';
import { storage } from '../../services/storage';
import { BIBLE_VERSIONS } from '../../data/bibleVersions';
import { getBookById } from '../../data/books';
import styles from './BibleTooltip.module.css';

interface Props {
  reference: string;
  children: preact.ComponentChildren;
}

export function BibleTooltip({ reference, children }: Props) {
  const [active, setActive] = useState(false);
  const [data, setData] = useState<FetchedVerses | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [below, setBelow] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const parsed = parseReference(reference);

  // Reset state when reference changes (handles hymn navigation reusing component instances)
  const prevRef = useRef(reference);
  useEffect(() => {
    if (prevRef.current !== reference) {
      prevRef.current = reference;
      setData(null);
      setLoaded(false);
      setError(false);
      setLoading(false);
    }
  }, [reference]);

  const loadVerses = useCallback(async () => {
    if (!parsed || loaded) return;
    setLoading(true);
    try {
      const result = await fetchVerses(parsed.bookId, parsed.chapter, parsed.verses);
      if (result) {
        setData(result);
        setLoaded(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [parsed, loaded]);

  // Check if tooltip should appear below (not enough space above)
  const checkPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setBelow(rect.top < 200);
  }, []);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    checkPosition();
    setActive(true);
    loadVerses();
  }, [checkPosition, loadVerses]);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActive(false), 200);
  }, []);

  const toggle = useCallback((e: Event) => {
    e.stopPropagation();
    if (active) {
      setActive(false);
    } else {
      checkPosition();
      setActive(true);
      loadVerses();
    }
  }, [active, checkPosition, loadVerses]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!active) return;
    const handler = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [active]);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!parsed) {
    return <span>{children}</span>;
  }

  const versionId = storage.bibleVersion;
  const versionName = BIBLE_VERSIONS.find(v => v.id === versionId)?.name || versionId;

  const book = getBookById(parsed.bookId);
  const bookName = book?.nombre || parsed.bookId;
  const prefixMatch = parsed.label.match(/^((?:\d+|C)-\s*)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  let verseStr = String(parsed.chapter);
  if (parsed.verses.length > 0) {
    verseStr += ':' + parsed.verses.join(',');
  }
  const displayLabel = `${prefix}${bookName} ${verseStr}`;

  const tooltipClass = [
    styles.tooltip,
    below ? styles.below : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapperRef}
      class={`${styles.wrapper} ${active ? styles.active : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={toggle}
    >
      {children}
      {active && (
        <div class={tooltipClass}>
          <div class={styles.tooltipHeader}>{displayLabel}</div>
          {loading && <div class={styles.loading}>Cargando...</div>}
          {error && <div class={styles.error}>No se pudo cargar el versículo</div>}
          {data && data.verses.length > 0 && (
            <div>
              {data.verses.map(v => (
                <p key={v.verse} class={styles.verseText}>
                  <span class={styles.verseNumber}>{v.verse}</span>
                  {fixVerseBreaks(v.text, ' ')}
                </p>
              ))}
            </div>
          )}
          {data && (
            <div class={styles.versionLabel}>{versionName}</div>
          )}
        </div>
      )}
    </div>
  );
}
