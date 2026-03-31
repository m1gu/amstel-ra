<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config/database.php';

// Change this before running in production.
$secret = 'Amstel2026_BloqueoVideos_9xK2';

if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'Forbidden',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// run=1 executes updates. Any other value keeps dry-run mode.
$execute = isset($_GET['run']) && $_GET['run'] === '1';

try {
    $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['user'], $config['pass'], $config['options']);

    $sqlDisableOldYears = "
        UPDATE tournament_videos tv
        JOIN tournament_phases tp ON tp.id = tv.phase_id
        JOIN tournaments t ON t.id = tp.tournament_id
        SET tv.is_active = 0
        WHERE t.year IN (2022, 2023, 2024, 2025)
    ";

    $sqlDisable2026 = "
        UPDATE tournament_videos tv
        JOIN tournament_phases tp ON tp.id = tv.phase_id
        JOIN tournaments t ON t.id = tp.tournament_id
        SET tv.is_active = 0
        WHERE t.year = 2026
    ";

    if (!$execute) {
        echo json_encode([
            'ok' => true,
            'dry_run' => true,
            'message' => 'No changes applied. Use ?key=YOUR_KEY&run=1 to execute.',
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $pdo->beginTransaction();

    $stmt1 = $pdo->prepare($sqlDisableOldYears);
    $stmt1->execute();
    $updatedOldYears = $stmt1->rowCount();

    $stmt2 = $pdo->prepare($sqlDisable2026);
    $stmt2->execute();
    $updated2026 = $stmt2->rowCount();

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'dry_run' => false,
        'updated_2022_2025' => $updatedOldYears,
        'updated_2026' => $updated2026,
        'message' => 'Videos disabled successfully.',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

