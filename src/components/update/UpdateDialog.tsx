import { useState } from 'preact/hooks';
import { CHANGELOG, APP_VERSION } from '../../data/changelog';
import { setLastSeenVersion } from '../../services/versionService';
import styles from './UpdateDialog.module.css';

interface UpdateDialogProps {
  onClose: () => void;
}

export function UpdateDialog({ onClose }: UpdateDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const latestEntry = CHANGELOG[0];
  const previousEntries = CHANGELOG.slice(1);

  const handleClose = () => {
    if (dontShowAgain) {
      setLastSeenVersion(APP_VERSION);
    }
    onClose();
  };

  const handleDonate = () => {
    if (dontShowAgain) {
      setLastSeenVersion(APP_VERSION);
    }
    window.open('https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=2c93808480710707018077566dd00124', '_blank');
  };

  return (
    <div class={styles.overlay} onClick={handleClose}>
      <div class={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div class={styles.header}>
          <h2 class={styles.title}>¡Novedades en la app!</h2>
          <p class={styles.version}>Versión {APP_VERSION}</p>
        </div>

        <div class={styles.body}>
          {latestEntry && (
            <div class={styles.section}>
              <h3 class={styles.sectionTitle}>Cambios recientes</h3>
              <ul class={styles.changelist}>
                {latestEntry.changes.map((change, i) => (
                  <li key={i} class={styles.changeItem}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {previousEntries.length > 0 && (
            <details class={styles.history}>
              <summary class={styles.historySummary}>Versiones anteriores</summary>
              {previousEntries.map((entry) => (
                <div key={entry.version} class={styles.historyEntry}>
                  <p class={styles.historyVersion}>v{entry.version} — {entry.date}</p>
                  <ul class={styles.historyList}>
                    {entry.changes.map((change, i) => (
                      <li key={i} class={styles.changeItem}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          )}

          <div class={styles.infoSection}>
            <p class={styles.text}>
              App creada para uso gratuito. Si deseas apoyar al mantenimiento del proyecto puedes hacer una donación desde $10 pesos al mes con el botón de "Donar". Si prefieres donar una sola vez, o algo no funciona correctamente en la aplicación, o tienes alguna sugerencia puedes ponerte en contacto.  
            </p>
            <div class={styles.contactRow}>
              <a href="https://wa.me/529997700066" target="_blank" rel="noopener noreferrer" class={`${styles.contactBtn} ${styles.green}`}>WhatsApp</a>
              <a href="https://www.facebook.com/himnariop" target="_blank" rel="noopener noreferrer" class={`${styles.contactBtn} ${styles.blue}`}>Facebook</a>
            </div>
          </div>

          <label class={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain((e.target as HTMLInputElement).checked)}
            />
            No mostrar de nuevo
          </label>
        </div>

        <div class={styles.footer}>
          <button class={`${styles.btn} ${styles.donateBtn}`} onClick={handleDonate}>Donar</button>
          <button class={`${styles.btn} ${styles.closeBtn}`} onClick={handleClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
