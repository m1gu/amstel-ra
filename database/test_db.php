<?php
/**
 * Script de prueba de conexión para AMSTEL WebAR
 */

$host = 'localhost';
$db = 'amstel_webar';
$user = 'root'; // Usuario por defecto en XAMPP/Laragon
$pass = '';     // Contraseña por defecto (vacía) en XAMPP/Laragon
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "<h1>✅ Conexión Exitosa a MySQL</h1>";

    // Probar lectura de estadios
    $stmt = $pdo->query("SELECT name, slug FROM stadiums");
    echo "<h3>Estadios cargados:</h3><ul>";
    while ($row = $stmt->fetch()) {
        echo "<li><strong>{$row['name']}</strong> (Slug: {$row['slug']})</li>";
    }
    echo "</ul>";

} catch (\PDOException $e) {
    echo "<h1>❌ Error de Conexión:</h1>";
    echo "<p>{$e->getMessage()}</p>";
}
