import { useState, useEffect } from 'preact/hooks';
import type { Church } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getCurrentUser, onAuthChange } from '../../services/authService';
import {
  getChurch,
  createChurch,
  joinChurch,
  leaveChurch,
  getUserChurches,
  getLocalChurchIds,
  addLocalChurchId,
  saveLocalChurchIds,
  transferOwnership,
  addAdmin,
  removeAdmin,
} from '../../services/churchService';
import { ChevronLeftIcon, ChurchIcon, GoogleIcon, ShareIcon, CloseIcon } from '../ui/Icons';
import { signInWithGoogle } from '../../services/authService';
import styles from './ChurchManagerView.module.css';

interface Props {
  onNavigate: (path: string) => void;
  initialJoinCode?: string;
}

export function ChurchManagerView({ onNavigate, initialJoinCode }: Props) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(getCurrentUser());
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showManage, setShowManage] = useState<string | null>(null);
  const [showShare, setShowShare] = useState<Church | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [churchName, setChurchName] = useState('');
  const [churchDesc, setChurchDesc] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [joinCode, setJoinCode] = useState(initialJoinCode || '');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [transferUid, setTransferUid] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { color, theme } = useSettings();

  useEffect(() => {
    if (initialJoinCode && !showJoin) {
      setJoinCode(initialJoinCode);
      setShowJoin(true);
    }
  }, [initialJoinCode]);

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      loadChurches(u);
    });
  }, []);

  async function loadChurches(u: typeof user) {
    setLoading(true);
    if (u) {
      const cloud = await getUserChurches(u.uid);
      setChurches(cloud);
    } else {
      const localIds = getLocalChurchIds();
      const loaded: Church[] = [];
      for (const id of localIds) {
        const c = await getChurch(id);
        if (c) loaded.push(c);
      }
      setChurches(loaded);
    }
    setLoading(false);
  }

  const handleCreate = async () => {
    if (!churchName.trim()) return;
    if (!user) {
      setError('Debes iniciar sesión para crear una iglesia');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const c = await createChurch(churchName.trim(), user.uid, customCode.trim() || undefined, churchDesc.trim() || undefined);
      setChurches(prev => [c, ...prev]);
      setChurchName('');
      setChurchDesc('');
      setCustomCode('');
      setShowCreate(false);
      setSuccess(`Iglesia creada con código: ${c.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear iglesia');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError('');
    setSuccess('');
    const code = joinCode.trim().toUpperCase();
    try {
      const c = await getChurch(code);
      if (!c) {
        setError('Iglesia no encontrada');
        return;
      }
      if (user) {
        await joinChurch(code, user.uid);
      }
      addLocalChurchId(code);
      setChurches(prev => {
        if (prev.find(x => x.id === code)) return prev;
        return [...prev, c];
      });
      setJoinCode('');
      setShowJoin(false);
      setSuccess(`Te has unido a: ${c.name}`);
    } catch (err: any) {
      setError(err.message || 'Error al unirse');
    }
  };

  const handleLeave = async (code: string) => {
    const church = churches.find(c => c.id === code);
    if (church && user?.uid === church.ownerId) {
      setError('Eres el propietario de esta iglesia. Transfiere la propiedad antes de salir.');
      return;
    }
    if (!confirm('¿Salir de esta iglesia?')) return;
    if (user) await leaveChurch(code, user.uid);
    const localIds = getLocalChurchIds().filter(id => id !== code);
    saveLocalChurchIds(localIds);
    setChurches(prev => prev.filter(c => c.id !== code));
  };

  const handleTransfer = async (code: string) => {
    if (!transferUid.trim()) return;
    try {
      await transferOwnership(code, transferUid.trim());
      setSuccess('Propiedad transferida');
      setTransferUid('');
      setShowManage(null);
      loadChurches(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddAdmin = async (code: string) => {
    if (!newAdminEmail.trim()) return;
    try {
      await addAdmin(code, newAdminEmail.trim());
      setSuccess('Administrador añadido');
      setNewAdminEmail('');
      loadChurches(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveAdmin = async (code: string, adminId: string) => {
    if (!confirm('¿Remover administrador?')) return;
    try {
      await removeAdmin(code, adminId);
      loadChurches(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    if (churches.length > 0) {
      return (
        <div class={styles.container} data-theme={theme}>
          <header class={`${styles.header} ${styles[color]}`}>
            <button class={styles.backBtn} onClick={() => onNavigate('configuracion')}>
              <ChevronLeftIcon size={24} />
            </button>
            <h1 class={styles.headerTitle}>Iglesias</h1>
          </header>

          <main class={styles.main}>
            {error && <div class={`${styles.msg} ${styles.errorMsg}`}>{error}</div>}
            {success && <div class={`${styles.msg} ${styles.successMsg}`}>{success}</div>}

            <div class={styles.actions}>
              <button class={`${styles.googleBtn} ${styles[color]}`} onClick={() => signInWithGoogle()}>
                <GoogleIcon size={20} /> Iniciar sesión con Google
              </button>
              <button class={`${styles.actionBtn} ${styles[color]}`} onClick={() => { setShowJoin(true); }}>
                Unirse por código
              </button>
            </div>

            {showCreate && (
              <div class={styles.form}>
                <input class={styles.input} placeholder="Nombre de la iglesia" value={churchName}
                  onInput={(e) => setChurchName((e.target as HTMLInputElement).value)} />
                <input class={styles.input} placeholder="Descripción (opcional)" value={churchDesc}
                  onInput={(e) => setChurchDesc((e.target as HTMLInputElement).value)} />
                <input class={styles.input} placeholder="Código personalizado (opcional, ej: MI-IGLESIA)" value={customCode}
                  onInput={(e) => setCustomCode((e.target as HTMLInputElement).value)} />
                <button class={`${styles.submitBtn} ${styles[color]}`} onClick={handleCreate}>Crear</button>
                <button class={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancelar</button>
              </div>
            )}
            {showJoin && renderJoinForm()}

            {loading ? <p class={styles.loading}>Cargando...</p> : renderChurchList()}

            {showManage && renderManagePanel()}
          </main>

          {showShare && renderShareDialog()}
        </div>
      );
    }

    return (
      <div class={styles.container} data-theme={theme}>
        <header class={`${styles.header} ${styles[color]}`}>
          <button class={styles.backBtn} onClick={() => onNavigate('configuracion')}>
            <ChevronLeftIcon size={24} />
          </button>
          <h1 class={styles.headerTitle}>Iglesias</h1>
        </header>
        <main class={styles.main}>
          <div class={styles.loginPrompt}>
            <ChurchIcon size={48} />
            <p>Inicia sesión para crear y administrar iglesias</p>
            <p class={styles.hint}>Puedes unirte a una iglesia sin iniciar sesión</p>
            <button class={`${styles.googleBtn} ${styles[color]}`} onClick={() => signInWithGoogle()}>
              <GoogleIcon size={20} /> Iniciar sesión con Google
            </button>
            <button class={`${styles.actionBtn} ${styles[color]}`} onClick={() => setShowJoin(true)}>
              Unirse a iglesia por código
            </button>
            <button class={styles.secondaryBtn} onClick={() => onNavigate('orden')}>
              Omitir y volver
            </button>
          </div>
          {showJoin && renderJoinForm()}
          {loading ? <p class={styles.loading}>Cargando...</p> : renderChurchList()}
          {showShare && renderShareDialog()}
        </main>
      </div>
    );
  }

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate('configuracion')}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.headerTitle}>Iglesias</h1>
      </header>

      <main class={styles.main}>
        {error && <div class={`${styles.msg} ${styles.errorMsg}`}>{error}</div>}
        {success && <div class={`${styles.msg} ${styles.successMsg}`}>{success}</div>}

        <div class={styles.actions}>
          <button class={`${styles.actionBtn} ${styles[color]}`} onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            Crear iglesia
          </button>
          <button class={`${styles.actionBtn} ${styles[color]}`} onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            Unirse por código
          </button>
        </div>

        {showCreate && (
          <div class={styles.form}>
            <input class={styles.input} placeholder="Nombre de la iglesia" value={churchName}
              onInput={(e) => setChurchName((e.target as HTMLInputElement).value)} />
            <input class={styles.input} placeholder="Descripción (opcional)" value={churchDesc}
              onInput={(e) => setChurchDesc((e.target as HTMLInputElement).value)} />
            <input class={styles.input} placeholder="Código personalizado (opcional, ej: MI-IGLESIA)" value={customCode}
              onInput={(e) => setCustomCode((e.target as HTMLInputElement).value)} />
            <button class={`${styles.submitBtn} ${styles[color]}`} onClick={handleCreate}>Crear</button>
            <button class={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancelar</button>
          </div>
        )}

        {showJoin && renderJoinForm()}

        {loading ? <p class={styles.loading}>Cargando...</p> : renderChurchList()}

        {showManage && user && renderManagePanel()}
      </main>

      {showShare && renderShareDialog()}
    </div>
  );

  function renderJoinForm() {
    return (
      <div class={styles.form}>
        <input class={styles.input} placeholder="Código de iglesia" value={joinCode}
          onInput={(e) => setJoinCode((e.target as HTMLInputElement).value)} />
        <button class={`${styles.submitBtn} ${styles[color]}`} onClick={handleJoin}>Unirse</button>
        <button class={styles.cancelBtn} onClick={() => setShowJoin(false)}>Cancelar</button>
      </div>
    );
  }

  function renderChurchList() {
    if (churches.length === 0) {
      return <p class={styles.empty}>No hay iglesias</p>;
    }
    return (
      <div class={styles.churchList}>
        {churches.map(c => (
          <div key={c.id} class={`${styles.churchCard} ${styles[color]}`}>
            <div class={styles.churchInfo}>
              <h3>{c.name}</h3>
              <p class={styles.churchCode}>Código: <strong>{c.id}</strong></p>
              {c.description && <p class={styles.churchDesc}>{c.description}</p>}
              <p class={styles.churchMeta}>{c.memberIds.length} miembro(s)</p>
            </div>
            <div class={styles.churchActions}>
              <button class={styles.shareBtn} onClick={() => setShowShare(c)} title="Compartir iglesia">
                <ShareIcon size={18} />
              </button>
              {user?.uid === c.ownerId && (
                <button class={styles.manageBtn} onClick={() => setShowManage(showManage === c.id ? null : c.id)}>
                  Administrar
                </button>
              )}
              {user?.uid !== c.ownerId && (
                <button class={styles.leaveBtn} onClick={() => handleLeave(c.id)}>Salir</button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderManagePanel() {
    const church = churches.find(c => c.id === showManage);
    if (!church) return null;
    return (
      <div class={styles.managePanel}>
        <h3>Administrar: {church.name}</h3>
        <div class={styles.manageSection}>
          <h4>Transferir propiedad</h4>
          <input class={styles.input} placeholder="UID del nuevo propietario" value={transferUid}
            onInput={(e) => setTransferUid((e.target as HTMLInputElement).value)} />
          <button class={styles.submitBtn} onClick={() => handleTransfer(church.id)}>Transferir</button>
        </div>
        <div class={styles.manageSection}>
          <h4>Añadir administrador</h4>
          <input class={styles.input} placeholder="UID del administrador" value={newAdminEmail}
            onInput={(e) => setNewAdminEmail((e.target as HTMLInputElement).value)} />
          <button class={styles.submitBtn} onClick={() => handleAddAdmin(church.id)}>Añadir</button>
        </div>
        <div class={styles.manageSection}>
          <h4>Administradores actuales</h4>
          <ul class={styles.adminList}>
            {church.adminIds.map(aid => (
              <li key={aid} class={styles.adminItem}>
                <span>{aid}</span>
                {user?.uid === church.ownerId && aid !== church.ownerId && (
                  <button class={styles.removeBtn} onClick={() => handleRemoveAdmin(church.id, aid)}>Quitar</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <button class={styles.cancelBtn} onClick={() => setShowManage(null)}>Cerrar</button>
      </div>
    );
  }

  function renderShareDialog() {
    if (!showShare) return null;
    const shareUrl = `${window.location.origin}/#orden/iglesias/unirse/${showShare.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    return (
      <div class={styles.overlay} onClick={() => setShowShare(null)}>
        <div class={styles.dialog} onClick={(e) => e.stopPropagation()} data-theme={theme}>
          <div class={styles.dialogHeader}>
            <h3>Compartir: {showShare.name}</h3>
            <button class={styles.closeBtn} onClick={() => setShowShare(null)}><CloseIcon size={20} /></button>
          </div>
          <div class={styles.dialogBody}>
            <div class={styles.qrContainer}>
              <img src={qrUrl} alt={`QR para unirse a ${showShare.name}`} class={styles.qrImage} />
            </div>
            <div class={styles.shareLinkBox}>
              <input class={styles.shareLinkInput} value={shareUrl} readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()} />
              <div class={styles.shareActions}>
                <button class={`${styles.shareActionBtn} ${styles[color]}`} onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: showShare.name, url: shareUrl }).catch(() => {});
                  }
                }}>
                  Compartir
                </button>
                <button class={`${styles.copyBtn} ${styles[color]}`} onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}>
                  {linkCopied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <p class={styles.shareHint}>Comparte este enlace o código QR para que otros puedan unirse a la iglesia.</p>
          </div>
        </div>
      </div>
    );
  }
}
