/**
 * APP_CONFIG - Parametrización global de la aplicación
 */
export const APP_CONFIG = {
    // Parámetros de MindAR — balance entre suavidad y persistencia
    mindar: {
        filterMinCF: 0.001,  // Más sensible que default (0.001) pero no extremo
        filterBeta: 40,       // Suave — evita jittering (default 10, antes 1000)
        warmupTolerance: 3,   // Detectar rápido
        missTolerance: 10,    // Tolerante antes de perder el target
        numberOfTargets: 8,   // Cantidad de targets en targets.mind
        gracePeriod: 500,     // ms de gracia antes de ocultar al perder el target (0 = sin gracia)
        visibilityCheckTime: 5 // segundos — forzar 100% visibilidad de todos los elementos después de este tiempo
    },

    // Archivo de escenas configurado desde el editor
    sceneData: './assets/scenes.json',

    // Ajustes de Visualización / UI Global
    ui: {
        scanHintDelay: 3000,
        cta: {
            backgroundColor: "#E30613", // Rojo Amstel
            textColor: "#FFFFFF",
            fontSize: 40,
            width: 512,
            height: 128,
            borderRadius: 20
        }
    },

    // Efecto de confeti para celebración
    confetti: {
        enabled: true,          // Activar/desactivar el confeti globalmente
        burstCount: 120,        // Partículas de explosión desde el centro
        rainCount: 80,          // Partículas cayendo desde arriba
        burstSpeed: 2.5,        // Velocidad de la explosión
        rainSpeed: 0.8,         // Velocidad de caída
        particleSize: 3,        // Tamaño de cada partícula (en pixeles)
        duration: 10,           // Duración total en segundos
        colors: ['#E30613', '#FFD700', '#FFFFFF', '#00A651', '#0080FF', '#FF6B00']
    },
    // Ajustes para gráficos 2D (Lottie)
    lottie: {
        saturation: 1.2, // Multiplicador de color (1.0 = original, 1.5 = muy saturado, 0.0 = blanco y negro)
    },

    // Iluminación para modelos 3D y colores
    lighting: {
        ambientIntensity: 0.3,       // Luz general (default: 0.45)
        directionalIntensity: 0.5,   // Luz direccional principal (default: 1.0)
        envMapIntensity: 0.8,        // Fuerza del reflejo del entorno en el metal (default: 1.0)
        toneMappingExposure: 0.8     // Exposición general de la cámara (default: 1.0)
    },

    // Audio de ambiente (Barras de fútbol)
    audio: {
        enabled: true,
        url: './assets/sounds/crowd.mp3',
        volume: 0.5
    }
};
