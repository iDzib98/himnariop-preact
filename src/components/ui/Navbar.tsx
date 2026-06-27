import styles from './Navbar.module.css';

interface NavbarProps {
  color?: string;
  leftContent?: preact.ComponentChildren;
  rightContent?: preact.ComponentChildren;
}

export function Navbar({ color = 'indigo', leftContent, rightContent }: NavbarProps) {
  return (
    <nav class={`${styles.navbar} ${styles[color]}`}>
      <div class={styles.container}>
        <div class={styles.left}>{leftContent}</div>
        <div class={styles.right}>{rightContent}</div>
      </div>
    </nav>
  );
}
