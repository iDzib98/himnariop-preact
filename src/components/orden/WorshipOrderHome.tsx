import { useState, useEffect } from 'preact/hooks';
import { getOrders, deleteOrder } from '../../services/ordenStorage';
import { generateId } from '../../services/ordenStorage';
import type { WorshipOrder } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { PlusIcon, DeleteIcon } from '../ui/Icons';
import styles from './WorshipOrderHome.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

export function WorshipOrderHome({ onNavigate }: Props) {
  const [orders, setOrders] = useState<WorshipOrder[]>([]);
  const { color, theme } = useSettings();

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleCreate = () => {
    const id = generateId();
    onNavigate(`orden/${id}/editar`);
  };

  const handleDelete = (id: string, e: Event) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta orden de culto?')) {
      deleteOrder(id);
      setOrders(getOrders());
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <div class={styles.header}>
        <button class={`${styles.createBtn} ${styles[color]}`} onClick={handleCreate}>
          <PlusIcon size={20} /> Nueva Orden
        </button>
      </div>

      {orders.length === 0 ? (
        <div class={styles.empty}>
          <p>No hay órdenes de culto guardadas</p>
          <p>Crea una nueva para comenzar</p>
        </div>
      ) : (
        <div class={styles.list}>
          {orders.map(order => (
            <div
              key={order.id}
              class={`${styles.card} ${styles[color]}`}
              onClick={() => onNavigate(`orden/${order.id}`)}
            >
              <div class={styles.cardBody}>
                <h3 class={styles.cardTitle}>{order.title || 'Sin título'}</h3>
                <p class={styles.cardMeta}>
                  {order.slides.length} slide{order.slides.length !== 1 ? 's' : ''}
                </p>
                <p class={styles.cardDate}>Creado: {formatDate(order.createdAt)}</p>
              </div>
              <div class={styles.cardActions}>
                <button
                  class={styles.editBtn}
                  onClick={(e) => { e.stopPropagation(); onNavigate(`orden/${order.id}/editar`); }}
                >
                  Editar
                </button>
                <button class={styles.deleteBtn} onClick={(e) => handleDelete(order.id, e)}>
                  <DeleteIcon size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
