export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.2',
    date: '2026-07-19',
    changes: [
      'División de estrofas largas en 91 himnos para proyección óptima en modo TV (máx. 8 líneas por estrofa)',
      'Divisiones manuales: #34, #38, #41, #42, #44, #51, #55, #58, #66, #69, #71, #72, #95, #108, #134, #139, #186, #211, #213, #217, #218, #220, #223, #224, #226, #232, #233, #237, #247, #261, #263, #274, #277, #290, #291, #292, #322, #333, #334, #369, #372, #384, #392, #393, #403, #410, #413, #427, #428, #435, #440, #466, #469, #471, #477, #480, #481, #487, #490, #610, #615, #618, #621, #622, #626, #630, #631, #633, #666, #676, #696',
      'Divisiones automáticas por líneas en blanco: #24, #103, #120, #125, #127, #130, #131, #138, #145, #171, #174, #176, #177, #178, #179, #420, #429, #444, #446, #661',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-07-12',
    changes: [
      'Tooltip interactivo para referencias bíblicas: al pasar el cursor o tocar una referencia se muestra el texto del versículo',
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

export const APP_VERSION = '2.1.2';
