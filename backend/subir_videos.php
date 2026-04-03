<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/src/SimpleXLSX.php';
$config = require __DIR__ . '/config/database.php';

use Shuchkin\SimpleXLSX;

function normalizeHeader(string $value): string
{
    $value = trim(mb_strtolower($value, 'UTF-8'));
    $value = str_replace([' ', '-'], '_', $value);
    return preg_replace('/_+/', '_', $value) ?? $value;
}

function normalizeText(string $value): string
{
    $value = trim(mb_strtoupper($value, 'UTF-8'));
    $from = ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'];
    $to = ['A', 'E', 'I', 'O', 'U', 'U', 'N'];
    $value = str_replace($from, $to, $value);
    $value = preg_replace('/\s+/', ' ', $value) ?? $value;
    return trim($value);
}

function parseBoolValue($value, bool $default): bool
{
    if ($value === null || $value === '') {
        return $default;
    }
    $value = normalizeText((string) $value);
    if (in_array($value, ['1', 'SI', 'S', 'TRUE', 'YES'], true)) {
        return true;
    }
    if (in_array($value, ['0', 'NO', 'N', 'FALSE'], true)) {
        return false;
    }
    return $default;
}

function buildPhaseLookup(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT id, tournament_id, name, slug FROM tournament_phases");
    $phases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $lookup = [];
    foreach ($phases as $phase) {
        $tid = (int) $phase['tournament_id'];
        $nameKey = normalizeText((string) $phase['name']);
        $slugKey = normalizeText(str_replace('-', ' ', (string) $phase['slug']));

        if (!isset($lookup[$tid])) {
            $lookup[$tid] = [];
        }
        $lookup[$tid][$nameKey] = (int) $phase['id'];
        $lookup[$tid][$slugKey] = (int) $phase['id'];
    }
    return $lookup;
}

function resolvePhaseId(string $phaseName, array $phaseMapByTournament): ?int
{
    $key = normalizeText($phaseName);
    $aliases = [
        $key,
        str_replace(' DE ', ' ', $key),
        str_replace('-', ' ', $key),
    ];

    if (str_contains($key, 'GRUPO')) {
        $aliases[] = 'FASE GRUPOS';
        $aliases[] = 'FASE DE GRUPOS';
    }
    if (str_contains($key, 'OCTAV')) {
        $aliases[] = 'OCTAVOS';
    }
    if (str_contains($key, 'CUART')) {
        $aliases[] = 'CUARTOS';
    }
    if (str_contains($key, 'SEMI')) {
        $aliases[] = 'SEMIS';
        $aliases[] = 'SEMIFINAL';
    }
    if (str_contains($key, 'FINAL')) {
        $aliases[] = 'FINAL';
    }

    foreach ($aliases as $alias) {
        if (isset($phaseMapByTournament[$alias])) {
            return (int) $phaseMapByTournament[$alias];
        }
    }

    return null;
}

function isValidVideoUrl(string $url): bool
{
    if (!str_starts_with($url, '/vasodelahistoria/assets/') && !preg_match('#^https?://#i', $url)) {
        return false;
    }

    $path = parse_url($url, PHP_URL_PATH) ?? '';
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    return in_array($ext, ['mp4', 'webm', 'm3u8'], true);
}

function isValidThumbnailUrl(string $url): bool
{
    if (!str_starts_with($url, '/vasodelahistoria/assets/') && !preg_match('#^https?://#i', $url)) {
        return false;
    }

    $path = parse_url($url, PHP_URL_PATH) ?? '';
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    return in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true);
}

$message = '';
$report = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $dryRun = isset($_POST['dry_run']);

    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $message = "<div style='color:#b00020;font-weight:700;'>Error al subir el archivo.</div>";
    } else {
        $tmpName = $_FILES['file']['tmp_name'];
        $xlsx = SimpleXLSX::parse($tmpName);

        if (!$xlsx) {
            $message = "<div style='color:#b00020;font-weight:700;'>No se pudo leer el Excel: " . htmlspecialchars(SimpleXLSX::parseError(), ENT_QUOTES, 'UTF-8') . "</div>";
        } else {
            try {
                $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";
                $pdo = new PDO($dsn, $config['user'], $config['pass'], $config['options']);

                $rows = $xlsx->rows();
                if (count($rows) < 2) {
                    throw new RuntimeException('El archivo no tiene filas de datos.');
                }

                $rawHeaders = $rows[0];
                $headers = [];
                foreach ($rawHeaders as $i => $header) {
                    $headers[normalizeHeader((string) $header)] = $i;
                }

                $required = ['year', 'phase_name', 'is_final', 'title', 'video_url', 'thumbnail_url'];
                $missing = [];
                foreach ($required as $field) {
                    if (!array_key_exists($field, $headers)) {
                        $missing[] = $field;
                    }
                }

                if (!empty($missing)) {
                    throw new RuntimeException('Faltan columnas obligatorias en el Excel: ' . implode(', ', $missing));
                }

                $tournaments = $pdo->query("SELECT id, year FROM tournaments")->fetchAll(PDO::FETCH_ASSOC);
                $tournamentByYear = [];
                foreach ($tournaments as $t) {
                    $tournamentByYear[(int) $t['year']] = (int) $t['id'];
                }
                $phaseLookup = buildPhaseLookup($pdo);

                $validRows = [];
                $errors = [];

                for ($r = 1; $r < count($rows); $r++) {
                    $excelRowNumber = $r + 1;
                    $row = $rows[$r];

                    $year = trim((string) ($row[$headers['year']] ?? ''));
                    $phaseName = trim((string) ($row[$headers['phase_name']] ?? ''));
                    $isFinalRaw = trim((string) ($row[$headers['is_final']] ?? ''));
                    $title = trim((string) ($row[$headers['title']] ?? ''));
                    $videoUrl = trim((string) ($row[$headers['video_url']] ?? ''));
                    $thumbnailUrl = trim((string) ($row[$headers['thumbnail_url']] ?? ''));
                    $subPhase = isset($headers['sub_phase']) ? trim((string) ($row[$headers['sub_phase']] ?? '')) : null;
                    $displayOrderRaw = isset($headers['display_order']) ? trim((string) ($row[$headers['display_order']] ?? '')) : '';
                    $isActiveRaw = isset($headers['is_active']) ? trim((string) ($row[$headers['is_active']] ?? '')) : '';

                    if ($year === '' && $phaseName === '' && $title === '' && $videoUrl === '' && $thumbnailUrl === '') {
                        continue;
                    }

                    $rowErrors = [];

                    if (!preg_match('/^\d{4}$/', $year)) {
                        $rowErrors[] = 'year inválido (debe ser YYYY).';
                    }

                    $yearInt = (int) $year;
                    if (!isset($tournamentByYear[$yearInt])) {
                        $rowErrors[] = "No existe torneo para el año {$year}.";
                    }

                    if ($phaseName === '') {
                        $rowErrors[] = 'phase_name es obligatorio.';
                    }
                    if ($title === '') {
                        $rowErrors[] = 'title es obligatorio.';
                    }
                    if ($videoUrl === '' || !isValidVideoUrl($videoUrl)) {
                        $rowErrors[] = 'video_url inválida (use /vasodelahistoria/assets/... y extensión mp4/webm/m3u8).';
                    }
                    if ($thumbnailUrl === '' || !isValidThumbnailUrl($thumbnailUrl)) {
                        $rowErrors[] = 'thumbnail_url inválida (use /vasodelahistoria/assets/... y extensión jpg/jpeg/png/webp).';
                    }

                    $isFinal = parseBoolValue($isFinalRaw, false);
                    $isActive = parseBoolValue($isActiveRaw, true);
                    $displayOrder = is_numeric($displayOrderRaw) ? (int) $displayOrderRaw : 0;

                    $tournamentId = $tournamentByYear[$yearInt] ?? null;
                    $phaseId = null;
                    if ($tournamentId !== null && isset($phaseLookup[$tournamentId])) {
                        $phaseId = resolvePhaseId($phaseName, $phaseLookup[$tournamentId]);
                    }
                    if ($phaseId === null) {
                        $rowErrors[] = "No se encontró phase_name '{$phaseName}' para el año {$year}.";
                    }

                    $phaseNorm = normalizeText($phaseName);
                    $isFinalPhase = str_contains($phaseNorm, 'FINAL');
                    if ($isFinal && !$isFinalPhase) {
                        $rowErrors[] = 'is_final=1 pero la fase no parece ser FINAL.';
                    }

                    if (!empty($rowErrors)) {
                        $errors[] = [
                            'row' => $excelRowNumber,
                            'errors' => $rowErrors,
                        ];
                        continue;
                    }

                    $validRows[] = [
                        'phase_id' => $phaseId,
                        'sub_phase' => $subPhase !== '' ? $subPhase : null,
                        'title' => $title,
                        'video_url' => $videoUrl,
                        'thumbnail_url' => $thumbnailUrl,
                        'video_type' => 'highlights',
                        'display_order' => $displayOrder,
                        'is_active' => $isActive ? 1 : 0,
                    ];
                }

                $inserted = 0;
                if (!$dryRun && !empty($validRows) && empty($errors)) {
                    $pdo->beginTransaction();
                    $insertStmt = $pdo->prepare("
                        INSERT INTO tournament_videos
                        (phase_id, sub_phase, title, video_url, thumbnail_url, video_type, display_order, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");

                    foreach ($validRows as $entry) {
                        $insertStmt->execute([
                            $entry['phase_id'],
                            $entry['sub_phase'],
                            $entry['title'],
                            $entry['video_url'],
                            $entry['thumbnail_url'],
                            $entry['video_type'],
                            $entry['display_order'],
                            $entry['is_active'],
                        ]);
                        $inserted++;
                    }
                    $pdo->commit();
                }

                $report = [
                    'dry_run' => $dryRun,
                    'total_rows' => count($rows) - 1,
                    'valid_rows' => count($validRows),
                    'error_rows' => count($errors),
                    'inserted_rows' => $inserted,
                    'errors' => $errors,
                ];

                if (!empty($errors)) {
                    $message = "<div style='color:#b00020;font-weight:700;'>Se encontraron errores. Corrige el Excel y vuelve a intentar.</div>";
                } elseif ($dryRun) {
                    $message = "<div style='color:#0a5f2f;font-weight:700;'>Validación completada (dry-run). No se insertó nada.</div>";
                } else {
                    $message = "<div style='color:#0a5f2f;font-weight:700;'>Importación completada correctamente.</div>";
                }
            } catch (Throwable $e) {
                if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $message = "<div style='color:#b00020;font-weight:700;'>Error: " . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "</div>";
            }
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Importador de Videos - Amstel</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            color: #111;
        }
        .wrap {
            max-width: 820px;
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,.08);
            padding: 24px;
        }
        h1 { margin: 0 0 12px 0; font-size: 24px; }
        p { margin: 8px 0; }
        .hint {
            background: #fff9e6;
            border: 1px solid #f1d38b;
            border-radius: 6px;
            padding: 10px 12px;
            margin: 14px 0;
            font-size: 14px;
        }
        .form-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            background: #fafafa;
            margin-top: 12px;
        }
        .row { margin-bottom: 12px; }
        label { font-weight: 700; font-size: 14px; display: inline-block; margin-bottom: 6px; }
        input[type="file"] { width: 100%; }
        .checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        button {
            background: #d32f2f;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            cursor: pointer;
            font-weight: 700;
        }
        button:hover { background: #b71c1c; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 13px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        th { background: #f1f1f1; }
        code {
            background: #f2f2f2;
            padding: 2px 5px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="wrap">
        <h1>Importador de Videos (Excel)</h1>
        <p>Sube un archivo <code>.xlsx</code> para validar e importar videos masivamente en <code>tournament_videos</code>.</p>
        <div class="hint">
            Columnas obligatorias: <code>year</code>, <code>phase_name</code>, <code>is_final</code>, <code>title</code>, <code>video_url</code>, <code>thumbnail_url</code>.<br>
            Opcionales: <code>sub_phase</code>, <code>display_order</code>, <code>is_active</code>.
        </div>

        <?php if ($message): ?>
            <p><?php echo $message; ?></p>
        <?php endif; ?>

        <div class="form-box">
            <form action="" method="post" enctype="multipart/form-data">
                <div class="row">
                    <label for="file">Archivo Excel</label>
                    <input type="file" id="file" name="file" accept=".xlsx" required>
                </div>
                <div class="row checkbox">
                    <input type="checkbox" id="dry_run" name="dry_run" checked>
                    <label for="dry_run" style="margin:0;font-weight:400;">Modo seguro (dry-run): valida pero no inserta</label>
                </div>
                <button type="submit">Validar e Importar</button>
            </form>
        </div>

        <?php if ($report !== null): ?>
            <h2 style="margin-top:20px;font-size:20px;">Resultado</h2>
            <table>
                <tr><th>Total filas (sin header)</th><td><?php echo (int) $report['total_rows']; ?></td></tr>
                <tr><th>Filas válidas</th><td><?php echo (int) $report['valid_rows']; ?></td></tr>
                <tr><th>Filas con error</th><td><?php echo (int) $report['error_rows']; ?></td></tr>
                <tr><th>Modo</th><td><?php echo $report['dry_run'] ? 'Dry-run' : 'Importación real'; ?></td></tr>
                <tr><th>Filas insertadas</th><td><?php echo (int) $report['inserted_rows']; ?></td></tr>
            </table>

            <?php if (!empty($report['errors'])): ?>
                <h3 style="margin-top:18px;font-size:18px;">Detalle de errores</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Fila Excel</th>
                            <th>Errores</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($report['errors'] as $rowError): ?>
                            <tr>
                                <td><?php echo (int) $rowError['row']; ?></td>
                                <td><?php echo htmlspecialchars(implode(' | ', $rowError['errors']), ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</body>
</html>
