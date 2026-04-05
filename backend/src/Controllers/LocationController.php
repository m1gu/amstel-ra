<?php
// backend/src/Controllers/LocationController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class LocationController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Obtener lista de ciudades unicas
     */
    public function getCities(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT DISTINCT city FROM store_locations WHERE is_active = 1 ORDER BY city ASC");
        $cities = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $response->getBody()->write(json_encode($cities));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Obtener locales por ciudad
     */
    public function getByCity(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        $city = $queryParams['city'] ?? null;

        if (!$city) {
            $response->getBody()->write(json_encode(['error' => 'City parameter is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $stmt = $this->db->prepare("SELECT * FROM store_locations WHERE city = ? AND is_active = 1 ORDER BY display_order ASC, store_name ASC");
        $stmt->execute([$city]);
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($locations));
        return $response->withHeader('Content-Type', 'application/json');
    }
}