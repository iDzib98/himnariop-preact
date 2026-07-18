import { useState, useRef, useCallback } from 'preact/hooks';
import styles from './AnnotationMarker.module.css';

interface Props {
  annotations: string[];
}

export function AnnotationMarker({ annotations }: Props) {
  const [active, setActive] = useState(false);
  const [below, setBelow] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const checkPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setBelow(rect.top < 200);
  }, []);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    checkPosition();
    setActive(true);
  }, [checkPosition]);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActive(false), 200);
  }, []);

  const toggle = useCallback((e: Event) => {
    e.stopPropagation();
    setActive(a => !a);
  }, []);

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
      <span class={styles.marker}>*</span>
      {active && (
        <div class={tooltipClass}>
          {annotations.map((a, i) => (
            <p key={i} class={styles.annotationText}>{a}</p>
          ))}
        </div>
      )}
    </div>
  );
}
