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
     * Obtener lista de ciudades únicas
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

    // --- MÉTODOS ADMINISTRATIVOS ---

    /**
     * Crear un local
     */
    public function createLocation(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("INSERT INTO store_locations (city, store_name, address, is_active, display_order) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['city'],
            $data['store_name'],
            $data['address'],
            $data['is_active'] ?? 1,
            $data['display_order'] ?? 0
        ]);

        $data['id'] = $this->db->lastInsertId();
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Actualizar un local
     */
    public function updateLocation(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $stmt = $this->db->prepare("UPDATE store_locations SET city = ?, store_name = ?, address = ?, is_active = ?, display_order = ? WHERE id = ?");
        $stmt->execute([
            $data['city'],
            $data['store_name'],
            $data['address'],
            $data['is_active'],
            $data['display_order'],
            $id
        ]);

        return $response->withStatus(204);
    }

    /**
     * Eliminar un local
     */
    public function deleteLocation(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM store_locations WHERE id = ?");
        $stmt->execute([$id]);
        return $response->withStatus(204);
    }

    /**
     * Importación masiva (Estructura base)
     */
    public function bulkImport(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody(); // Se espera un array de locales
        $locations = $data['locations'] ?? [];

        if (empty($locations)) {
            $response->getBody()->write(json_encode(['error' => 'No data to import']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO store_locations (city, store_name, address) VALUES (?, ?, ?)");
            foreach ($locations as $loc) {
                $stmt->execute([$loc['city'], $loc['store_name'], $loc['address']]);
            }
            $this->db->commit();
            return $response->withStatus(201);
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
