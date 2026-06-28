import { useState, useEffect } from 'preact/hooks';
import type { Church, WorshipOrder } from '../../types/orden';
import { useSettings } from '../../hooks/useSettings';
import { getCurrentUser, signInWithGoogle, onAuthChange } from '../../services/authService';
import { getUserChurches } from '../../services/churchService';
import { saveOrderToCloud } from '../../services/cloudOrdenService';
import { saveOrder } from '../../services/ordenStorage';
import { CloseIcon, GoogleIcon, ShareIcon } from '../ui/Icons';
import styles from './ShareDialog.module.css';

function QRBox({ url, title, color }: { url: string; title: string; color: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div class={styles.qrContainer}>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
          alt="QR" class={styles.qrImage} />
      </div>
      <div class={styles.linkBox}>
        <input class={styles.linkInput} value={url} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
      </div>
      <div class={styles.linkActions}>
        <button class={`${styles.linkActionBtn} ${styles[color]}`} onClick={() => {
          if (navigator.share) {
            navigator.share({ title, url }).catch(() => {});
          }
        }}>
          <ShareIcon size={16} /> Compartir
        </button>
        <button class={`${styles.linkActionBtn} ${styles[color]}`} onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}>
          <CopyIcon size={16} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </>
  );
}
function CopyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

interface Props {
  order: WorshipOrder;
  onClose: () => void;
  onShared: (newOrder: WorshipOrder) => void;
}

export function ShareDialog({ order, onClose, onShared }: Props) {
  const [user, setUser] = useState(getCurrentUser());
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState(order.churchId || '');
  const [isPublic, setIsPublic] = useState(order.isPublic || false);
  const [sharing, setSharing] = useState(false);
  const { color, theme } = useSettings();

  const isAuthor = !!(user && order.authorId === user.uid);
  const alreadyShared = !!(order.cloudId && (order.isPublic || order.churchId));
  const [step, setStep] = useState<'login' | 'choose' | null>(
    alreadyShared && !isAuthor ? null :
    getCurrentUser() ? 'choose' : 'login'
  );

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      if (u && step === 'login') setStep('choose');
    });
  }, [step]);

  useEffect(() => {
    if (user) {
      getUserChurches(user.uid).then(setChurches);
    }
  }, [user]);

  const handleSave = async (publicVal: boolean, churchVal: string) => {
    if (!user) return;
    setSharing(true);
    try {
      const updated: WorshipOrder = {
        ...order,
        isPublic: publicVal,
        churchId: churchVal || undefined,
        authorId: user.uid,
        authorName: user.displayName || user.email || '',
        updatedAt: Date.now(),
      };
      const cloudId = await saveOrderToCloud(updated, user.uid);
      updated.cloudId = cloudId;
      saveOrder(updated);
      onShared(updated);
      setIsPublic(publicVal);
      setSelectedChurchId(churchVal);
    } catch (err) {
      console.error('Share error:', err);
    }
    setSharing(false);
  };

  const togglePublic = () => {
    const newVal = !isPublic;
    handleSave(newVal, selectedChurchId);
  };

  const toggleChurch = () => {
    if (selectedChurchId) {
      handleSave(isPublic, '');
    } else if (churches.length > 0) {
      handleSave(isPublic, churches[0].id);
    }
  };

  const selectChurch = (id: string) => {
    handleSave(isPublic, id);
  };

  return (
    <div class={styles.overlay} onClick={onClose}>
      <div class={styles.dialog} onClick={(e) => e.stopPropagation()} data-theme={theme}>
        <div class={styles.dialogHeader}>
          <h2>Compartir orden de culto</h2>
          <button class={styles.closeBtn} onClick={onClose}><CloseIcon size={20} /></button>
        </div>

        <div class={styles.dialogBody}>
          {step === null && alreadyShared && (
            <div class={styles.chooseStep}>
              {order.isPublic && (
                <div class={styles.publicSection}>
                  <p class={styles.shareLabel}>Comparte esta orden con este enlace:</p>
                  <QRBox url={`${window.location.origin}/#orden/${order.cloudId}`} title={order.title} color={color} />
                </div>
              )}
              {!order.isPublic && order.churchId && (
                <div class={styles.publicSection}>
                  <p class={styles.shareLabel}>Compartida en iglesia</p>
                  <QRBox url={`${window.location.origin}/#orden/${order.cloudId}`} title={order.title} color={color} />
                </div>
              )}
            </div>
          )}

          {step === 'login' && (
            <div class={styles.loginStep}>
              <ShareIcon size={48} />
              <p>Inicia sesión para compartir esta orden</p>
              <button class={`${styles.googleBtn} ${styles[color]}`} onClick={() => signInWithGoogle()}>
                <GoogleIcon size={20} /> Iniciar sesión con Google
              </button>
            </div>
          )}

          {step === 'choose' && isAuthor && (
            <div class={styles.chooseStep}>
              <label class={styles.shareToggle}>
                <input type="checkbox" checked={isPublic}
                  onChange={togglePublic} disabled={sharing} />
                <div>
                  <strong>Enlace público</strong>
                  <p>Cualquiera con el enlace puede ver esta orden</p>
                </div>
              </label>

              {order.cloudId && isPublic && (
                <div class={styles.publicSection}>
                  <QRBox url={`${window.location.origin}/#orden/${order.cloudId}`} title={order.title} color={color} />
                </div>
              )}

              {!order.cloudId && isPublic && (
                <p class={styles.hint}>Guardando...</p>
              )}

              {churches.length > 0 && (
                <div class={styles.churchShare}>
                  <label class={styles.shareToggle}>
                    <input type="checkbox" checked={!!selectedChurchId}
                      onChange={toggleChurch} disabled={sharing} />
                    <div>
                      <strong>Compartir con iglesia</strong>
                    </div>
                  </label>
                  {!!selectedChurchId && (
                    <select
                      class={styles.select}
                      value={selectedChurchId}
                      onChange={(e) => selectChurch((e.target as HTMLSelectElement).value)}
                    >
                      {churches.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {churches.length === 0 && (
                <p class={styles.noChurches}>
                  No perteneces a ninguna iglesia. Crea o únete a una desde Configuración.
                </p>
              )}
            </div>
          )}

          {step === 'choose' && !isAuthor && (
            <div class={styles.chooseStep}>
              {order.isPublic && order.cloudId && (
                <div class={styles.publicSection}>
                  <p class={styles.shareLabel}>Comparte esta orden con este enlace:</p>
                  <QRBox url={`${window.location.origin}/#orden/${order.cloudId}`} title={order.title} color={color} />
                </div>
              )}
              {!order.isPublic && order.churchId && (
                <div class={styles.publicSection}>
                  <p class={styles.shareLabel}>Compartida en iglesia</p>
                  <QRBox url={`${window.location.origin}/#orden/${order.cloudId}`} title={order.title} color={color} />
                </div>
              )}
              {!order.isPublic && !order.churchId && (
                <p class={styles.noAccess}>Esta orden no está disponible para compartir.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
