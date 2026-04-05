<?php
// backend/src/Controllers/DashboardController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class DashboardController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Helper: Extraer filtros de fecha de la query string
     */
    private function getDateFilters(Request $request): array
    {
        $params = $request->getQueryParams();
        $dateTo = $params['date_to'] ?? date('Y-m-d');
        $dateFrom = $params['date_from'] ?? date('Y-m-d', strtotime('-30 days'));

        // Ajustar date_to al final del día
        $dateToEnd = $dateTo . ' 23:59:59';

        return [$dateFrom, $dateToEnd];
    }

    /**
     * Helper: Escribir respuesta JSON
     */
    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    // =========================================================
    // ENDPOINT 1: GET /api/admin/dashboard/stats
    // KPIs principales
    // =========================================================
    public function getStats(Request $request, Response $response): Response
    {
        [$dateFrom, $dateTo] = $this->getDateFilters($request);

        try {
            // Sesiones totales y usuarios únicos
            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(DISTINCT session_uuid) as unique_users,
                    ROUND(SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as bounce_rate
                FROM sessions
                WHERE started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $sessionStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Duración promedio Landing Web
            $stmt = $this->db->prepare("
                SELECT ROUND(AVG(duration_seconds)) as avg_dur
                FROM sessions
                WHERE source = 'web' AND started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $avgDurationWeb = $stmt->fetch(PDO::FETCH_ASSOC)['avg_dur'];

            // Duración promedio WebAR
            $stmt = $this->db->prepare("
                SELECT ROUND(AVG(duration_seconds)) as avg_dur
                FROM sessions
                WHERE source = 'webar' AND started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $avgDurationWebar = $stmt->fetch(PDO::FETCH_ASSOC)['avg_dur'];

            // Detecciones AR (target_detected)
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE e.event_type = 'target_detected'
                AND s.started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $arDetections = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Videos reproducidos (video_started + tournament_video_play)
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE e.event_type IN ('video_started', 'tournament_video_play')
                AND s.started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $videosPlayed = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Búsquedas de tiendas
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE e.event_type = 'store_search'
                AND s.started_at BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $storeSearches = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            return $this->json($response, [
                'total_sessions' => (int)$sessionStats['total_sessions'],
                'unique_users' => (int)$sessionStats['unique_users'],
                'avg_duration_web' => (int)($avgDurationWeb ?? 0),
                'avg_duration_webar' => (int)($avgDurationWebar ?? 0),
                'bounce_rate' => (float)($sessionStats['bounce_rate'] ?? 0),
                'total_ar_detections' => (int)$arDetections,
                'total_videos_played' => (int)$videosPlayed,
                'total_store_searches' => (int)$storeSearches
            ]);
        } catch (\Exception $e) {
            return $this->json($response, ['error' => $e->getMessage()], 500);
        }
    }

    // =========================================================
    // ENDPOINT 2: GET /api/admin/dashboard/sessions-chart
    // Sesiones por día (para gráfico de línea)
    // =========================================================
    public function getSessionsChart(Request $request, Response $response): Response
    {
        [$dateFrom, $dateTo] = $this->getDateFilters($request);

        try {
            $stmt = $this->db->prepare("
                SELECT 
                    DATE(started_at) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN source = 'web' THEN 1 ELSE 0 END) as web,
                    SUM(CASE WHEN source = 'webar' THEN 1 ELSE 0 END) as webar
                FROM sessions
                WHERE started_at BETWEEN ? AND ?
                GROUP BY DATE(started_at)
                ORDER BY date ASC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Cast to int
            $rows = array_map(function ($row) {
                return [
                    'date' => $row['date'],
                    'total' => (int)$row['total'],
                    'web' => (int)$row['web'],
                    'webar' => (int)$row['webar']
                ];
            }, $rows);

            return $this->json($response, $rows);
        } catch (\Exception $e) {
            return $this->json($response, ['error' => $e->getMessage()], 500);
        }
    }

    // =========================================================
    // ENDPOINT 3: GET /api/admin/dashboard/events-breakdown
    // Desglose de eventos por tipo (para gráfico de barras)
    // =========================================================
    public function getEventsBreakdown(Request $request, Response $response): Response
    {
        [$dateFrom, $dateTo] = $this->getDateFilters($request);

        try {
            $stmt = $this->db->prepare("
                SELECT 
                    e.event_type,
                    COUNT(*) as count
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE s.started_at BETWEEN ? AND ?
                GROUP BY e.event_type
                ORDER BY count DESC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $rows = array_map(function ($row) {
                return [
                    'event_type' => $row['event_type'],
                    'count' => (int)$row['count']
                ];
            }, $rows);

            return $this->json($response, $rows);
        } catch (\Exception $e) {
            return $this->json($response, ['error' => $e->getMessage()], 500);
        }
    }

    // =========================================================
    // ENDPOINT 4: GET /api/admin/dashboard/device-distribution
    // Distribución por dispositivo (para donut chart)
    // =========================================================
    public function getDeviceDistribution(Request $request, Response $response): Response
    {
        [$dateFrom, $dateTo] = $this->getDateFilters($request);

        try {
            $stmt = $this->db->prepare("
                SELECT 
                    device_type,
                    COUNT(*) as count
                FROM sessions
                WHERE started_at BETWEEN ? AND ?
                GROUP BY device_type
                ORDER BY count DESC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $rows = array_map(function ($row) {
                return [
                    'device_type' => $row['device_type'],
                    'count' => (int)$row['count']
                ];
            }, $rows);

            return $this->json($response, $rows);
        } catch (\Exception $e) {
            return $this->json($response, ['error' => $e->getMessage()], 500);
        }
    }

    // =========================================================
    // ENDPOINT 5: GET /api/admin/dashboard/top-content
    // Top videos + escaneos por estadio
    // =========================================================
    public function getTopContent(Request $request, Response $response): Response
    {
        [$dateFrom, $dateTo] = $this->getDateFilters($request);

        try {
            // Top videos (por reproducciones en landing)
            $stmt = $this->db->prepare("
                SELECT 
                    JSON_UNQUOTE(JSON_EXTRACT(e.metadata, '$.video_title')) as video_title,
                    COUNT(*) as play_count
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE e.event_type = 'tournament_video_play'
                AND s.started_at BETWEEN ? AND ?
                AND JSON_EXTRACT(e.metadata, '$.video_title') IS NOT NULL
                GROUP BY video_title
                ORDER BY play_count DESC
                LIMIT 10
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $topVideos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $topVideos = array_map(function ($row) {
                return [
                    'video_title' => $row['video_title'] ?? 'Sin título',
                    'play_count' => (int)$row['play_count']
                ];
            }, $topVideos);

            // Escaneos por marker (target_detected agrupado por stadium_id)
            // Mapeo hardcoded: stadium_id 1=Estadio2022, 2=Estadio2023, 3=Estadio2024, 4=Estadio2025
            $markerNames = [
                1 => 'Estadio2022',
                2 => 'Estadio2023',
                3 => 'Estadio2024',
                4 => 'Estadio2025'
            ];

            $stmt = $this->db->prepare("
                SELECT 
                    e.stadium_id,
                    COUNT(*) as detection_count
                FROM events e
                JOIN sessions s ON e.session_id = s.id
                WHERE e.event_type = 'target_detected'
                AND e.stadium_id IS NOT NULL
                AND s.started_at BETWEEN ? AND ?
                GROUP BY e.stadium_id
                ORDER BY e.stadium_id ASC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $stadiumDetections = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stadiumDetections = array_map(function ($row) use ($markerNames) {
                $id = (int)$row['stadium_id'];
                return [
                    'stadium_name' => $markerNames[$id] ?? ('Marker ' . $id),
                    'detection_count' => (int)$row['detection_count']
                ];
            }, $stadiumDetections);

            // Distribución geográfica (top ciudades)
            $stmt = $this->db->prepare("
                SELECT 
                    city,
                    COUNT(*) as session_count
                FROM sessions
                WHERE started_at BETWEEN ? AND ?
                AND city IS NOT NULL AND city != ''
                GROUP BY city
                ORDER BY session_count DESC
                LIMIT 10
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $topCities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $topCities = array_map(function ($row) {
                return [
                    'city' => $row['city'],
                    'session_count' => (int)$row['session_count']
                ];
            }, $topCities);

            return $this->json($response, [
                'top_videos' => $topVideos,
                'stadium_detections' => $stadiumDetections,
                'top_cities' => $topCities
            ]);
        } catch (\Exception $e) {
            return $this->json($response, ['error' => $e->getMessage()], 500);
        }
    }
}
