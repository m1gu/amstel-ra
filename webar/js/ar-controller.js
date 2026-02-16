import { AnimationPlayer } from './animation-player.js';
import { VideoPlayer } from './video-player.js';
import { APP_CONFIG } from './config.js';

export class ARController {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.mindarThree = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.animationPlayer = new AnimationPlayer();
        this.videoPlayer = new VideoPlayer();
        this.lottiePlane = null;
        this.lottieTexture = null;
        this.videoPlane = null;
        this.ctaPlane = null;
        this.contentGroup = null; // Grupo para Video + Botón
        this.raycaster = null;
        this.mouse = null;
    }

    async start() {
        console.log("Comprobando disponibilidad de MindAR...");

        let retryCount = 0;
        while (!window.MINDAR?.IMAGE?.MindARThree && retryCount < 10) {
            console.warn(`MindAR no listo (intento ${retryCount + 1}). Reintentando...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
        }

        if (!window.MINDAR?.IMAGE?.MindARThree) {
            throw new Error("MindARThree not found");
        }

        // --- SOLUCIÓN PUNTO 1: Sincronización de Instancias ---
        // Usamos EXCLUSIVAMENTE la instancia de Three.js que viene dentro de MindAR
        // Esto garantiza que los objetos sean visibles para su motor de renderizado.
        const THREE = window.MINDAR.IMAGE.THREE;
        // -----------------------------------------------------

        try {
            await this.animationPlayer.load(APP_CONFIG.assets.animation);
        } catch (e) {
            console.error("No se pudo cargar la animación Lottie:", e);
        }

        // Cargar el Video
        try {
            await this.videoPlayer.load(APP_CONFIG.assets.video);
        } catch (e) {
            console.error("No se pudo cargar el video MP4:", e);
        }

        // Inicializar MindAR con Three.js y parámetros de tracking (Fase 5)
        this.mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: this.container,
            imageTargetSrc: './assets/markers/targets.mind',
            uiLoading: "no",
            uiScanning: "no",
            filterMinCF: APP_CONFIG.mindar.filterMinCF,
            filterBeta: APP_CONFIG.mindar.filterBeta,
            warmupTolerance: APP_CONFIG.mindar.warmupTolerance,
            missTolerance: APP_CONFIG.mindar.missTolerance
        });

        const { renderer, scene, camera } = this.mindarThree;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Inicializar Raycaster y Mouse usando el motor interno de MindAR (Fase 5A Fix)
        // Esto evita el error "THREE is not a constructor" al compartir la instancia correcta.
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Listener para clics
        this.container.addEventListener('click', (e) => this._onCanvasClick(e, THREE));
        this.container.addEventListener('touchstart', (e) => this._onCanvasClick(e, THREE));

        // Crear el plano para la animación Lottie
        const canvas = this.animationPlayer.getCanvas();
        this.lottieTexture = new THREE.CanvasTexture(canvas);

        // Aumentamos el tamaño inicial para que sea visible (Fase 3 Fix)
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            map: this.lottieTexture,
            transparent: true,
            side: THREE.BackSide // Algunas veces el orden de caras afecta en AR
        });

        // Creamos un plano con DoubleSide para asegurar visibilidad
        const materialDouble = new THREE.MeshBasicMaterial({
            map: this.lottieTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });

        this.lottiePlane = new THREE.Mesh(geometry, materialDouble);
        this.lottiePlane.visible = false;

        // Aplicamos la escala y posición desde la configuración (Fase 5A Update)
        const animCfg = APP_CONFIG.ui.animation;
        this.lottiePlane.scale.set(animCfg.scaleX, animCfg.scaleY, 1);
        this.lottiePlane.position.set(animCfg.offsetX, animCfg.offsetY, 0.5);
        this.lottiePlane.renderOrder = 999;

        // Crear el plano para el Video (Fase 4)
        const videoTexture = this.videoPlayer.getTexture();
        // El video suele ser 16:9, ajustamos escala
        const videoGeometry = new THREE.PlaneGeometry(1, 0.5625);
        const videoMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            transparent: true, // Por si el video tiene fondo pero se desea blending
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });

        this.videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
        this.videoPlane.visible = false;

        // Crear el botón CTA (Fase 5A)
        this.ctaPlane = this._createCTAButton(THREE);
        this.ctaPlane.visible = false;

        // --- CONTENEDOR UNIFICADO (Fase 5A Fix) ---
        this.contentGroup = new THREE.Group();
        this.contentGroup.add(this.videoPlane);
        this.contentGroup.add(this.ctaPlane);

        const videoCfg = APP_CONFIG.ui.videoContent;
        this.contentGroup.scale.set(videoCfg.scale, videoCfg.scale, 1);
        this.contentGroup.position.set(videoCfg.posX, videoCfg.posY, videoCfg.posZ);

        // El video se queda en 0,0 dentro del grupo
        this.videoPlane.position.set(0, 0, 0);
        this.videoPlane.renderOrder = 1000;

        // El botón se ubica relativo al fondo del video (video alto = 0.5625)
        // Mitad del video es 0.281, así que -0.281 es la base
        const ctaY = -0.28125 - (videoCfg.ctaMargin || 0.1);
        this.ctaPlane.position.set(0, ctaY, 0.1);
        this.ctaPlane.renderOrder = 1001;
        // -------------------------------------------

        // Soporte Multi-target (Fase 5A)
        for (let i = 0; i < APP_CONFIG.mindar.numberOfTargets; i++) {
            const anchor = this.mindarThree.addAnchor(i);

            // Cada target tendrá los mismos objetos adjuntos
            // Nota: En Three.js un objeto solo puede pertenecer a un padre.
            // Para multi-target real simultáneo se necesitarían clones, 
            // pero MindAR oculta/muestra por target, así que podemos re-adjuntar
            // o manejar visibilidad global. Como se espera un target a la vez:

            anchor.onTargetFound = () => {
                console.log(`Target ${i} detectado`);
                document.getElementById('scan-hint').classList.add('hidden');

                // Mover los objetos al anchor actual
                anchor.group.add(this.lottiePlane);
                anchor.group.add(this.contentGroup);

                setTimeout(() => {
                    const canvas = this.animationPlayer.getCanvas();
                    if (canvas && this.lottieTexture.image !== canvas) {
                        this.lottieTexture.image = canvas;
                    }

                    this.lottiePlane.visible = true;
                    this.animationPlayer.play();

                    // Aparecer video tras 4 segundos (Requerimiento Usuario)
                    this._videoTimer = setTimeout(() => {
                        if (this.lottiePlane.visible) { // Solo si el target sigue ahí
                            console.log("4 segundos transcurridos: Mostrando video y CTA...");
                            this.videoPlane.visible = true;
                            this.ctaPlane.visible = true;
                            this.videoPlayer.play();
                        }
                    }, 4000);
                }, 100);
            };

            anchor.onTargetLost = () => {
                console.log(`Target ${i} perdido`);
                // Limpiar timer si se pierde el target antes de los 4s
                if (this._videoTimer) clearTimeout(this._videoTimer);

                // Solo ocultamos si no hay otros targets activos (simplificado)
                document.getElementById('scan-hint').classList.remove('hidden');
                this.lottiePlane.visible = false;
                this.videoPlane.visible = false;
                this.ctaPlane.visible = false;
                this.videoPlayer.pause();
            };
        }

        // Iniciar el motor AR
        await this.mindarThree.start();

        this.renderer.setAnimationLoop(() => {
            // Aseguramos que el plano de Lottie esté siempre al frente
            this.lottiePlane.position.z = 0.5;
            this.lottiePlane.renderOrder = 999;

            if (this.animationPlayer.update()) {
                this.lottieTexture.needsUpdate = true;
            }

            // El VideoTexture de Three.js se actualiza automáticamente,
            // pero podemos forzarlo si fuera necesario
            if (this.videoPlayer.update()) {
                // videoPlane visible y reproduciendo
            }

            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        if (this.mindarThree) {
            this.mindarThree.stop();
            this.renderer.setAnimationLoop(null);
            this.container.removeEventListener('click', this._onCanvasClick);
            this.container.removeEventListener('touchstart', this._onCanvasClick);
        }
    }

    _onCanvasClick(event, THREE) {
        if (!this.ctaPlane || !this.ctaPlane.visible) return;

        // Normalizar coordenadas del mouse
        let clientX, clientY;
        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.ctaPlane);

        if (intersects.length > 0) {
            console.log("CTA Pulsado!");
            window.open(APP_CONFIG.ui.cta.link || 'https://www.amstel.com.ec', '_blank');
        }
    }

    /**
     * Crea un plano con estilo de botón 2D usando Canvas
     */
    _createCTAButton(THREE) {
        const config = APP_CONFIG.ui.cta;
        const canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        const ctx = canvas.getContext('2d');

        // Dibujar fondo redondeado (Rojo Amstel)
        ctx.fillStyle = config.backgroundColor;
        this._roundRect(ctx, 0, 0, canvas.width, canvas.height, config.borderRadius, true);

        // Dibujar texto (Blanco)
        ctx.fillStyle = config.textColor;
        ctx.font = `bold ${config.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(0.8, 0.2); // Proporción del botón en 3D
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });

        return new THREE.Mesh(geometry, material);
    }

    _roundRect(ctx, x, y, width, height, radius, fill) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
    }
}
