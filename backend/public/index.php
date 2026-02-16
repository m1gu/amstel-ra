<?php
// backend/public/index.php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use App\Controllers\AuthController;
use App\Controllers\StadiumController;
use App\Controllers\EventController;
use App\Controllers\TournamentController;
use App\Controllers\LocationController;
use Tuupola\Middleware\JwtAuthentication;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Parsear JSON del body automáticamente
$app->addBodyParsingMiddleware();

// Error Middleware
$app->addErrorMiddleware(true, true, true);

// CORS Middleware
$app->add(function ($request, $handler) {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withStatus(200);
    }
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Configuración de BD
$dbConfig = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['db']};charset={$dbConfig['charset']}";
$pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);

// JWT Middleware (solo para rutas /api/admin)
$authMiddleware = new JwtAuthentication([
    "path" => ["/api/admin"],
    "ignore" => ["/api/auth/login"],
    "secret" => "AMSTEL_SECRET_2026_ECUADOR_NATIONAL",
    "error" => function ($response, $arguments) {
        $data = ["status" => "error", "message" => $arguments["message"]];
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        return $response->withHeader("Content-Type", "application/json")->withStatus(401);
    }
]);
$app->add($authMiddleware);

// --- RUTAS PÚBLICAS ---

$authController = new AuthController($pdo);
$app->post('/api/auth/login', [$authController, 'login']);

$stadiumController = new StadiumController($pdo);
$app->get('/api/stadiums', [$stadiumController, 'getAll']);
$app->get('/api/stadiums/{slug}', [$stadiumController, 'getBySlug']);

$tournamentController = new TournamentController($pdo);
$app->get('/api/tournaments', [$tournamentController, 'getAll']);
$app->get('/api/tournaments/{year}/phases', [$tournamentController, 'getPhases']);
$app->get('/api/tournaments/phases/{slug}/videos', [$tournamentController, 'getVideos']);
$app->get('/api/tournaments/{year}/final', [$tournamentController, 'getFinalData']);

$locationController = new LocationController($pdo);
$app->get('/api/locations/cities', [$locationController, 'getCities']);
$app->get('/api/locations', [$locationController, 'getByCity']);

$eventController = new EventController($pdo);
$app->post('/api/sessions/start', [$eventController, 'startSession']);
$app->post('/api/events', [$eventController, 'trackEvent']);

$app->get('/api/ping', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode(['status' => 'pong', 'timestamp' => time()]));
    return $response->withHeader('Content-Type', 'application/json');
});

// --- RUTAS PROTEGIDAS (CMS/ADMIN) ---
// Aquí irán las rutas CRUD que usará el panel React
$app->group('/api/admin', function ($group) use ($pdo) {
    // Torneos
    $tournamentController = new TournamentController($pdo);
    $group->post('/tournaments', [$tournamentController, 'createTournament']);
    $group->put('/tournaments/{id}', [$tournamentController, 'updateTournament']);
    $group->delete('/tournaments/{id}', [$tournamentController, 'deleteTournament']);

    // Fases
    $group->post('/phases', [$tournamentController, 'createPhase']);
    $group->put('/phases/{id}', [$tournamentController, 'updatePhase']);
    $group->delete('/phases/{id}', [$tournamentController, 'deletePhase']);

    // Videos
    $group->post('/videos', [$tournamentController, 'createVideo']);
    $group->put('/videos/{id}', [$tournamentController, 'updateVideo']);
    $group->delete('/videos/{id}', [$tournamentController, 'deleteVideo']);

    // Final
    $group->post('/final', [$tournamentController, 'saveFinalData']);

    // Locales
    $locationController = new LocationController($pdo);
    $group->post('/locations', [$locationController, 'createLocation']);
    $group->put('/locations/{id}', [$locationController, 'updateLocation']);
    $group->delete('/locations/{id}', [$locationController, 'deleteLocation']);
    $group->post('/locations/bulk', [$locationController, 'bulkImport']);
});

$app->run();
