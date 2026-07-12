export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.1',
    date: '2026-07-12',
    changes: [
      'Corrección de letras en himnos: #3, #10, #11, #16, #17, #33, #58, #66, #68, #71, #72, #91, #92, #101, #105, #128, #165',
      'Corrección de disposición de versos: #45, #46, #255, #517',
      'Corrección de estrofas con último verso faltante: #235, #256, #350, #407',
      'Corrección de signos de puntuación: #12, #20, #74, #80, #93, #126, #699',
      'Corrección de referencias bíblicas: #135, #178',
      'Corrección de datos de autores: #20, #34, #667',
      'Eliminación de palabra extra en #667',
      'Limpieza de espacios en blanco innecesarios en todo el himnario',
      'Eliminación de líneas vacías al final de versos',
      'Normalización del formato de todas las referencias bíblicas (2,654 refs)',
    ],
  },
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

export const APP_VERSION = '2.1.1';
