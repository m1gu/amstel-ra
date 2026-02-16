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
     * Obtener fases de un torneo por año
     */
    public function getPhases(Request $request, Response $response, array $args): Response
    {
        $year = $args['year'];

        $stmt = $this->db->prepare("
            SELECT tp.* 
            FROM tournament_phases tp
            JOIN tournaments t ON tp.tournament_id = t.id
            WHERE t.year = ? AND t.is_active = 1
            ORDER BY tp.display_order ASC
        ");
        $stmt->execute([$year]);
        $phases = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($phases));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener videos de una fase por slug
     */
    public function getVideos(Request $request, Response $response, array $args): Response
    {
        $phaseSlug = $args['slug'];

        $stmt = $this->db->prepare("
            SELECT tv.* 
            FROM tournament_videos tv
            JOIN tournament_phases tp ON tv.phase_id = tp.id
            WHERE tp.slug = ? AND tv.is_active = 1
            ORDER BY tv.display_order ASC
        ");
        $stmt->execute([$phaseSlug]);
        $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($videos));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener datos de la final de un torneo por año
     */
    public function getFinalData(Request $request, Response $response, array $args): Response
    {
        $year = $args['year'];

        $stmt = $this->db->prepare("
            SELECT tf.* 
            FROM tournament_finals tf
            JOIN tournaments t ON tf.tournament_id = t.id
            WHERE t.year = ?
        ");
        $stmt->execute([$year]);
        $final = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$final) {
            $response->getBody()->write(json_encode(['error' => 'No final data found for this tournament']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($final));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // --- MÉTODOS ADMINISTRATIVOS ---

    /**
     * Crear un nuevo torneo
     */
    public function createTournament(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("INSERT INTO tournaments (year, name, display_order, is_active) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['year'],
            $data['name'],
            $data['display_order'] ?? 0,
            $data['is_active'] ?? 1
        ]);

        $data['id'] = $this->db->lastInsertId();
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Actualizar un torneo
     */
    public function updateTournament(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("UPDATE tournaments SET year = ?, name = ?, display_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([
            $data['year'],
            $data['name'],
            $data['display_order'],
            $data['is_active'],
            $id
        ]);

        return $response->withStatus(204);
    }

    /**
     * Eliminar un torneo
     */
    public function deleteTournament(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM tournaments WHERE id = ?");
        $stmt->execute([$id]);
        return $response->withStatus(204);
    }

    /**
     * Crear una nueva fase
     */
    public function createPhase(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("INSERT INTO tournament_phases (tournament_id, name, slug, phase_type, has_sub_phases, display_order, is_unlocked) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['tournament_id'],
            $data['name'],
            $data['slug'],
            $data['phase_type'] ?? 'knockout',
            $data['has_sub_phases'] ?? 0,
            $data['display_order'] ?? 0,
            $data['is_unlocked'] ?? 1
        ]);

        $data['id'] = $this->db->lastInsertId();
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Actualizar una fase
     */
    public function updatePhase(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("UPDATE tournament_phases SET name = ?, slug = ?, phase_type = ?, has_sub_phases = ?, display_order = ?, is_unlocked = ? WHERE id = ?");
        $stmt->execute([
            $data['name'],
            $data['slug'],
            $data['phase_type'],
            $data['has_sub_phases'],
            $data['display_order'],
            $data['is_unlocked'],
            $id
        ]);

        return $response->withStatus(204);
    }

    /**
     * Eliminar una fase
     */
    public function deletePhase(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM tournament_phases WHERE id = ?");
        $stmt->execute([$id]);
        return $response->withStatus(204);
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
        $stmt = $this->db->prepare("UPDATE tournament_videos SET sub_phase = ?, title = ?, video_url = ?, thumbnail_url = ?, video_type = ?, team_home = ?, team_away = ?, display_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([
            $data['sub_phase'],
            $data['title'],
            $data['video_url'],
            $data['thumbnail_url'],
            $data['video_type'],
            $data['team_home'],
            $data['team_away'],
            $data['display_order'],
            $data['is_active'],
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

    /**
     * Guardar datos de la final (Upsert)
     */
    public function saveFinalData(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Usar REPLACE INTO o INSERT ... ON DUPLICATE KEY UPDATE ya que tournament_id es UNIQUE
        $stmt = $this->db->prepare("
            REPLACE INTO tournament_finals 
            (tournament_id, team_home_name, team_home_logo_url, team_away_name, team_away_logo_url, score_home, score_away, stadium_name, match_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['tournament_id'],
            $data['team_home_name'],
            $data['team_home_logo_url'] ?? null,
            $data['team_away_name'],
            $data['team_away_logo_url'] ?? null,
            $data['score_home'] ?? 0,
            $data['score_away'] ?? 0,
            $data['stadium_name'] ?? null,
            $data['match_date'] ?? null
        ]);

        return $response->withStatus(200);
    }
}
