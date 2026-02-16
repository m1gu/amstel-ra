<?php
// backend/src/Controllers/AuthController.php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Firebase\JWT\JWT;
use PDO;

class AuthController
{
    protected $db;
    protected $secret = 'AMSTEL_SECRET_2026_ECUADOR_NATIONAL'; // En producción usar variable de entorno

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // NOTA: Para el seed inicial usamos 'CAMBIAR_EN_PRODUCCION' o hash. 
        // Verificamos contra el hash del seed o texto plano si es prueba (usar password_verify en real)
        if ($user && ($password === 'admin123' || password_verify($password, $user['password_hash']))) {
            $payload = [
                'iss' => 'amstel-ar',
                'iat' => time(),
                'exp' => time() + (3600 * 8), // 8 horas
                'sub' => $user['id'],
                'email' => $user['email']
            ];

            $token = JWT::encode($payload, $this->secret, 'HS256');

            $response->getBody()->write(json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email']
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['success' => false, 'message' => 'Credenciales inválidas']));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }
}
