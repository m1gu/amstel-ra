<?php
// backend/src/Controllers/StadiumController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class StadiumController
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM stadiums WHERE is_active = 1 ORDER BY display_order ASC");
        $stadiums = $stmt->fetchAll();

        $response->getBody()->write(json_encode($stadiums));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getBySlug(Request $request, Response $response, array $args): Response
    {
        $slug = $args['slug'];
        $stmt = $this->db->prepare("SELECT * FROM stadiums WHERE slug = ? AND is_active = 1");
        $stmt->execute([$slug]);
        $stadium = $stmt->fetch();

        if (!$stadium) {
            $response->getBody()->write(json_encode(['error' => 'Stadium not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($stadium));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
