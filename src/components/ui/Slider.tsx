import styles from './Slider.module.css';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  showLabels?: boolean;
  labels?: string[];
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  showLabels = false,
  labels
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div class={styles.container}>
      {label && <label class={styles.label}>{label}</label>}
      <div class={styles.sliderWrapper}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt((e.target as HTMLInputElement).value, 10))}
          class={styles.input}
          style={{ '--progress': `${percentage}%` } as any}
        />
      </div>
      {showLabels && labels && (
        <div class={styles.labels}>
          {labels.map((l, i) => (
            <span key={i} class={styles.tickLabel}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
