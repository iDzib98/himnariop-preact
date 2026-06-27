import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSettings } from '../../hooks/useSettings';
import styles from './InfoModal.module.css';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { color } = useSettings();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Información">
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

      <div class={styles.footer}>
        <Button variant="filled" color={color} onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
