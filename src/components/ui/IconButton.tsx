import type { ComponentChildren } from 'preact';
import styles from './IconButton.module.css';

interface IconButtonProps {
  children: ComponentChildren;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function IconButton({
  children,
  size = 'medium',
  color,
  variant = 'filled',
  disabled = false,
  onClick,
  title,
  className = ''
}: IconButtonProps) {
  const classNames = [
    styles.iconButton,
    styles[size],
    styles[variant],
    color ? styles[color] : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classNames}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}
