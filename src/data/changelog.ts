export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2026-07-05',
    changes: [
      'Subir y compartir cantos personalizados',
      'Subir presentaciones de diapositivas a las órdenes de culto',
      'Sincronización de favoritos entre dispositivos',
      'Inicio de sesión con Google para respaldo en la nube',
      'Editor de nombre y descripción de iglesias',
      'Botón para copiar UID en configuración',
      'Correcciones visuales según el tema de la aplicación',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-07-01',
    changes: [
      'Nueva interfaz de usuario modernizada',
      'Soporte para órdenes de culto',
      'Reproductor de audio en modo TV',
      'Soporte offline para PDFs y audios',
      'Mejoras en la experiencia de lectura bíblica',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-01',
    changes: [
      'Lanzamiento inicial de la aplicación',
    ],
  },
];

export const APP_VERSION = '2.1.0';
