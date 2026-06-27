import { useSettings } from '../../hooks/useSettings';
import { ChevronLeftIcon } from '../ui/Icons';
import styles from './InfoView.module.css';

interface InfoViewProps {
  onNavigate: (path: string) => void;
}

export function InfoView({ onNavigate }: InfoViewProps) {
  const { color, theme } = useSettings();

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles.mobilePageHeader} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate('home')}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.pageTitle}>Información</h1>
      </header>

      <main class={styles.main}>
        <div class={styles.content}>
          <p class={styles.text}>
            App creada para uso gratuito. Este proyecto es independiente y no cuenta con ningún subsidio por parte de ninguna iglesia.
          </p>

          <p class={styles.text}>
            Si deseas apoyar al mantenimiento del proyecto con una donación puedes ponerte en contacto con el desarrollador.
          </p>

          <div class={styles.donateSection}>
            <a
              href="https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=2c93808480710707018077566dd00124"
              target="_blank"
              rel="noopener noreferrer"
              class={`${styles.btn} ${styles.blue}`}
            >
              Donar mensualmente
            </a>
          </div>

          <h3 class={styles.sectionTitle}>Contacto</h3>
          <p class={styles.text}>
            Si tienes alguna sugerencia o algo no funciona bien, puedes ponerte en contacto conmigo y en medida de lo posible atenderé tu solicitud.
          </p>

          <div class={styles.contactBtns}>
            <a
              href="https://wa.me/529997700066"
              target="_blank"
              rel="noopener noreferrer"
              class={`${styles.btn} ${styles.green}`}
            >
              WhatsApp
            </a>
            <a
              href="https://www.facebook.com/himnariop"
              target="_blank"
              rel="noopener noreferrer"
              class={`${styles.btn} ${styles.blue}`}
            >
              Facebook
            </a>
          </div>

          <div class={styles.developer}>
            <p>Desarrollada por DevZafiro</p>
            <img src="./assets/devZafiro.png" alt="DevZafiro" class={styles.logo} />
          </div>
        </div>
      </main>
    </div>
  );
}
