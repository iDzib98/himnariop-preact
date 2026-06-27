import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  color?: string;
}

export function Switch({ checked, onChange, label, color = 'indigo' }: SwitchProps) {
  return (
    <label class={styles.container}>
      <span class={styles.label}>{label}</span>
      <div class={styles.switchWrapper}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          class={styles.input}
        />
        <span class={`${styles.switch} ${styles[color]}`}>
          <span class={styles.slider} />
        </span>
      </div>
    </label>
  );
}
