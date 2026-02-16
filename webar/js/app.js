/**
 * Amstel AR Demo - Main Entry Point
 */

import { ARController } from './ar-controller.js';

class App {
    constructor() {
        this.arController = null;
        this.init();
    }

    async init() {
        console.log("Iniciando Amstel AR Demo...");

        try {
            // Inicializar controlador de AR
            this.arController = new ARController('#ar-container');

            // Simular carga de assets
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Ocultar pantalla de carga
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('scan-hint').classList.remove('hidden');

            // Iniciar cámara
            await this.arController.start();
            console.log("AR iniciado correctamente");

        } catch (error) {
            console.error("Error inicializando la aplicación:", error);
            // Mensaje de error más descriptivo
            const loader = document.querySelector('#loading-screen p');
            if (loader) loader.innerText = "Error: Asegúrate de usar HTTPS y permitir el acceso a la cámara.";
        }
    }
}

// Iniciar aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
