import { useState, useEffect } from 'preact/hooks';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cacheService } from '../../services/cache';
import type { CacheEntry } from '../../types/himno';
import { useSettings } from '../../hooks/useSettings';
import { AudioIcon, PdfIcon, DeleteIcon } from '../ui/Icons';
import styles from './CacheManagerModal.module.css';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CacheManagerModal({ isOpen, onClose }: CacheManagerModalProps) {
  const { color } = useSettings();
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCacheInfo();
    }
  }, [isOpen]);

  const loadCacheInfo = async () => {
    setLoading(true);
    try {
      const [entries, size] = await Promise.all([
        cacheService.getCacheEntries(),
        cacheService.getTotalCacheSize()
      ]);
      setEntries(entries);
      setTotalSize(size);
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
    setLoading(false);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const audioEntries = entries.filter(e => e.type === 'audio');
  const pdfEntries = entries.filter(e => e.type === 'pdf');

  const handleClearAudio = async () => {
    await cacheService.clearCache('audio');
    loadCacheInfo();
  };

  const handleClearPdf = async () => {
    await cacheService.clearCache('pdf');
    loadCacheInfo();
  };

  const handleClearAll = async () => {
    await cacheService.clearAllCache();
    loadCacheInfo();
  };

  const maxStorage = 100 * 1024 * 1024; // 100 MB
  const usedPercentage = (totalSize / maxStorage) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Archivos Locales">
      {loading ? (
        <div class={styles.loading}>Cargando...</div>
      ) : (
        <>
          <div class={styles.storageInfo}>
            <div class={styles.storageBar}>
              <div
                class={styles.storageFill}
                style={{ width: `${Math.min(usedPercentage, 100)}%` }}
              />
            </div>
            <p class={styles.storageText}>
              {formatSize(totalSize)} usados de {formatSize(maxStorage)}
            </p>
          </div>

          <div class={styles.section}>
            <div class={styles.sectionHeader}>
              <AudioIcon size={24} />
              <h3>Audio cacheado</h3>
              <span class={styles.count}>{audioEntries.length} himnos ({formatSize(audioEntries.reduce((s, e) => s + e.size, 0))})</span>
            </div>
            {audioEntries.length > 0 && (
              <Button variant="outlined" color="red" size="small" onClick={handleClearAudio}>
                <DeleteIcon size={16} />
                Limpiar audio
              </Button>
            )}
          </div>

          <div class={styles.section}>
            <div class={styles.sectionHeader}>
              <PdfIcon size={24} />
              <h3>Partituras cacheadas</h3>
              <span class={styles.count}>{pdfEntries.length} himnos ({formatSize(pdfEntries.reduce((s, e) => s + e.size, 0))})</span>
            </div>
            {pdfEntries.length > 0 && (
              <Button variant="outlined" color="red" size="small" onClick={handleClearPdf}>
                <DeleteIcon size={16} />
                Limpiar partituras
              </Button>
            )}
          </div>

          {entries.length > 0 && (
            <div class={styles.clearAll}>
              <Button variant="text" color="red" onClick={handleClearAll}>
                <DeleteIcon size={18} />
                Limpiar todo
              </Button>
            </div>
          )}

          {entries.length === 0 && (
            <div class={styles.empty}>
              <p>No hay archivos cacheados.</p>
              <p class={styles.hint}>Los himnos que visites se cachearán automáticamente para uso offline.</p>
            </div>
          )}
        </>
      )}

      <div class={styles.footer}>
        <Button variant="filled" color={color} onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
