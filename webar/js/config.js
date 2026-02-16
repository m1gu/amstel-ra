/**
 * APP_CONFIG - Parametrización global de la aplicación
 */
export const APP_CONFIG = {
    // Parámetros de MindAR para ajuste de estabilidad y tracking
    mindar: {
        filterMinCF: 0.001,   // Sensibilidad al movimiento (menor = más estable)
        filterBeta: 10,       // Velocidad de respuesta (mayor = menos lag pero más vibración)
        warmupTolerance: 5,   // Tolerancia de frames antes de dar por perdido el target
        missTolerance: 5,     // Tolerancia de frames perdidos antes de activar onTargetLost
        numberOfTargets: 4    // Cantidad de estadios/targets en targets.mind
    },

    // Configuración de Assets (Fase 5A)
    assets: {
        animation: './assets/animations/estadio1.json',
        video: './assets/videos/video-goles.mp4'
    },

    // Ajustes de Visualización
    ui: {
        scanHintDelay: 3000,
        // Animación Lottie
        animation: {
            scaleX: 2.0,
            scaleY: 3.5,
            offsetX: 0.05,
            offsetY: 0
        },
        // Contenedor de Video y Botón (se mueven juntos)
        videoContent: {
            scale: 1.5,
            posX: 20,
            posY: 0,
            posZ: 0.6,
            ctaMargin: 0.1 // Espacio entre el video y el botón
        },
        cta: {
            text: "CONOCE MÁS",
            link: "https://www.youtube.com/watch?v=1V2FC5aomtY",
            backgroundColor: "#E30613", // Rojo Amstel
            textColor: "#FFFFFF",
            fontSize: 40,
            width: 512,
            height: 128,
            borderRadius: 20
        }
    }
};
