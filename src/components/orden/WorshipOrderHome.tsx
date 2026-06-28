import { useState, useEffect } from 'preact/hooks';
import { getOrders, deleteOrder, generateId } from '../../services/ordenStorage';
import { getCurrentUser, onAuthChange } from '../../services/authService';
import { getMyCloudOrders, getChurchOrders, deleteCloudOrder } from '../../services/cloudOrdenService';
import { getChurch, getUserChurches, getLocalChurchIds } from '../../services/churchService';
import type { WorshipOrder, Church } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { PlusIcon, DeleteIcon, ChurchIcon, SyncIcon, SearchIcon, CloseIcon } from '../ui/Icons';
import styles from './WorshipOrderHome.module.css';

interface Props {
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const TAB_KEY = 'cultos_tab';

type Tab = 'mis-cultos' | 'mi-iglesia';

export function WorshipOrderHome({ onNavigate, searchQuery, onSearchChange }: Props) {
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem(TAB_KEY) as Tab) || 'mis-cultos');
  const [localOrders, setLocalOrders] = useState<WorshipOrder[]>([]);
  const [cloudOrders, setCloudOrders] = useState<WorshipOrder[]>([]);
  const [churchOrders, setChurchOrders] = useState<Record<string, WorshipOrder[]>>({});
  const [churches, setChurches] = useState<Church[]>([]);
  const [user, setUser] = useState(getCurrentUser());
  const [syncing, setSyncing] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const { color, theme } = useSettings();

  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
  }, [tab]);

  useEffect(() => {
    setLocalOrders(getOrders());
    return onAuthChange((u) => {
      setUser(u);
      if (u) {
        loadCloudData(u.uid);
      } else {
        setCloudOrders([]);
        setChurches([]);
        setChurchOrders({});
        loadLocalChurches();
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadCloudData(user.uid);
    } else {
      loadLocalChurches();
    }
  }, [tab]);

  useEffect(() => {
    const handleFocus = () => {
      setLocalOrders(getOrders());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function loadCloudData(uid: string) {
    setSyncing(true);
    try {
      const [cloud, userChurches] = await Promise.all([
        getMyCloudOrders(uid),
        getUserChurches(uid),
      ]);
      setCloudOrders(cloud);
      setChurches(userChurches);

      const churchOrdersMap: Record<string, WorshipOrder[]> = {};
      for (const c of userChurches) {
        const orders = await getChurchOrders(c.id);
        churchOrdersMap[c.id] = orders;
      }
      setChurchOrders(churchOrdersMap);
    } catch (err) {
      console.error('Error loading cloud data:', err);
    }
    setSyncing(false);
  }

  async function loadLocalChurches() {
    setSyncing(true);
    try {
      const ids = getLocalChurchIds();
      const loaded: Church[] = [];
      const ordersMap: Record<string, WorshipOrder[]> = {};
      for (const id of ids) {
        const c = await getChurch(id);
        if (c) {
          loaded.push(c);
          const orders = await getChurchOrders(id);
          ordersMap[id] = orders;
        }
      }
      setChurches(loaded);
      setChurchOrders(ordersMap);
    } catch (err) {
      console.error('Error loading local churches:', err);
    }
    setSyncing(false);
  }

  const handleCreate = () => {
    const id = generateId();
    onNavigate(`orden/${id}/editar`);
  };

  const handleDelete = (id: string, cloudId: string | undefined, e: Event) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta orden de culto?')) {
      deleteOrder(id);
      const cloudIdToDelete = cloudId || id;
      if (cloudId && cloudId !== id) {
        deleteOrder(cloudId);
      }
      if (cloudIdToDelete) {
        deleteCloudOrder(cloudIdToDelete).catch(err => console.error('Error deleting cloud order:', err));
      }
      setLocalOrders(getOrders());
      setCloudOrders(prev => prev.filter(o => (o.cloudId || o.id) !== cloudIdToDelete));
    }
  };

  function isActive(order: WorshipOrder): boolean {
    if (!order.date) return false;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (order.date !== today) return false;
    if (!order.startTime) return true;
    const start = new Date(`${order.date}T${order.startTime}`);
    const end = order.endTime ? new Date(`${order.date}T${order.endTime}`) : new Date(`${order.date}T23:59`);
    return now >= start && now <= end;
  }

  function isPast(order: WorshipOrder): boolean {
    if (!order.date) return false;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (order.date > today) return false;
    if (order.date < today) return true;
    if (!order.startTime) return false;
    const end = order.endTime ? new Date(`${order.date}T${order.endTime}`) : new Date(`${order.date}T23:59`);
    return now > end;
  }

  function sortOrders(orders: WorshipOrder[]): WorshipOrder[] {
    const active = orders.filter(isActive);
    const future = orders.filter(o => !isActive(o) && !isPast(o));
    const past = orders.filter(isPast);
    return [...active, ...future, ...past];
  }

  function formatOrderDate(order: WorshipOrder): string {
    if (!order.date) return '';
    const date = new Date(order.date + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (order.startTime) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
    }
    let str = date.toLocaleDateString('es-MX', opts);
    if (order.startTime && order.endTime) {
      str += ` - ${order.endTime}`;
    }
    return str;
  }

  // Merge local + cloud for "Mis cultos"
  const misCultosAll = (() => {
    const map = new Map<string, WorshipOrder>();
    for (const o of localOrders) {
      const key = o.cloudId || o.id;
      if (!map.has(key)) map.set(key, o);
    }
    for (const o of cloudOrders) {
      const key = o.cloudId || o.id;
      map.set(key, o);
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  })();

  const misCultos = sortOrders(showPast ? misCultosAll : misCultosAll.filter(o => !isPast(o)));
  const hasPast = misCultosAll.some(isPast);

  const filteredMisCultos = searchQuery
    ? misCultos.filter(o =>
        o.title?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery) ||
        o.description?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery) ||
        o.authorName?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      )
    : misCultos;

  const handleCultosSearchNavigate = (path: string) => {
    onSearchChange('');
    onNavigate(path);
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.mobileSearchHeader} ${styles[color]}`}>
        <form class={styles.searchForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div class={styles.searchWrapper}>
            <SearchIcon size={24} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar culto..."
              value={searchQuery}
              onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
              class={styles.searchInput}
            />
            {searchQuery && (
              <button type="button" class={styles.clearBtn} onClick={() => onSearchChange('')}>
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        </form>
      </header>

      <div class={styles.topActions}>
        <button class={`${styles.createBtn} ${styles[color]}`} onClick={handleCreate}>
          <PlusIcon size={20} /> Nueva Orden
        </button>
        <button class={styles.churchBtnNav} onClick={() => onNavigate('orden/iglesias')} title="Administrar iglesias">
          <ChurchIcon size={20} />
        </button>
      </div>

      <div class={styles.tabs}>
        <button
          class={`${styles.tab} ${tab === 'mis-cultos' ? styles.tabActive : ''} ${tab === 'mis-cultos' ? styles[color] : ''}`}
          onClick={() => setTab('mis-cultos')}
        >
          Mis cultos
        </button>
        <button
          class={`${styles.tab} ${tab === 'mi-iglesia' ? styles.tabActive : ''} ${tab === 'mi-iglesia' ? styles[color] : ''}`}
          onClick={() => setTab('mi-iglesia')}
        >
          Mi iglesia
        </button>
      </div>

      {syncing && tab === 'mi-iglesia' && (
        <div class={styles.syncing}>
          <SyncIcon size={16} /> Sincronizando...
        </div>
      )}

      {tab === 'mis-cultos' && (
        <>
          {filteredMisCultos.length === 0 ? (
            <div class={styles.empty}>
              {searchQuery ? (
                <p>No se encontraron cultos para "<strong>{searchQuery}</strong>"</p>
              ) : (
                <>
                  <p>No hay órdenes de culto guardadas</p>
                  <p>Crea una nueva para comenzar</p>
                </>
              )}
            </div>
          ) : (
            <div class={styles.list}>
              {filteredMisCultos.map(order => (
                  <div
                    key={order.id}
                    class={`${styles.card} ${styles[color]} ${order.isReadOnly ? styles.readOnly : ''} ${isActive(order) ? styles.activeCard : ''}`}
                    onClick={() => handleCultosSearchNavigate(`orden/${order.id || order.cloudId}`)}
                  >
                      <div class={styles.cardHeader}>
                        <h3 class={styles.cardTitle}>
                          {isActive(order) && <span class={styles.activeBadge}>En curso</span>}
                          {order.title || 'Sin título'}
                          {order.isReadOnly && <span class={styles.readOnlyBadge}>Solo lectura</span>}
                        </h3>
                        <div class={styles.cardActions}>
                          {!order.isReadOnly && (order.authorId === user?.uid || !order.authorId) && (
                            <button
                              class={styles.editBtn}
                              onClick={(e) => { e.stopPropagation(); onNavigate(`orden/${order.id}/editar`); }}
                            >
                              Editar
                            </button>
                          )}
                          <button class={styles.deleteBtn} onClick={(e) => handleDelete(order.id, order.cloudId, e)}>
                            <DeleteIcon size={18} />
                          </button>
                        </div>
                      </div>
                      <div class={styles.cardBody}>
                        <p class={styles.cardMeta}>
                          {order.authorId === user?.uid ? `${order.slides.length} slide${order.slides.length !== 1 ? 's' : ''} · ` : ''}
                          {order.authorName || ''}
                        </p>
                        {order.description && (
                          <p class={styles.cardDesc}>{order.description}</p>
                        )}
                        {order.date && (
                          <p class={styles.cardDate}>{formatOrderDate(order)}</p>
                        )}
                      </div>
                  </div>
              ))}
            </div>
          )}
          {hasPast && (
            <div class={styles.pastToggle}>
              <label class={styles.toggleLabel}>
                <input type="checkbox" checked={showPast} onChange={() => setShowPast(!showPast)} />
                Mostrar cultos anteriores
              </label>
            </div>
          )}
        </>
      )}

      {tab === 'mi-iglesia' && (
        <>
          {churches.length === 0 ? (
            <div class={styles.empty}>
              <p>No estás conectado a ninguna iglesia</p>
              <button class={`${styles.createBtn} ${styles[color]}`} onClick={() => onNavigate('orden/iglesias')}>
                Unirse o crear iglesia
              </button>
            </div>
          ) : (
            churches.map(church => {
              const churchOrderList = showPast
                ? churchOrders[church.id] || []
                : (churchOrders[church.id] || []).filter(o => !isPast(o));
              const churchPastOrders = (churchOrders[church.id] || []).some(isPast);
              const sorted = sortOrders(churchOrderList);
              const filteredChurchOrders = searchQuery
                ? sorted.filter(o =>
                    o.title?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery) ||
                    o.description?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery) ||
                    o.authorName?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
                  )
                : sorted;
              return (
              <div key={church.id} class={styles.churchSection}>
                <div class={styles.churchHeader}>
                  <ChurchIcon size={18} />
                  <h3>{church.name}</h3>
                  <span class={styles.churchCode}>{church.id}</span>
                </div>
                {filteredChurchOrders.length > 0 ? (
                  <div class={styles.list}>
                    {filteredChurchOrders.map(order => (
                      <div
                        key={order.cloudId || order.id}
                        class={`${styles.card} ${styles[color]} ${styles.readOnly} ${isActive(order) ? styles.activeCard : ''}`}
                        onClick={() => handleCultosSearchNavigate(`orden/${order.cloudId || order.id}`)}
                      >
                        <div class={styles.cardHeader}>
                          <h3 class={styles.cardTitle}>
                            {isActive(order) && <span class={styles.activeBadge}>En curso</span>}
                            {order.title || 'Sin título'}
                          </h3>
                        </div>
                        <div class={styles.cardBody}>
                          {(user?.uid === order.authorId || church.adminIds.includes(user?.uid || '')) && order.authorName && (
                            <p class={styles.cardMeta}>{order.authorName}</p>
                          )}
                          {order.description && (
                            <p class={styles.cardDesc}>{order.description}</p>
                          )}
                          {order.date && (
                            <p class={styles.cardDate}>{formatOrderDate(order)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p class={styles.churchEmpty}>No hay órdenes compartidas en esta iglesia</p>
                )}
                {churchPastOrders && (
                  <div class={styles.pastToggle}>
                    <label class={styles.toggleLabel}>
                      <input type="checkbox" checked={showPast} onChange={() => setShowPast(!showPast)} />
                      Mostrar cultos anteriores
                    </label>
                  </div>
                )}
              </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
