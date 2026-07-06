import { useState, useEffect } from 'preact/hooks';
import { Slider } from '../ui/Slider';
import { useSettings } from '../../hooks/useSettings';
import type { ColorOption, FontSize, FontFamily, Theme } from '../../types/himno';
import { BIBLE_VERSIONS } from '../../data/bibleVersions';
import { CHANGELOG, APP_VERSION } from '../../data/changelog';
import { ChevronLeftIcon, GoogleIcon, ChurchIcon, CopyIcon } from '../ui/Icons';
import { signInWithGoogle, signOut, getCurrentUser, onAuthChange } from '../../services/authService';
import styles from './SettingsView.module.css';

interface SettingsViewProps {
  onNavigate: (path: string) => void;
  searchQuery?: string;
}

const LARGE_FONT_CLASSES = ['x-large', 'xx-large'];

const COLORS: { value: ColorOption; label: string; hex: string }[] = [
  { value: 'black', label: 'Negro', hex: '#000000' },
  { value: 'red', label: 'Rojo', hex: '#f44336' },
  { value: 'pink', label: 'Rosado', hex: '#e91e63' },
  { value: 'purple', label: 'Púrpura', hex: '#9c27b0' },
  { value: 'deep-purple', label: 'Púrpura Intenso', hex: '#673ab7' },
  { value: 'indigo', label: 'Índigo', hex: '#3f51b5' },
  { value: 'blue', label: 'Azul', hex: '#2196f3' },
  { value: 'light-blue', label: 'Azul Claro', hex: '#03a9f4' },
  { value: 'cyan', label: 'Cian', hex: '#00bcd4' },
  { value: 'teal', label: 'Verde Azulado', hex: '#009688' },
  { value: 'green', label: 'Verde', hex: '#4caf50' },
  { value: 'light-green', label: 'Verde Claro', hex: '#8bc34a' },
  { value: 'lime', label: 'Lima', hex: '#cddc39' },
  { value: 'yellow', label: 'Amarillo', hex: '#ffeb3b' },
  { value: 'amber', label: 'Ámbar', hex: '#ffc107' },
  { value: 'orange', label: 'Naranja', hex: '#ff9800' },
  { value: 'deep-orange', label: 'Naranja Intenso', hex: '#ff5722' },
  { value: 'brown', label: 'Marrón', hex: '#795548' },
  { value: 'grey', label: 'Gris', hex: '#9e9e9e' },
  { value: 'blue-grey', label: 'Gris Azulado', hex: '#607d8b' }
];

const THEMES: { value: Theme; label: string; bg: string; text: string }[] = [
  { value: 'light', label: 'Claro', bg: '#ffffff', text: '#212121' },
  { value: 'sepia', label: 'Sepia', bg: '#f4ecd8', text: '#5b4636' },
  { value: 'dark', label: 'Oscuro', bg: '#121212', text: '#ffffff' },
  { value: 'oled', label: 'OLED', bg: '#000000', text: '#ffffff' }
];

const FONTS: { value: FontFamily; label: string; font: string }[] = [
  { value: 'sans-serif', label: 'Sans', font: 'sans-serif' },
  { value: 'serif', label: 'Serif', font: 'serif' },
  { value: 'monospace', label: 'Mono', font: 'monospace' }
];

const SECTION_LABELS: { key: string; label: string; keywords: string[] }[] = [
  { key: 'theme', label: 'Tema', keywords: ['tema', 'tema', 'oscuro', 'claro', 'sepia', 'oled'] },
  { key: 'color', label: 'Color de Énfasis', keywords: ['color', 'énfasis', 'enfasis'] },
  { key: 'fontSize', label: 'Tamaño de Letra', keywords: ['tamaño', 'letra', 'fuente', 'tamano'] },
  { key: 'fontFamily', label: 'Tipo de Letra', keywords: ['tipo', 'letra', 'fuente'] },
  { key: 'account', label: 'Cuenta', keywords: ['cuenta', 'cuenta', 'google', 'sesión', 'sesion'] },
  { key: 'churches', label: 'Iglesias', keywords: ['iglesia', 'iglesias'] },
  { key: 'bibleVersion', label: 'Versión de la Biblia', keywords: ['biblia', 'versión', 'version'] },
  { key: 'appInfo', label: 'Información de la App', keywords: ['información', 'informacion', 'app', 'versión', 'version', 'cambios'] },
  { key: 'contact', label: 'Contacto y Donaciones', keywords: ['contacto', 'donación', 'donacion', 'donar'] },
];

export function SettingsView({ onNavigate, searchQuery = '' }: SettingsViewProps) {
  const { color, fontSizeValue, fontFamily, theme, bibleVersion, updateColor, updateFontSize, updateFontFamily, updateTheme, updateBibleVersion } = useSettings();
  const [tempColor, setTempColor] = useState(color);
  const [tempFontSize, setTempFontSize] = useState(fontSizeValue);
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [uidCopied, setUidCopied] = useState(false);

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    const checkFontSize = () => {
      const body = document.body;
      const hasLargeFont = LARGE_FONT_CLASSES.some(cls => body.classList.contains(cls));
      setIsLargeFont(hasLargeFont);
    };

    checkFontSize();

    const observer = new MutationObserver(checkFontSize);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const query = searchQuery.toLowerCase().trim();
  const matchesSearch = (key: string) => {
    if (!query) return true;
    const section = SECTION_LABELS.find(s => s.key === key);
    if (!section) return true;
    if (section.label.toLowerCase().includes(query)) return true;
    return section.keywords.some(k => k.includes(query));
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor as ColorOption);
    updateColor(newColor as ColorOption);
  };

  const handleFontSizeChange = (value: number) => {
    setTempFontSize(value);
    const sizes: FontSize[] = ['small', 'medium', 'large', 'x-large', 'xx-large'];
    updateFontSize(sizes[value], value);
  };

  const handleFontFamilyChange = (family: FontFamily) => {
    updateFontFamily(family);
  };

  const handleThemeChange = (newTheme: string) => {
    updateTheme(newTheme as Theme);
  };

  return (
    <div class={`${styles.container} ${isLargeFont ? styles.largeFont : ''}`} data-theme={theme}>
      <header class={`${styles.header} ${styles.mobilePageHeader} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate('home')}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.pageTitle}>Configuración</h1>
      </header>

      <main class={styles.main}>
        {matchesSearch('theme') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Tema</h3>
            <div class={styles.themePicker}>
              {THEMES.map(t => (
                <button
                  key={t.value}
                  class={`${styles.themeOption} ${theme === t.value ? styles.selected : ''}`}
                  onClick={() => handleThemeChange(t.value)}
                  title={t.label}
                >
                  <div
                    class={styles.themePreview}
                    style={{ backgroundColor: t.bg, borderColor: t.text }}
                  >
                    <span style={{ color: t.text }}>Aa</span>
                  </div>
                  <span class={styles.themeLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchesSearch('color') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Color de Énfasis</h3>
            <div class={styles.colorPicker}>
              {COLORS.map(c => (
                <button
                  key={c.value}
                  class={`${styles.colorOption} ${tempColor === c.value ? styles.selected : ''}`}
                  onClick={() => handleColorChange(c.value)}
                  title={c.label}
                  style={{ backgroundColor: c.hex }}
                >
                  {tempColor === c.value && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" class={styles.checkIcon}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {matchesSearch('fontSize') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Tamaño de Letra</h3>
            <Slider
              value={tempFontSize}
              min={0}
              max={4}
              step={1}
              onChange={handleFontSizeChange}
              showLabels
              labels={['Chico', '', '', '', 'Grande']}
            />
          </div>
        )}

        {matchesSearch('fontFamily') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Tipo de Letra</h3>
            <div class={styles.fontPicker}>
              {FONTS.map(f => (
                <button
                  key={f.value}
                  class={`${styles.fontOption} ${fontFamily === f.value ? styles.selected : ''}`}
                  onClick={() => handleFontFamilyChange(f.value)}
                  style={{ fontFamily: f.font }}
                >
                  <span class={styles.fontPreview}>Aa</span>
                  <span class={styles.fontLabel}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchesSearch('account') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Cuenta</h3>
            {user ? (
              <div class={styles.authInfo}>
                <div class={styles.userInfo}>
                  {user.photoURL && <img src={user.photoURL} class={styles.userAvatar} alt="" />}
                  <div>
                    <p class={styles.userName}>{user.displayName || 'Usuario'}</p>
                    <p class={styles.userEmail}>{user.email}</p>
                  </div>
                </div>
                <div class={styles.uidRow}>
                  <span class={styles.uidLabel}>UID:</span>
                  <code class={styles.uidValue}>{user.uid}</code>
                  <button class={styles.uidCopyBtn} onClick={() => {
                    navigator.clipboard.writeText(user.uid).then(() => {
                      setUidCopied(true);
                      setTimeout(() => setUidCopied(false), 2000);
                    });
                  }} title="Copiar UID">
                    <CopyIcon size={16} />
                    {uidCopied && <span class={styles.uidCopiedHint}>Copiado</span>}
                  </button>
                </div>
                <button class={styles.secondaryBtn} onClick={() => signOut()}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button class={`${styles.googleBtn} ${styles[color]}`} onClick={() => signInWithGoogle()}>
                <GoogleIcon size={20} /> Iniciar sesión con Google
              </button>
            )}
          </div>
        )}

        {matchesSearch('churches') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Iglesias</h3>
            <button class={styles.churchManageBtn} onClick={() => onNavigate('orden/iglesias')}>
              <ChurchIcon size={20} /> Administrar iglesias
            </button>
          </div>
        )}

        {matchesSearch('bibleVersion') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Versión de la Biblia</h3>
            <div class={styles.versionPicker}>
              {BIBLE_VERSIONS.map(v => (
                <button
                  key={v.id}
                  class={`${styles.versionBtn} ${bibleVersion === v.id ? styles.versionActive : ''}`}
                  onClick={() => updateBibleVersion(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
            <p class={styles.versionHint}>Los capítulos descargados se mantienen en la versión anterior.</p>
          </div>
        )}

        {matchesSearch('appInfo') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Información de la App</h3>
            <p class={styles.versionHint}>Versión {APP_VERSION}</p>
            <div class={styles.infoLinks}>
              <h4 class={styles.subtitle}>Registro de cambios</h4>
              {CHANGELOG.map(entry => (
                <div key={entry.version} class={styles.changelogEntry}>
                  <p class={styles.changelogVersion}>v{entry.version} — {entry.date}</p>
                  <ul class={styles.changelogList}>
                    {entry.changes.map((change, i) => (
                      <li key={i} class={styles.changelogItem}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchesSearch('contact') && (
          <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Contacto y Donaciones</h3>
            <p class={styles.versionHint}>
              App creada para uso gratuito. Si deseas apoyar al mantenimiento del proyecto puedes hacer una donación.
            </p>
            <div class={styles.donateRow}>
              <a
                href="https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=2c93808480710707018077566dd00124"
                target="_blank"
                rel="noopener noreferrer"
                class={`${styles.donateBtn} ${styles[color]}`}
              >
                Donar mensualmente
              </a>
            </div>
            <div class={styles.contactRow}>
              <a href="https://wa.me/529997700066" target="_blank" rel="noopener noreferrer" class={styles.contactLink}>WhatsApp</a>
              <a href="https://www.facebook.com/himnariop" target="_blank" rel="noopener noreferrer" class={styles.contactLink}>Facebook</a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
