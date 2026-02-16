<?php
// backend/src/Controllers/EventController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class EventController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function startSession(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $uuid = bin2hex(random_bytes(18)); // Simple UUID

        $stmt = $this->db->prepare("
            INSERT INTO sessions (session_uuid, user_agent, ip_address, referrer)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $uuid,
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            $data['referrer'] ?? null
        ]);

        $response->getBody()->write(json_encode(['session_uuid' => $uuid]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function trackEvent(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $session_uuid = $data['session_uuid'] ?? null;
        $event_type = $data['event_type'] ?? null;
        $stadium_id = $data['stadium_id'] ?? null;

        if (!$session_uuid || !$event_type) {
            $response->getBody()->write(json_encode(['error' => 'Missing data']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Obtener ID de sesión
        $stmt = $this->db->prepare("SELECT id FROM sessions WHERE session_uuid = ?");
        $stmt->execute([$session_uuid]);
        $session = $stmt->fetch();

        if (!$session) {
            $response->getBody()->write(json_encode(['error' => 'Invalid session']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $stmt = $this->db->prepare("
            INSERT INTO events (session_id, event_type, stadium_id, metadata)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $session['id'],
            $event_type,
            $stadium_id,
            json_encode($data['metadata'] ?? [])
        ]);

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
