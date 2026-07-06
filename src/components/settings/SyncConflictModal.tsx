import { Modal } from '../ui/Modal';
import type { CloudFavorites } from '../../services/cloudFavoritesService';
import styles from './SyncConflictModal.module.css';

interface SyncConflictModalProps {
  isOpen: boolean;
  local: CloudFavorites;
  cloud: CloudFavorites;
  onResolve: (choice: 'local' | 'cloud' | 'merge') => void;
  onClose: () => void;
}

export function SyncConflictModal({ isOpen, local, cloud, onResolve, onClose }: SyncConflictModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conflicto de sincronización">
      <p class={styles.description}>
        Tienes favoritos tanto en este dispositivo como en la nube y son diferentes.
        ¿Qué deseas hacer?
      </p>

      <div class={styles.comparison}>
        <div class={styles.column}>
          <h3 class={styles.columnTitle}>Este dispositivo</h3>
          <ul class={styles.countList}>
            <li>Himnos: {local.himnos.length}</li>
            <li>Biblia: {local.biblia.length}</li>
            <li>Cantos: {local.cantos.length}</li>
          </ul>
        </div>
        <div class={styles.column}>
          <h3 class={styles.columnTitle}>Nube</h3>
          <ul class={styles.countList}>
            <li>Himnos: {cloud.himnos.length}</li>
            <li>Biblia: {cloud.biblia.length}</li>
            <li>Cantos: {cloud.cantos.length}</li>
          </ul>
        </div>
      </div>

      <div class={styles.actions}>
        <button class={styles.btn} onClick={() => onResolve('local')}>
          Usar estos (local)
        </button>
        <button class={styles.btn} onClick={() => onResolve('cloud')}>
          Usar estos (nube)
        </button>
        <button class={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onResolve('merge')}>
          Combinar ambos
        </button>
      </div>
    </Modal>
  );
}
