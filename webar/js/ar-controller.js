import { AnimationPlayer } from './animation-player.js';
import { VideoPlayer } from './video-player.js';
import { SceneLoader } from './scene-loader.js';
import { TimelineEngine } from './timeline-engine.js';
import { ObjLoader } from './obj-loader.js';
import { ConfettiEffect } from './confetti-effect.js';
import { AudioManager } from './audio-manager.js';
import { APP_CONFIG } from './config.js';

export class ARController {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.mindarThree = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;

        this.sceneLoader = new SceneLoader();
        this.objLoader = new ObjLoader();
        this.audioManager = new AudioManager();

        // Estructura para guardar motores y elementos por Target Image Index
        this.targetsMap = new Map();

        // Auto-rotation tracking
        this.autoRotateObjects = [];

        // Flag wave tracking
        this.flagWaveObjects = [];

        // Pulse Scale animation tracking
        this.pulseObjects = [];

        // Confetti effects per target
        this.confettiEffects = [];

        this.raycaster = null;
        this.mouse = null;
        // Colección de todos los CTAs activos (para detectarlos en _onCanvasClick)
        this.activeCTAs = [];
        this.activeVideoPlayers = [];
        this.allVideoPlayers = [];
        this.isVideoAudioMuted = true;
    }

    async start(onProgress) {
        console.log("Iniciando ARController...");
        const report = (percent, text) => {
            if (onProgress) onProgress({ percent, text });
        };

        const THREE = window.MINDAR.IMAGE.THREE;

        // 1. Cargar el JSON de escenas
        report(0, 'Cargando configuración de escenas...');
        const sceneData = await this.sceneLoader.load(APP_CONFIG.sceneData);
        report(5, 'Escenas cargadas');

        // 2. Setup MindAR
        report(8, 'Configurando motor de tracking...');
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

        this.renderer = this.mindarThree.renderer;
        this.scene = this.mindarThree.scene;
        this.camera = this.mindarThree.camera;


        // --- CALIBRACIÓN DE COLOR (ACESFilmic previene que los colores se quemen/laven) ---
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = APP_CONFIG.lighting ? APP_CONFIG.lighting.toneMappingExposure : 1.0;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Generar Environment Map tipo estudio para materiales metálicos PBR
        const envMap = this._createStudioEnvMap(THREE);
        this.scene.environment = envMap;
        this.objLoader.setEnvironmentMap(envMap);

        // Luces para modelos 3D usando los nuevos parámetros en config.js
        const ambientIntensity = APP_CONFIG.lighting ? APP_CONFIG.lighting.ambientIntensity : 0.45;
        const dirIntensity = APP_CONFIG.lighting ? APP_CONFIG.lighting.directionalIntensity : 1.0;

        const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, dirIntensity);
        dirLight.position.set(2, 5, 5);
        this.scene.add(dirLight);

        console.log("ARController: Environment Map + luces configurados.");

        this.container.addEventListener('click', (e) => this._onCanvasClick(e, THREE));
        this.container.addEventListener('touchstart', (e) => this._onCanvasClick(e, THREE));

        // 3. Count total elements for progress tracking
        report(12, 'Preparando escenas...');
        let totalElements = 0;
        for (let t = 0; t < APP_CONFIG.mindar.numberOfTargets; t++) {
            const sc = this.sceneLoader.getSceneForMarker(sceneData, t);
            if (sc && sc.elements) totalElements += sc.elements.filter(e => e.visible).length;
        }
        let loadedElements = 0;

        // 4. Configurar los anchors sin cargar los elementos aún (Lazy Loading)
        for (let targetIndex = 0; targetIndex < APP_CONFIG.mindar.numberOfTargets; targetIndex++) {
            const anchor = this.mindarThree.addAnchor(targetIndex);

            // Guardar datos básicos en el mapa, marcando como no cargado
            this.targetsMap.set(anchor.group.uuid, {
                targetIndex,
                sceneConfig: this.sceneLoader.getSceneForMarker(sceneData, targetIndex),
                loaded: false,
                isLoading: false, // Flag para evitar cargas duplicadas simultáneas
                timeline: new TimelineEngine(),
                ctaList: [],
                confettiEffects: [],
                videoPlayers: []
            });

            // Sticky tracking — grace period para no perder el contenido inmediatamente
            let lostTimeout = null;

            anchor.onTargetFound = async () => {
                console.log(`Target ${targetIndex} detectado`);

                if (lostTimeout) {
                    clearTimeout(lostTimeout);
                    lostTimeout = null;
                }

                // Carga diferida de elementos la primera vez que se ve el marcador
                const targetData = this.targetsMap.get(anchor.group.uuid);
                if (!targetData.loaded && !targetData.isLoading) {
                    targetData.isLoading = true; // Bloquear nuevas cargas mientras esta esté en curso
                    try {
                        await this._loadTargetElements(anchor, targetData, THREE);
                    } catch (err) {
                        console.error(`Fallo crítico cargando Scene ${targetIndex}:`, err);
                    } finally {
                        targetData.isLoading = false;
                    }
                }

                document.getElementById('scan-hint').classList.add('hidden');
                anchor.group.visible = true;

                // Actualizar CTAs activos
                this.activeCTAs = targetData.ctaList;
                this.activeVideoPlayers = targetData.videoPlayers;
                this._applyVideoAudioStateToPlayers(this.activeVideoPlayers);

                // Arrancar línea de tiempo
                targetData.timeline.start();

                // Lanzar confeti
                targetData.confettiEffects.forEach(c => c.start());

                // Sonido de barra
                this.audioManager.playSceneSound();
            };

            anchor.onTargetLost = () => {
                const grace = APP_CONFIG.mindar.gracePeriod || 0;
                const targetData = this.targetsMap.get(anchor.group.uuid);

                if (grace <= 0) {
                    document.getElementById('scan-hint').classList.remove('hidden');
                    anchor.group.visible = false;
                    this.activeCTAs = [];
                    this.activeVideoPlayers = [];
                    targetData.timeline.stop();
                    targetData.confettiEffects.forEach(c => c.stop());
                    return;
                }

                lostTimeout = setTimeout(() => {
                    document.getElementById('scan-hint').classList.remove('hidden');
                    anchor.group.visible = false;
                    this.activeCTAs = [];
                    this.activeVideoPlayers = [];
                    targetData.timeline.stop();
                    targetData.confettiEffects.forEach(c => c.stop());
                    lostTimeout = null;
                }, grace);
            };
        }

        // 5. Configurar Botones de UI (Audio y Reset)
        this._setupUIControls();

        // 6. Iniciar motor (compila .mind — paso más pesado)
        report(88, 'Iniciando cámara y compilando markers...');
        await this.mindarThree.start();
        report(100, '¡Listo!');

        // 5. Bucle de Render
        const clock = new (window.MINDAR.IMAGE.THREE.Clock)();
        this.renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // Update confetti effects
            this.confettiEffects.forEach(c => c.update(delta));

            // Update auto-rotating objects
            this.autoRotateObjects.forEach(({ mesh, speed }) => {
                mesh.rotation.y += delta * speed;
            });

            // Update flag wave objects — vertex displacement
            this.flagWaveObjects.forEach(({ mesh, amplitude, frequency, speed }) => {
                if (!mesh.visible) return;
                const geo = mesh.geometry;
                const pos = geo.attributes.position;
                const t = clock.elapsedTime;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const y = pos.getY(i);
                    const waveStrength = (x + 0.5);
                    const z = Math.sin(x * frequency * Math.PI + t * speed * Math.PI)
                        * amplitude * waveStrength
                        + Math.sin(y * 2 + t * speed * 1.3) * amplitude * 0.3 * waveStrength;
                    pos.setZ(i, z);
                }
                pos.needsUpdate = true;
                geo.computeVertexNormals();
            });

            // Update pulse animations
            this.pulseObjects.forEach(({ mesh, pulseTarget, pulseSpeed }) => {
                if (!mesh.visible) return;
                const t = clock.elapsedTime * pulseSpeed * Math.PI * 2;
                const pulseFactor = (Math.sin(t) + 1) / 2; // 0 to 1
                const currentScale = 1.0 + (pulseTarget - 1.0) * pulseFactor;
                mesh.scale.set(currentScale, currentScale, currentScale);
            });

            // Actualizar todas las líneas de tiempo que estén corriendo
            for (const [, targetData] of this.targetsMap.entries()) {
                if (targetData.timeline.isRunning) {
                    targetData.timeline.update();
                }
            }
            this.renderer.render(this.scene, this.camera);
        });
    }

    /**
     * Carga los elementos de un marcador específico (Lazy Loading)
     */
    async _loadTargetElements(anchor, targetData, THREE) {
        if (!targetData.sceneConfig || !targetData.sceneConfig.elements) {
            targetData.loaded = true;
            return;
        }

        console.log(`Cargando elementos para Escena ${targetData.targetIndex + 1}...`);

        for (const elementConfig of targetData.sceneConfig.elements) {
            if (!elementConfig.visible) continue;

            const { mesh, player, isCTA, confettiRef } = await this._createElement(elementConfig, THREE);

            if (confettiRef) {
                targetData.confettiEffects.push(confettiRef);
            }

            if (elementConfig.type === 'confettiBurst' || elementConfig.type === 'confettiRain') {
                mesh.position.set(0, 0, 0);
            } else {
                mesh.position.set(elementConfig.position[0], elementConfig.position[1], elementConfig.position[2]);
            }
            mesh.rotation.set(elementConfig.rotation[0], elementConfig.rotation[1], elementConfig.rotation[2]);
            mesh.scale.set(elementConfig.scale[0], elementConfig.scale[1], elementConfig.scale[2]);

            anchor.group.add(mesh);

            if (elementConfig.type !== 'confettiBurst' && elementConfig.type !== 'confettiRain') {
                targetData.timeline.addTrack(mesh, elementConfig, player);
            }

            if (isCTA) {
                mesh.userData.link = elementConfig.url;
                targetData.ctaList.push(mesh);
            }

            if (elementConfig.type === 'video' && player) {
                targetData.videoPlayers.push(player);
                this.allVideoPlayers.push(player);
                this._applyVideoAudioStateToPlayers([player]);
            }
        }

        targetData.loaded = true;
        console.log(`Escena ${targetData.targetIndex + 1} cargada con éxito.`);
    }

    /**
     * Factory function que instancia visualmente el elemento 3D correcto.
     */
    async _createElement(config, THREE) {
        let mesh = null;
        let player = null;
        let isCTA = false;

        // Resolve asset URL — editor exports relative to assets/, WebAR serves from ./assets/
        // Don't prefix if already has ./assets/ or is an absolute URL
        let assetUrl = config.url;
        if (assetUrl && !assetUrl.startsWith('./assets/') && !assetUrl.startsWith('http')) {
            assetUrl = `./assets/${assetUrl}`;
        }


        try {
            switch (config.type) {
                case 'lottie':
                    player = new AnimationPlayer();
                    await player.load(assetUrl, {
                        loop: config.loop !== undefined ? config.loop : true
                    });
                    const canvas = player.getCanvas();
                    const tx = new THREE.CanvasTexture(canvas);
                    if (THREE.SRGBColorSpace) tx.colorSpace = THREE.SRGBColorSpace;
                    else if (THREE.sRGBEncoding) tx.encoding = THREE.sRGBEncoding;

                    const mat = new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });

                    // --- MODIFICADOR DE SHADER: SATURACIÓN DE LOTTIE ---
                    const lottieSat = APP_CONFIG.lottie ? APP_CONFIG.lottie.saturation : 1.0;
                    if (lottieSat !== 1.0) {
                        mat.onBeforeCompile = (shader) => {
                            shader.uniforms.uSaturation = { value: lottieSat };
                            shader.fragmentShader = `uniform float uSaturation;\n` + shader.fragmentShader;
                            shader.fragmentShader = shader.fragmentShader.replace(
                                '#include <map_fragment>',
                                `
                                #include <map_fragment>
                                // Fórmula Luma para calcular brillo neto del pixel
                                float lum = dot(diffuseColor.rgb, vec3(0.2125, 0.7154, 0.0721));
                                // Mezclar entre Escala de Grises y Color Original según factor
                                diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, uSaturation);
                                `
                            );
                        };
                    }

                    // Use subdivided geometry if flagWave is enabled
                    const planeGeo = config.flagWave
                        ? new THREE.PlaneGeometry(1, 1, 32, 32)
                        : new THREE.PlaneGeometry(1, 1);
                    mesh = new THREE.Mesh(planeGeo, mat);

                    // Register for flag wave animation
                    if (config.flagWave) {
                        this.flagWaveObjects.push({
                            mesh,
                            amplitude: config.flagAmplitude || 0.15,
                            frequency: config.flagFrequency || 3,
                            speed: config.flagSpeed || 2
                        });
                    }

                    // Texture update function — called by TimelineEngine
                    player.update = () => {
                        if (player.isPlaying) tx.needsUpdate = true;
                    };
                    break;

                case 'video':
                    player = new VideoPlayer();
                    await player.load(assetUrl);
                    player.setMuted(this.isVideoAudioMuted);
                    const vTx = player.getTexture();
                    if (THREE.SRGBColorSpace) vTx.colorSpace = THREE.SRGBColorSpace;
                    else if (THREE.sRGBEncoding) vTx.encoding = THREE.sRGBEncoding;

                    const vMat = new THREE.MeshBasicMaterial({ map: vTx, transparent: true, side: THREE.DoubleSide, toneMapped: false });
                    mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.77, 1), vMat);
                    break;

                case 'obj3d':
                    const modelGroup = await this.objLoader.load(assetUrl);
                    mesh = new THREE.Group();
                    mesh.add(modelGroup);

                    // Auto-rotation support
                    if (config.autoRotate) {
                        const speed = config.autoRotateSpeed || 1;
                        this.autoRotateObjects.push({ mesh: modelGroup, speed });
                    }
                    break;

                case 'cta':
                    isCTA = true;
                    mesh = this._createCTAButton(config.name || APP_CONFIG.ui.cta.text, THREE);
                    break;

                case 'confettiBurst':
                case 'confettiRain':
                    // Create confetti effect from scenes.json element config
                    console.log(`[AR-CTRL] Creating confetti: type=${config.type}, emitter=${config.emitterType}, count=${config.particleCount}, size=${config.particleSize}, pos=[${config.position}]`);
                    const confettiEffect = new ConfettiEffect(THREE);
                    confettiEffect.config = {
                        emitterType: config.emitterType || (config.type === 'confettiBurst' ? 'burst' : 'rain'),
                        particleCount: config.particleCount || 80,
                        particleSpeed: config.particleSpeed || 1.5,
                        particleSize: config.particleSize || 0.06,
                        duration: config.confettiDuration || 6,
                        colors: config.confettiColors || ['#E30613', '#FFD700', '#FFFFFF', '#00A651', '#0080FF', '#FF6B00']
                    };
                    mesh = new THREE.Group();
                    confettiEffect.init(mesh);
                    this.confettiEffects.push(confettiEffect);
                    player = confettiEffect;
                    break;

                case 'image':
                    console.log(`[IMAGE] Cargando imagen: ${assetUrl}`);
                    mesh = await new Promise((resolve) => {
                        const loader = new THREE.TextureLoader();
                        loader.load(assetUrl, (texture) => {
                            if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
                            else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;

                            const w = texture.image ? texture.image.width : 0;
                            const h = texture.image ? texture.image.height : 0;
                            console.log(`[IMAGE] ✅ Cargada: ${assetUrl} (${w}x${h}px)`);
                            const aspect = w / h || 1;
                            const imgMat = new THREE.MeshBasicMaterial({
                                map: texture,
                                transparent: true,
                                side: THREE.DoubleSide,
                                depthWrite: false,
                                toneMapped: false
                            });

                            const containerMesh = new THREE.Group();
                            const innerMesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), imgMat);
                            containerMesh.add(innerMesh);

                            if (config.pulseScale) {
                                this.pulseObjects.push({
                                    mesh: innerMesh,
                                    pulseTarget: config.pulseTarget || 1.2,
                                    pulseSpeed: config.pulseSpeed || 0.5
                                });
                            }
                            resolve(containerMesh);
                        }, undefined, (err) => {
                            console.error(`[IMAGE] ❌ Error cargando: ${assetUrl}`, err);
                            resolve(new THREE.Group());
                        });
                    });
                    break;

                default:
                    console.warn(`Tipo de elemento no soportado: ${config.type}`);
                    mesh = new THREE.Group();
            }
        } catch (error) {
            console.error(`Error creando elemento de tipo ${config.type}:`, error);
            mesh = new THREE.Group();
        }

        // Ajustes comunes para UI Plana (depth buffering)
        if (config.type !== 'obj3d' && mesh.isMesh) {
            mesh.renderOrder = 999;
        }

        return { mesh, player, isCTA, confettiRef: (config.type === 'confettiBurst' || config.type === 'confettiRain') ? this.confettiEffects[this.confettiEffects.length - 1] : null };
    }

    _createCTAButton(text, THREE) {
        const config = APP_CONFIG.ui.cta;
        const canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = config.backgroundColor;
        this._roundRect(ctx, 0, 0, canvas.width, canvas.height, config.borderRadius, true);

        ctx.fillStyle = config.textColor;
        ctx.font = `bold ${config.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;

        const geometry = new THREE.PlaneGeometry(0.8, 0.2);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            toneMapped: false
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

    _onCanvasClick(event, THREE) {
        if (this.activeCTAs.length === 0) return;

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
        // Intersectamos contra todos los CTAs activos (con visibilidad heredada true)
        const checkCTAs = this.activeCTAs.filter(cta => cta.visible);
        const intersects = this.raycaster.intersectObjects(checkCTAs);

        if (intersects.length > 0) {
            console.log("CTA Pulsado!");
            const targetCTA = intersects[0].object;
            const link = targetCTA.userData.link || 'https://www.amstel.com.ec';
            window.open(link, '_blank');
        }
    }

    /**
     * Genera un Environment Map procedural tipo "estudio fotográfico" para reflejos metálicos.
     * Usa PMREMGenerator con una escena de luces hemisféricas para crear reflejos suaves y neutros.
     */
    _createStudioEnvMap(THREE) {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        // Crear una mini-escena con luces que simulan un estudio fotográfico
        const envScene = new THREE.Scene();

        // Luz hemisférica: cielo blanco cálido arriba, suelo gris frío abajo
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1.5);
        hemiLight.position.set(0, 1, 0);
        envScene.add(hemiLight);

        const light3 = new THREE.DirectionalLight(0xffffff, 0.3);
        light3.position.set(0, -1, 5);
        envScene.add(light3);

        // --- ESTUDIO PRO: Softboxes virtuales para reflejos definidos ---
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // Softbox Derecha (Reflejo vertical largo)
        const sbRight = new THREE.Mesh(boxGeo, boxMat);
        sbRight.position.set(5, 2, 0);
        sbRight.scale.set(0.1, 8, 2);
        envScene.add(sbRight);

        // Softbox Izquierda
        const sbLeft = new THREE.Mesh(boxGeo, boxMat);
        sbLeft.position.set(-5, 2, 0);
        sbLeft.scale.set(0.1, 8, 2);
        envScene.add(sbLeft);

        // Softbox Superior (Brillo en la parte de arriba del globo)
        const sbTop = new THREE.Mesh(boxGeo, boxMat);
        sbTop.position.set(0, 5, 0);
        sbTop.scale.set(4, 0.1, 4);
        envScene.add(sbTop);

        // Un fondo gris medio-oscuro para balancear reflejos
        envScene.background = new THREE.Color(0x444444);

        // Generar el environment map
        const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
        pmremGenerator.dispose();

        return envMap;
    }

    stop() {
        if (this.mindarThree) {
            this.mindarThree.stop();
            this.renderer.setAnimationLoop(null);
        }
        if (this.audioManager) {
            this.audioManager.stop();
        }
    }

    /**
     * Configura los listeners para los botones de la UI (Reset y Audio)
     */
    _setupUIControls() {
        const resetBtn = document.getElementById('reset-btn');
        const audioBtn = document.getElementById('audio-toggle');
        const videoAudioBtn = document.getElementById('video-audio-unlock');

        if (resetBtn) {
            resetBtn.onclick = () => window.location.reload();
        }

        if (audioBtn) {
            audioBtn.onclick = () => {
                const isMuted = this.audioManager.toggleMute();
                audioBtn.textContent = isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
                audioBtn.classList.toggle('muted', isMuted);
            };
        }

        if (videoAudioBtn) {
            videoAudioBtn.onclick = async () => {
                this.isVideoAudioMuted = !this.isVideoAudioMuted;
                await this._applyVideoAudioStateToPlayers(this.allVideoPlayers, true);
                this._refreshVideoAudioButtonUI();
            };

            this._refreshVideoAudioButtonUI();
        }
    }

    async _applyVideoAudioStateToPlayers(players, fromUserGesture = false) {
        if (!players || players.length === 0) return;

        for (const player of players) {
            if (!player) continue;
            player.setMuted(this.isVideoAudioMuted);

            // Si el usuario pulsó el botón y está en modo con audio,
            // forzamos un play() para intentar desbloquear audio del video activo.
            if (!this.isVideoAudioMuted && fromUserGesture) {
                try {
                    await player.unlockAudio();
                } catch (err) {
                    console.warn('No se pudo activar audio del video:', err);
                }
            }
        }
    }

    _refreshVideoAudioButtonUI() {
        const videoAudioBtn = document.getElementById('video-audio-unlock');
        if (!videoAudioBtn) return;

        videoAudioBtn.classList.remove('hidden');
        videoAudioBtn.classList.toggle('is-muted', this.isVideoAudioMuted);
        videoAudioBtn.setAttribute(
            'aria-label',
            this.isVideoAudioMuted ? 'Activar audio del video' : 'Silenciar audio del video'
        );
    }
}

