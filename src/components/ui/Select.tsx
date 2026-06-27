import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  color?: string;
}

export function Select({ value, options, onChange, label, color = 'indigo' }: SelectProps) {
  return (
    <div class={styles.container}>
      {label && <label class={styles.label}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        class={`${styles.select} ${styles[color]}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
