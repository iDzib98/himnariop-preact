import { useState } from 'preact/hooks';
import { CloseIcon, ExpandIcon, CompressIcon } from '../ui/Icons';
import styles from '../hymn/PdfViewer.module.css';

interface PdfViewerProps {
  pdfUrl: string;
  onClose: () => void;
  color?: string;
}

export function UserSongPdfViewer({ pdfUrl, onClose, color = 'deepOrange' }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div class={styles.container}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.closeBtn} onClick={onClose}>
          <CloseIcon size={24} />
        </button>
        <span class={styles.title}>Partitura</span>
        <div class={styles.controls}>
          <button
            class={styles.controlBtnFullscreen}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <CompressIcon size={20} /> : <ExpandIcon size={20} />}
          </button>
        </div>
      </header>
      <div class={styles.main}>
        <div class={styles.iframeContainer}>
          <iframe
            src={googleViewerUrl}
            class={styles.iframe}
            title="Partitura"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
