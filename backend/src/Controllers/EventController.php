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
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $source = $data['source'] ?? 'web';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        // Parsear User-Agent
        $deviceType = $this->detectDeviceType($userAgent);
        $browser = $this->detectBrowser($userAgent);
        $os = $this->detectOS($userAgent);

        // Geolocalización por IP (ip-api.com, gratis hasta 45 req/min)
        $city = null;
        $country = null;
        try {
            $geoUrl = "http://ip-api.com/json/{$ipAddress}?fields=status,country,city&lang=es";
            $geoData = @file_get_contents($geoUrl);
            if ($geoData) {
                $geo = json_decode($geoData, true);
                if (($geo['status'] ?? '') === 'success') {
                    $city = $geo['city'] ?? null;
                    $country = $geo['country'] ?? null;
                }
            }
        } catch (\Exception $e) {
            // Silenciar errores de geolocalización
        }

        $stmt = $this->db->prepare("
            INSERT INTO sessions (session_uuid, user_agent, ip_address, device_type, browser, os, referrer, source, city, country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $uuid,
            $userAgent,
            $ipAddress,
            $deviceType,
            $browser,
            $os,
            $data['referrer'] ?? null,
            $source,
            $city,
            $country
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

    // --- User-Agent Parsing Helpers ---

    private function detectDeviceType(string $ua): string
    {
        $ua = strtolower($ua);
        if (preg_match('/tablet|ipad|playbook|silk/', $ua)) return 'tablet';
        if (preg_match('/mobile|android|iphone|ipod|opera mini|iemobile/', $ua)) return 'mobile';
        return 'desktop';
    }

    private function detectBrowser(string $ua): string
    {
        if (preg_match('/SamsungBrowser/i', $ua)) return 'Samsung Internet';
        if (preg_match('/Edg/i', $ua)) return 'Edge';
        if (preg_match('/OPR|Opera/i', $ua)) return 'Opera';
        if (preg_match('/Firefox/i', $ua)) return 'Firefox';
        if (preg_match('/CriOS|Chrome/i', $ua)) return 'Chrome';
        if (preg_match('/Safari/i', $ua)) return 'Safari';
        return 'Other';
    }

    private function detectOS(string $ua): string
    {
        if (preg_match('/Windows/i', $ua)) return 'Windows';
        if (preg_match('/Macintosh|Mac OS/i', $ua)) return 'macOS';
        if (preg_match('/iPhone|iPad|iPod/i', $ua)) return 'iOS';
        if (preg_match('/Android/i', $ua)) return 'Android';
        if (preg_match('/Linux/i', $ua)) return 'Linux';
        return 'Other';
    }
}
