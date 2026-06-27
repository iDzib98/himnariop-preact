import type { Himno } from '../types/himno';

let cachedHimnos: Himno[] | null = null;
let fetchPromise: Promise<Himno[]> | null = null;

export async function fetchHimnos(): Promise<Himno[]> {
  if (cachedHimnos !== null) {
    return cachedHimnos;
  }

  if (fetchPromise !== null) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch('./himnos.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      cachedHimnos = Array.isArray(data) ? data : [];
      console.log('[API] Himnos loaded:', cachedHimnos.length);
      return cachedHimnos;
    } catch (error) {
      console.error('[API] Error fetching himnos:', error);
      cachedHimnos = [];
      throw error;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function getHimno(numero: number): Promise<Himno | undefined> {
  const himnos = await fetchHimnos();
  const num = typeof numero === 'string' ? parseInt(numero, 10) : numero;
  const himno = himnos.find(h => h && h.numero === num);
  console.log('[API] getHimno', num, 'found:', !!himno, 'total:', himnos.length);
  return himno;
}

export function getAudioUrl(numero: number): string {
  const padded = numero.toString().padStart(3, '0');
  return `https://a16016344.github.io/himnariop/himno/mp3/${padded}.mp3`;
}

export function getPdfUrl(numero: number): string {
  return `/himnos/${numero}.pdf`;
}

export function getExternalPdfUrl(numero: number): string {
  return `https://ipuertadesalvacion.com/_H1mnar10/${numero}.pdf`;
}

export function clearCache(): void {
  cachedHimnos = null;
}
