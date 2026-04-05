<?php
// backend/src/Controllers/TournamentController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class TournamentController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Obtener todos los torneos activos
     */
    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM tournaments WHERE is_active = 1 ORDER BY year DESC");
        $tournaments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($tournaments));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener fases de un torneo por id
     */
    public function getPhases(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];

        $stmt = $this->db->prepare("\n            SELECT tp.* \n            FROM tournament_phases tp\n            JOIN tournaments t ON tp.tournament_id = t.id\n            WHERE t.id = ? AND t.is_active = 1\n            ORDER BY tp.display_order ASC\n        ");
        $stmt->execute([$id]);
        $phases = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($phases));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener videos publicos de una fase por slug
     */
    public function getVideos(Request $request, Response $response, array $args): Response
    {
        $phaseSlug = $args['slug'];

        $stmt = $this->db->prepare("\n            SELECT tv.* \n            FROM tournament_videos tv\n            JOIN tournament_phases tp ON tv.phase_id = tp.id\n            WHERE tp.slug = ? AND tv.is_active = 1\n            ORDER BY tv.display_order ASC\n        ");
        $stmt->execute([$phaseSlug]);
        $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($videos));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener datos de la final de un torneo por id
     */
    public function getFinalData(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];

        $stmt = $this->db->prepare("\n            SELECT tf.* \n            FROM tournament_finals tf\n            JOIN tournaments t ON tf.tournament_id = t.id\n            WHERE t.id = ?\n        ");
        $stmt->execute([$id]);
        $final = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$final) {
            $response->getBody()->write(json_encode(['error' => 'No final data found for this tournament']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($final));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // --- METODOS ADMINISTRATIVOS (SOLO VIDEOS) ---

    /**
     * Listado admin de videos con metadatos de fase/torneo.
     * Filtros opcionales por query string: year, tournament_id, phase_id.
     */
    public function getAdminVideos(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();

        $sql = "\n            SELECT\n                tv.*,\n                tp.name AS phase_name,\n                tp.slug AS phase_slug,\n                tp.tournament_id,\n                t.year AS tournament_year,\n                t.name AS tournament_name\n            FROM tournament_videos tv\n            JOIN tournament_phases tp ON tv.phase_id = tp.id\n            JOIN tournaments t ON tp.tournament_id = t.id\n        ";

        $conditions = [];
        $values = [];

        if (!empty($queryParams['year'])) {
            $conditions[] = 't.year = ?';
            $values[] = (int) $queryParams['year'];
        }

        if (!empty($queryParams['tournament_id'])) {
            $conditions[] = 'tp.tournament_id = ?';
            $values[] = (int) $queryParams['tournament_id'];
        }

        if (!empty($queryParams['phase_id'])) {
            $conditions[] = 'tv.phase_id = ?';
            $values[] = (int) $queryParams['phase_id'];
        }

        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY t.year DESC, tp.display_order ASC, tv.display_order ASC, tv.id DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);

        $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($videos));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener detalle de un video para admin
     */
    public function getAdminVideoById(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);

        $stmt = $this->db->prepare("\n            SELECT\n                tv.*,\n                tp.name AS phase_name,\n                tp.slug AS phase_slug,\n                tp.tournament_id,\n                t.year AS tournament_year,\n                t.name AS tournament_name\n            FROM tournament_videos tv\n            JOIN tournament_phases tp ON tv.phase_id = tp.id\n            JOIN tournaments t ON tp.tournament_id = t.id\n            WHERE tv.id = ?\n            LIMIT 1\n        ");
        $stmt->execute([$id]);

        $video = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$video) {
            $response->getBody()->write(json_encode(['error' => 'Video not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($video));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Crear un video
     */
    public function createVideo(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("INSERT INTO tournament_videos (phase_id, sub_phase, title, video_url, thumbnail_url, video_type, team_home, team_away, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['phase_id'],
            $data['sub_phase'] ?? null,
            $data['title'],
            $data['video_url'],
            $data['thumbnail_url'] ?? null,
            $data['video_type'] ?? 'highlights',
            $data['team_home'] ?? null,
            $data['team_away'] ?? null,
            $data['display_order'] ?? 0,
            $data['is_active'] ?? 1
        ]);

        $data['id'] = $this->db->lastInsertId();
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Actualizar un video
     */
    public function updateVideo(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = $request->getParsedBody();

        $stmt = $this->db->prepare("UPDATE tournament_videos SET phase_id = ?, sub_phase = ?, title = ?, video_url = ?, thumbnail_url = ?, video_type = ?, team_home = ?, team_away = ?, display_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([
            $data['phase_id'],
            $data['sub_phase'] ?? null,
            $data['title'],
            $data['video_url'],
            $data['thumbnail_url'] ?? null,
            $data['video_type'] ?? 'highlights',
            $data['team_home'] ?? null,
            $data['team_away'] ?? null,
            $data['display_order'] ?? 0,
            $data['is_active'] ?? 1,
            $id
        ]);

        return $response->withStatus(204);
    }

    /**
     * Eliminar un video
     */
    public function deleteVideo(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM tournament_videos WHERE id = ?");
        $stmt->execute([$id]);
        return $response->withStatus(204);
    }
}