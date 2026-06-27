import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
  footer?: ComponentChildren;
  className?: string;
}

type ModalState = 'closed' | 'opening' | 'open' | 'closing';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ModalState>('closed');
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const closeThreshold = 120;

  useEffect(() => {
    if (isOpen && state !== 'open' && state !== 'opening') {
      setState('opening');
    } else if (!isOpen && state === 'open') {
      setState('closing');
    }
  }, [isOpen, state]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state === 'open') {
        setState('closing');
      }
    };

    if (state === 'open' || state === 'opening') {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [state]);

  useEffect(() => {
    if (state === 'opening') {
      const timer = setTimeout(() => setState('open'), 300);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClose = useCallback(() => {
    if (state === 'open' || state === 'opening') {
      onClose();
      setState('closing');
    }
  }, [state, onClose]);

  const handleAnimationEnd = useCallback(() => {
    if (state === 'closing') {
      setState('closed');
      setDragOffset(0);
    }
  }, [state]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (state !== 'open') return;

    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    const isAtTop = e.clientY < rect.top + 60;

    if (isAtTop) {
      isDragging.current = true;
      startY.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  }, [state]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;

    const delta = e.clientY - startY.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    setDragOffset(0);

    if (dragOffset > closeThreshold) {
      handleClose();
    }
  }, [dragOffset, handleClose]);

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (state === 'closed') return null;

  const isVisible = state === 'open' || state === 'opening';
  const isClosing = state === 'closing';
  const backdropOpacity = isClosing ? 0.2 : 0.5;
  const dragProgress = Math.min(dragOffset / 200, 1);

  return (
    <div
      class={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ''}`}
      onClick={handleBackdropClick}
      style={{
        backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div
        class={`${styles.modal} ${isClosing ? styles.modalClosing : ''} ${className || ''}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onAnimationEnd={handleAnimationEnd}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px) scale(${1 - dragProgress * 0.05})` : undefined
        }}
      >
        <div class={styles.dragIndicator} />

        {title && (
          <header class={styles.header}>
            <h2 class={styles.title}>{title}</h2>
            <button class={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
        )}
        <div class={styles.content}>
          {children}
        </div>
        {footer && (
          <footer class={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
