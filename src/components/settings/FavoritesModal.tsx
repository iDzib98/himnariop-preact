import { useState, useEffect } from 'preact/hooks';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useFavorites } from '../../hooks/useFavorites';
import { useSettings } from '../../hooks/useSettings';
import { fetchHimnos } from '../../services/api';
import type { Himno } from '../../types/himno';
import { StarFilledIcon, DeleteIcon } from '../ui/Icons';
import styles from './FavoritesModal.module.css';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (numero: number) => void;
}

export function FavoritesModal({ isOpen, onClose, onNavigate }: FavoritesModalProps) {
  const { favorites, clearFavorites } = useFavorites();
  const { color } = useSettings();
  const [himnos, setHimnos] = useState<Himno[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchHimnos().then(setHimnos).catch(console.error);
    }
  }, [isOpen]);

  const favoriteHimnos = favorites
    .map(num => himnos.find(h => h && h.numero === num))
    .filter((h): h is Himno => h != null);

  const handleNavigate = (numero: number) => {
    onNavigate(numero);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Himnos Favoritos">
      {favoriteHimnos.length === 0 ? (
        <div class={styles.empty}>
          <StarFilledIcon size={48} className={styles.emptyIcon} />
          <p>No tienes himnos favoritos aún.</p>
          <p class={styles.hint}>Toca el icono de estrella en un himno para añadirlo a favoritos.</p>
        </div>
      ) : (
        <>
          <ul class={styles.list}>
            {favoriteHimnos.map(himno => (
              <li key={himno.numero} class={styles.item}>
                <button
                  class={`${styles.hymnBtn} ${styles[color]}`}
                  onClick={() => handleNavigate(himno.numero)}
                >
                  <span class={styles.number}>{himno.numero}</span>
                  <span class={styles.title}>{himno.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
          <div class={styles.footer}>
            <Button
              variant="text"
              color="red"
              onClick={clearFavorites}
            >
              <DeleteIcon size={18} />
              Limpiar favoritos
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
