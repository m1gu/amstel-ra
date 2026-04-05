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
use App\Controllers\DashboardController;
use Tuupola\Middleware\JwtAuthentication;

//require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/vendor/autoload.php';

$app = AppFactory::create();

// Auto-detect base path for subdirectory deployments (e.g. /amstel/api/)
$app->setBasePath(dirname($_SERVER['SCRIPT_NAME']));

// Parsear JSON del body automaticamente
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

// Configuracion de BD
//$dbConfig = require __DIR__ . '/../config/database.php';
$dbConfig = require __DIR__ . '/config/database.php';
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

// --- RUTAS PUBLICAS ---

$authController = new AuthController($pdo);
$app->post('/api/auth/login', [$authController, 'login']);

$stadiumController = new StadiumController($pdo);
$app->get('/api/stadiums', [$stadiumController, 'getAll']);
$app->get('/api/stadiums/{slug}', [$stadiumController, 'getBySlug']);

$tournamentController = new TournamentController($pdo);
$app->get('/api/tournaments', [$tournamentController, 'getAll']);
$app->get('/api/tournaments/years', [$tournamentController, 'getAll']);
$app->get('/api/tournaments/{id}/phases', [$tournamentController, 'getPhases']);
$app->get('/api/tournaments/phases/{slug}/videos', [$tournamentController, 'getVideos']);
$app->get('/api/tournaments/{id}/final', [$tournamentController, 'getFinalData']);

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
$app->group('/api/admin', function ($group) use ($pdo) {
    // CRUD de videos
    $tournamentController = new TournamentController($pdo);
    $group->get('/videos', [$tournamentController, 'getAdminVideos']);
    $group->get('/videos/{id}', [$tournamentController, 'getAdminVideoById']);
    $group->post('/videos', [$tournamentController, 'createVideo']);
    $group->put('/videos/{id}', [$tournamentController, 'updateVideo']);
    $group->delete('/videos/{id}', [$tournamentController, 'deleteVideo']);

    // Dashboard analytics
    $dashboardController = new DashboardController($pdo);
    $group->get('/dashboard/stats', [$dashboardController, 'getStats']);
    $group->get('/dashboard/sessions-chart', [$dashboardController, 'getSessionsChart']);
    $group->get('/dashboard/events-breakdown', [$dashboardController, 'getEventsBreakdown']);
    $group->get('/dashboard/device-distribution', [$dashboardController, 'getDeviceDistribution']);
    $group->get('/dashboard/top-content', [$dashboardController, 'getTopContent']);
});

$app->run();