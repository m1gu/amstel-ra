/**
 * SceneLoader - Fetches and parses the scenes.json exported by the Editor
 */
export class SceneLoader {
    constructor() { }

    async load(url) {
        console.log("SceneLoader: Buscando archivo de escenas en", url);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
            const data = await res.json();
            console.log("SceneLoader: Archivo cargado con exito. Escenas:", data.scenes.length);
            return data;
        } catch (err) {
            console.error("SceneLoader: Error fatal al cargar scenes.json.", err);
            // Devolver un default vacio en caso de fallo para no romper la app entera
            return { formatVersion: '1.0', scenes: [] };
        }
    }

    /**
     * Devuelve la escena asociada a un indice de marcador especifico.
     */
    getSceneForMarker(sceneData, markerIndex) {
        if (!sceneData || !sceneData.scenes) return null;

        const directMatch = sceneData.scenes.find((scene) => this._sceneMatchesMarker(scene, markerIndex));
        if (directMatch) return directMatch;

        // Fallback para reutilizar escenas cuando existe un segundo bloque de markers.
        // Ejemplo: 4->0, 5->1, 6->2, 7->3.
        const baseSceneCount = this._getBaseSceneCount(sceneData.scenes);
        if (baseSceneCount > 0) {
            const normalizedIndex = markerIndex % baseSceneCount;
            return sceneData.scenes.find((scene) => this._sceneMatchesMarker(scene, normalizedIndex)) || null;
        }

        return null;
    }

    _sceneMatchesMarker(scene, markerIndex) {
        const values = Array.isArray(scene.targetImageIndex)
            ? scene.targetImageIndex
            : [scene.targetImageIndex];

        return values.some((value) =>
            value === markerIndex ||
            value === markerIndex.toString()
        ) || scene.markerId === markerIndex.toString();
    }

    _getBaseSceneCount(scenes) {
        const numericIndexes = scenes
            .flatMap((scene) => Array.isArray(scene.targetImageIndex) ? scene.targetImageIndex : [scene.targetImageIndex])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0);

        if (numericIndexes.length === 0) return 0;

        return Math.max(...numericIndexes) + 1;
    }
}
