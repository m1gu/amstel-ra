/**
 * Video Player - Handles MP4 video playback as a Three.js texture
 */
export class VideoPlayer {
    constructor() {
        this.video = document.createElement('video');
        this.video.setAttribute('webkit-playsinline', 'true');
        this.video.setAttribute('playsinline', 'true');
        this.video.setAttribute('crossorigin', 'anonymous');
        this.video.preload = 'auto';
        this.video.muted = true; // El autoplay suele requerir estar muteado

        this.texture = null;
        this.isPlaying = false;
        this.onCompleteCallback = null;

        this.video.addEventListener('ended', () => {
            console.log("Video: Reproducción finalizada");
            this.isPlaying = false;
            if (this.onCompleteCallback) this.onCompleteCallback();
        });

        this.video.addEventListener('error', (e) => {
            console.error("Video: Error en el elemento de video", e);
        });
    }

    async load(path) {
        console.log("Video: Intentando cargar...", path);
        return new Promise((resolve, reject) => {
            this.video.src = path;
            this.video.load();

            this.video.oncanplaythrough = () => {
                console.log("Video: Cargado y listo.");
                const THREE = window.THREE || window.MINDAR?.IMAGE?.THREE;
                this.texture = new THREE.VideoTexture(this.video);
                resolve();
            };

            this.video.onerror = (e) => {
                reject(e);
            };
        });
    }

    play(onComplete = null) {
        this.onCompleteCallback = onComplete;
        this.video.currentTime = 0;
        this.video.play().then(() => {
            this.isPlaying = true;
            console.log("Video: Reproduciendo...");
        }).catch(err => {
            console.error("Video: Error al reproducir. Reintentando con mute...", err);
            this.video.muted = true;
            this.video.play();
        });
    }

    pause() {
        this.video.pause();
        this.isPlaying = false;
    }

    getTexture() {
        return this.texture;
    }

    update() {
        return this.isPlaying;
    }
}
