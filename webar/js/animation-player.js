/**
 * Animation Player - Handles Lottie animations using Canvas renderer for Three.js integration
 */
export class AnimationPlayer {
    constructor() {
        this.animation = null;
        this.canvas = document.createElement('canvas');
        // Usamos una resolución base alta para que se vea nítido
        this.canvas.width = 1024;
        this.canvas.height = 1024;
        this.isPlaying = false;
        this.onCompleteCallback = null;
    }

    async load(path) {
        console.log("Cargando animación Lottie:", path);
        try {
            // 1. Obtener los datos primero para conocer las dimensiones reales
            const response = await fetch(path);
            const ad = await response.json();
            const width = ad.w || 1024;
            const height = ad.h || 1024;

            // Limpiamos rastro de pruebas anteriores
            const oldContainer = document.getElementById('lottie-hidden-container');
            if (oldContainer) oldContainer.remove();

            const container = document.createElement('div');
            container.id = 'lottie-hidden-container';
            // IMPORTANTE: No usar 'display: none' porque Lottie lo detecta como 0x0
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            container.style.width = width + 'px';
            container.style.height = height + 'px';
            container.style.visibility = 'hidden';
            document.body.appendChild(container);

            return new Promise((resolve, reject) => {
                this.animation = lottie.loadAnimation({
                    container: container,
                    renderer: 'canvas',
                    loop: false,
                    autoplay: false,
                    animationData: ad,
                    rendererSettings: {
                        preserveAspectRatio: 'xMidYMid meet',
                        clearCanvas: true,
                        dpr: 1 // [CRÍTICO] Evita que Lottie use el Pixel Ratio del móvil, manteniendo el 1:1
                    }
                });

                this.animation.addEventListener('DOMLoaded', () => {
                    const lottieCanvas = container.querySelector('canvas');
                    if (lottieCanvas) {
                        lottieCanvas.width = width;
                        lottieCanvas.height = height;
                        lottieCanvas.style.width = width + 'px';
                        lottieCanvas.style.height = height + 'px';
                        this.canvas = lottieCanvas;
                    }
                    console.log("Lottie: Animación centrada y bloqueada a DPR 1.");
                    resolve();
                });

                this.animation.addEventListener('complete', () => {
                    console.log("Lottie: Animación completada");
                    this.isPlaying = false;
                    if (this.onCompleteCallback) this.onCompleteCallback();
                });
            });
        } catch (e) {
            console.error("Error cargando Lottie:", e);
            throw e;
        }
    }

    play(onComplete = null) {
        if (!this.animation) return;
        this.onCompleteCallback = onComplete;
        this.isPlaying = true;
        this.animation.goToAndPlay(0);
        console.log("Lottie: Reproduciendo...");
    }

    getCanvas() {
        return this.canvas;
    }

    update() {
        if (!this.animation || !this.canvas || this.canvas.width === 0) return true;

        // --- GUÍA DE DIAGNÓSTICO (Temporal) ---
        // Dibujamos un borde verde alrededor del canvas para ver su límite real en AR
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }
        // ---------------------------------------

        return this.isPlaying;
    }
}
