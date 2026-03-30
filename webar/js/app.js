/**
 * Amstel AR Demo - Main Entry Point
 */

import { ARController } from './ar-controller.js';

class App {
    constructor() {
        this.arController = null;
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.progressPercent = document.getElementById('progress-percent');
        this.init();
    }

    updateProgress(percent, text) {
        if (this.progressFill) this.progressFill.style.width = percent + '%';
        if (this.progressText) {
            this.progressText.textContent = text && text.startsWith('Error') ? text : 'Cargando...';
        }
        if (this.progressPercent) this.progressPercent.textContent = Math.round(percent) + '%';
    }

    async init() {
        console.log("Iniciando Amstel AR Demo...");

        try {
            this.updateProgress(5, 'Iniciando motor AR...');

            // Esperar a que MindAR esté disponible
            let retryCount = 0;
            while (!window.MINDAR?.IMAGE?.MindARThree && retryCount < 15) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
                this.updateProgress(5 + retryCount * 2, 'Cargando librería MindAR...');
            }

            if (!window.MINDAR?.IMAGE?.MindARThree) {
                throw new Error("MindARThree no se cargó");
            }

            this.updateProgress(30, 'Librería AR lista');

            // Inicializar controlador de AR con callback de progreso
            this.arController = new ARController('#ar-container');

            await this.arController.start((progress) => {
                // progress = { percent: 0-100, text: string }
                // Map AR controller progress (0-100) to our range (30-90)
                const mappedPercent = 30 + (progress.percent * 0.6);
                this.updateProgress(mappedPercent, progress.text);
            });

            this.updateProgress(95, 'Iniciando cámara...');

            // Pequeña pausa para que se vea el 95%
            await new Promise(resolve => setTimeout(resolve, 500));
            this.updateProgress(100, '¡Listo!');

            // Fade out suave
            await new Promise(resolve => setTimeout(resolve, 400));
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-out');

            // Esperar a que termine la animación de fade y luego mostrar scan hint
            await new Promise(resolve => setTimeout(resolve, 600));
            loadingScreen.classList.add('hidden');
            document.getElementById('scan-hint').classList.remove('hidden');

            console.log("AR iniciado correctamente");

        } catch (error) {
            console.error("Error inicializando la aplicación:", error);
            this.updateProgress(0, 'Error: Asegúrate de usar HTTPS y permitir cámara');
            if (this.progressFill) this.progressFill.style.background = '#e74c3c';
        }
    }
}

// Iniciar aplicación cuando el DOM esté listo
const bootApp = () => {
    if (window.app) return;
    window.app = new App();
};

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootApp, { once: true });
} else {
    bootApp();
}
