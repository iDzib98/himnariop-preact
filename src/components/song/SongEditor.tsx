import { useState, useEffect } from 'preact/hooks';
import type { UserSong, Verso } from '../../types/himno';
import { getUserSong, saveUserSong, generateSongId } from '../../services/userSongStorage';
import { useSettings } from '../../hooks/useSettings';
import { getCurrentUser, signInWithGoogle } from '../../services/authService';
import { saveSongToCloud } from '../../services/cloudSongService';
import { uploadSongFile } from '../../services/songMediaService';
import { ChevronLeftIcon, DeleteIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, GoogleIcon } from '../ui/Icons';
import styles from './SongEditor.module.css';

interface Props {
  songId: string;
  onNavigate: (path: string) => void;
}

export function SongEditor({ songId, onNavigate }: Props) {
  const isNew = songId === 'nuevo';
  const [song, setSong] = useState<UserSong>(() => {
    if (!isNew) {
      const existing = getUserSong(songId);
      if (existing) return existing;
    }
    return {
      id: isNew ? generateSongId() : songId,
      titulo: '',
      intro: '',
      referencias: [],
      autores: [],
      versos: [],
      ownerId: '',
      ownerName: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      approvedChurches: [],
      pendingChurches: [],
    };
  });

  const { color, theme } = useSettings();
  const user = getCurrentUser();

  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [overflowVersos, setOverflowVersos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      setSong(prev => ({
        ...prev,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || '',
      }));
    }
  }, [user]);

  const updateField = <K extends keyof UserSong>(key: K, value: UserSong[K]) => {
    setSong(prev => ({ ...prev, [key]: value, updatedAt: Date.now() }));
  };

  const addReferencia = () => {
    updateField('referencias', [...song.referencias, '']);
  };

  const updateReferencia = (idx: number, value: string) => {
    const refs = [...song.referencias];
    refs[idx] = value;
    updateField('referencias', refs);
  };

  const removeReferencia = (idx: number) => {
    updateField('referencias', song.referencias.filter((_, i) => i !== idx));
  };

  const addAutor = () => {
    updateField('autores', [...song.autores, '']);
  };

  const updateAutor = (idx: number, value: string) => {
    const autores = [...song.autores];
    autores[idx] = value;
    updateField('autores', autores);
  };

  const removeAutor = (idx: number) => {
    updateField('autores', song.autores.filter((_, i) => i !== idx));
  };

  const addVerso = () => {
    const num = song.versos.length + 1;
    const newVerso: Verso = { nombre: String(num), lineas: [''] };
    updateField('versos', [...song.versos, newVerso]);
  };

  const updateVersoNombre = (idx: number, value: string) => {
    const versos = song.versos.map((v, i) => i === idx ? { ...v, nombre: value } : v);
    updateField('versos', versos);
  };

  const updateVersoContent = (idx: number, value: string) => {
    const allLines = value.split('\n');
    const nonEmptyLines = allLines.filter(l => l.trim() !== '');
    const hasMoreThan8 = nonEmptyLines.length > 8;
    const lines = allLines.slice(0, 8);
    const versos = song.versos.map((v, i) => i === idx ? { ...v, lineas: lines } : v);
    updateField('versos', versos);
    setOverflowVersos(prev => {
      const next = new Set(prev);
      if (hasMoreThan8) {
        next.add(idx);
      } else {
        next.delete(idx);
      }
      return next;
    });
  };

  const getVersoContent = (lineas: string[]): string => {
    return lineas.join('\n');
  };

  const removeVerso = (idx: number) => {
    updateField('versos', song.versos.filter((_, i) => i !== idx));
  };

  const moveVerso = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= song.versos.length) return;
    const versos = [...song.versos];
    [versos[idx], versos[target]] = [versos[target], versos[idx]];
    updateField('versos', versos);
  };

  const handlePdfUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !user) return;
    setUploadingPdf(true);
    try {
      const url = await uploadSongFile(user.uid, song.id, file, 'pdf');
      updateField('pdfUrl', url);
    } catch (err: any) {
      alert(err.message || 'Error al subir PDF');
    }
    setUploadingPdf(false);
    input.value = '';
  };

  const handleAudioUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !user) return;
    setUploadingAudio(true);
    try {
      const url = await uploadSongFile(user.uid, song.id, file, 'audio');
      updateField('audioUrl', url);
    } catch (err: any) {
      alert(err.message || 'Error al subir audio');
    }
    setUploadingAudio(false);
    input.value = '';
  };

  const handleSave = async () => {
    if (!song.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }
    setSaving(true);
    try {
      let songToSave = song;
      if (user && !song.ownerId) {
        songToSave = { ...song, ownerId: user.uid, ownerName: user.displayName || user.email || '' };
        setSong(songToSave);
      }
      saveUserSong(songToSave);
      if (user) {
        try {
          await saveSongToCloud(songToSave, user.uid);
        } catch (err) {
          console.error('Cloud save failed:', err);
        }
      }
      onNavigate(`canto/${song.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class={styles.container} data-theme={theme}>
      <header class={`${styles.header} ${styles[color]}`}>
        <button class={styles.backBtn} onClick={() => onNavigate(isNew ? 'home' : `canto/${song.id}`)}>
          <ChevronLeftIcon size={24} />
        </button>
        <h1 class={styles.headerTitle}>{isNew ? 'Nuevo canto' : 'Editar canto'}</h1>
        <button class={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </header>

      <main class={styles.main}>
        <div class={styles.field}>
          <label class={styles.label}>Título</label>
          <input
            class={styles.input}
            value={song.titulo}
            onInput={(e) => updateField('titulo', (e.target as HTMLInputElement).value)}
            placeholder="Título del canto"
          />
        </div>

        <div class={styles.field}>
          <label class={styles.label}>Introducción (opcional)</label>
          <textarea
            class={`${styles.input} ${styles.textarea}`}
            value={song.intro}
            onInput={(e) => updateField('intro', (e.target as HTMLTextAreaElement).value)}
            placeholder="Cita bíblica o texto introductorio..."
            rows={2}
          />
        </div>

        <div class={styles.field}>
          <label class={styles.label}>Referencias bíblicas</label>
          {song.referencias.map((ref, i) => (
            <div key={i} class={styles.listItem}>
              <input
                class={styles.input}
                value={ref}
                onInput={(e) => updateReferencia(i, (e.target as HTMLInputElement).value)}
                placeholder="Ej: 1-Ef. 1:3"
              />
              <button class={styles.removeBtn} onClick={() => removeReferencia(i)}>
                <DeleteIcon size={18} />
              </button>
            </div>
          ))}
          <button class={styles.addBtn} onClick={addReferencia}>
            <PlusIcon size={16} /> Agregar referencia
          </button>
        </div>

        <div class={styles.field}>
          <label class={styles.label}>Autores</label>
          {song.autores.map((autor, i) => (
            <div key={i} class={styles.listItem}>
              <input
                class={styles.input}
                value={autor}
                onInput={(e) => updateAutor(i, (e.target as HTMLInputElement).value)}
                placeholder="Ej: LETRA: Nombre, 2024"
              />
              <button class={styles.removeBtn} onClick={() => removeAutor(i)}>
                <DeleteIcon size={18} />
              </button>
            </div>
          ))}
          <button class={styles.addBtn} onClick={addAutor}>
            <PlusIcon size={16} /> Agregar autor
          </button>
        </div>

        <div class={styles.field}>
          <div class={styles.versesHeader}>
            <label class={styles.label}>Versos</label>
            <span class={styles.verseHint}>Máx. 8 líneas por estrofa</span>
          </div>
          {song.versos.map((verso, vi) => (
            <div key={vi} class={styles.versoCard}>
              <div class={styles.versoHeader}>
                <input
                  class={styles.versoNombre}
                  value={verso.nombre}
                  onInput={(e) => updateVersoNombre(vi, (e.target as HTMLInputElement).value)}
                  placeholder="Nombre de la estrofa (1, Coro, etc.)"
                />
                <div class={styles.versoActions}>
                  <button class={styles.moveBtn} disabled={vi === 0} onClick={() => moveVerso(vi, -1)}>
                    <ChevronUpIcon size={18} />
                  </button>
                  <button class={styles.moveBtn} disabled={vi === song.versos.length - 1} onClick={() => moveVerso(vi, 1)}>
                    <ChevronDownIcon size={18} />
                  </button>
                  <button class={styles.removeBtn} onClick={() => removeVerso(vi)}>
                    <DeleteIcon size={18} />
                  </button>
                </div>
              </div>
              <textarea
                class={`${styles.input} ${styles.versoTextarea}`}
                value={getVersoContent(verso.lineas)}
                onInput={(e) => updateVersoContent(vi, (e.target as HTMLTextAreaElement).value)}
                placeholder="Escribe las líneas de la estrofa aquí... (usa Enter para separar líneas)"
                rows={4}
              />
              {overflowVersos.has(vi) && (
                <span class={styles.verseOverflowWarning}>
                  Más de 8 líneas puede causar problemas en la proyección
                </span>
              )}
            </div>
          ))}
          <button class={`${styles.addBtn} ${styles.addVersoBtn}`} onClick={addVerso}>
            <PlusIcon size={16} /> Agregar estrofa
          </button>
        </div>

        <div class={styles.field}>
          <label class={styles.label}>Partitura (PDF) — opcional</label>
          {song.pdfUrl && (
            <div class={styles.mediaItem}>
              <a href={song.pdfUrl} target="_blank" rel="noopener noreferrer" class={styles.mediaLink}>
                {song.pdfUrl.split('/').pop() || 'Ver PDF'}
              </a>
              <button class={styles.removeBtn} onClick={() => updateField('pdfUrl', undefined)}>
                <DeleteIcon size={18} />
              </button>
            </div>
          )}
          {!song.pdfUrl && (
            <>
              <input
                class={styles.input}
                value={song.pdfUrl || ''}
                onInput={(e) => updateField('pdfUrl', (e.target as HTMLInputElement).value || undefined)}
                placeholder="URL del PDF (opcional)"
                disabled={!!song.pdfUrl}
              />
              <div class={styles.uploadRow}>
                {user ? (
                  <label class={`${styles.uploadBtn} ${styles[color]}`}>
                    {uploadingPdf ? 'Subiendo...' : 'Subir PDF'}
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} hidden disabled={uploadingPdf} />
                  </label>
                ) : (
                  <div class={styles.loginPrompt}>
                    <span>Inicia sesión para subir archivos</span>
                    <button class={styles.googleBtn} onClick={() => signInWithGoogle()}>
                      <GoogleIcon size={16} /> Iniciar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div class={styles.field}>
          <label class={styles.label}>Pista de audio — opcional</label>
          {song.audioUrl && (
            <div class={styles.mediaItem}>
              <audio src={song.audioUrl} controls class={styles.audioPreview} />
              <button class={styles.removeBtn} onClick={() => updateField('audioUrl', undefined)}>
                <DeleteIcon size={18} />
              </button>
            </div>
          )}
          {!song.audioUrl && (
            <>
              <input
                class={styles.input}
                value={song.audioUrl || ''}
                onInput={(e) => updateField('audioUrl', (e.target as HTMLInputElement).value || undefined)}
                placeholder="URL del audio (MP3) — opcional"
                disabled={!!song.audioUrl}
              />
              <div class={styles.uploadRow}>
                {user ? (
                  <label class={`${styles.uploadBtn} ${styles[color]}`}>
                    {uploadingAudio ? 'Subiendo...' : 'Subir audio'}
                    <input type="file" accept=".mp3,.ogg,.wav,.m4a" onChange={handleAudioUpload} hidden disabled={uploadingAudio} />
                  </label>
                ) : (
                  <div class={styles.loginPrompt}>
                    <span>Inicia sesión para subir archivos</span>
                    <button class={styles.googleBtn} onClick={() => signInWithGoogle()}>
                      <GoogleIcon size={16} /> Iniciar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
