import { useState, useEffect, useRef } from 'preact/hooks';
import * as pdfjsLib from 'pdfjs-dist';
import { getExternalPdfUrl } from '../../services/api';
import { CloseIcon, ExpandIcon, CompressIcon, ZoomInIcon, ZoomOutIcon } from '../ui/Icons';
import styles from './PdfViewer.module.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  numero: number;
  onClose: () => void;
  color: string;
  theme: string;
}

export function PdfViewer({ numero, onClose, color, theme }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const usePdfJs = theme === 'dark' || theme === 'oled' || theme === 'sepia';
  const invertColor = theme === 'dark' || theme === 'oled';
  const pdfUrl = usePdfJs ? `/himnos/${numero}.pdf` : getExternalPdfUrl(numero);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(getExternalPdfUrl(numero))}&embedded=true`;

  useEffect(() => {
    if (!usePdfJs) return;

    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = window.innerWidth - 32;
        const initialScale = Math.min(Math.max(containerWidth / viewport.width, 0.5), 3);
        setScale(initialScale);
      } catch (err) {
        console.error('[PdfViewer] Error loading PDF:', err);
        setError('No se pudo cargar la partitura');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl, usePdfJs]);

  useEffect(() => {
    if (!usePdfJs || !pdfDocRef.current || loading) return;
    renderPage();
  }, [scale, usePdfJs, loading]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        setIsOverflowing(canvas.offsetWidth > container.offsetWidth);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading, scale]);

  const renderPage = async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;
    } catch (err) {
      console.error('[PdfViewer] Error rendering page:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  return (
    <div class={styles.container}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.closeBtn} onClick={onClose}>
          <CloseIcon size={24} />
        </button>
        <div class={styles.controls}>
          {usePdfJs && (
            <>
              <button class={styles.controlBtn} onClick={zoomOut} title="Alejar">
                <ZoomOutIcon size={20} />
              </button>
              <span class={styles.scaleInfo}>{Math.round(scale * 100)}%</span>
              <button class={styles.controlBtn} onClick={zoomIn} title="Acercar">
                <ZoomInIcon size={20} />
              </button>
            </>
          )}
          <button
            class={styles.controlBtnFullscreen}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <CompressIcon size={20} /> : <ExpandIcon size={20} />}
          </button>
        </div>
      </header>

      <main class={styles.main}>
        {usePdfJs ? (
          <div ref={containerRef} class={`${styles.pdfJsContainer} ${theme === 'oled' ? styles.oled : theme === 'sepia' ? styles.sepia : styles.dark}`}>
            {loading && <div class={styles.loading}>Cargando partitura...</div>}
            {error && <div class={styles.error}>{error}</div>}
            <div class={`${styles.canvasWrapper} ${isOverflowing ? styles.alignStart : ''}`}>
              <canvas ref={canvasRef} class={`${styles.canvas} ${invertColor ? styles.inverted : ''}`} />
            </div>
          </div>
        ) : (
          <div class={`${styles.iframeContainer} ${theme === 'oled' ? styles.oled : theme === 'sepia' ? styles.sepia : theme === 'dark' ? styles.dark : ''}`}>
            <iframe
              src={googleViewerUrl}
              class={styles.iframe}
              title={`Partitura Himno ${numero}`}
              allowFullScreen
            />
          </div>
        )}
      </main>
    </div>
  );
}
