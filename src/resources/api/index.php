<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../common/db.php';

$db     = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true) ?? [];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

/* =========================
   RESPONSE
========================= */
function sendResponse($data, $status = 200) {
    http_response_code($status);

    if ($status >= 400) {
        echo json_encode([
            "success" => false,
            "message" => $data
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => is_string($data) ? $data : "OK",
            "data"    => is_string($data) ? null : $data
        ]);
    }
    exit;
}

/* =========================
   HELPERS
========================= */
function validUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL);
}

/* =========================
   GET ALL RESOURCES
========================= */
function getAllResources($db) {
    $stmt = $db->prepare("
        SELECT id, title, description, link, created_at
        FROM resources
    ");
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse($rows ?: []);
}

/* =========================
   GET BY ID
========================= */
function getResourceById($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse("Invalid id", 400);
    }

    $stmt = $db->prepare("
        SELECT id, title, description, link, created_at
        FROM resources
        WHERE id = :id
    ");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        sendResponse("Resource not found", 404);
    }

    sendResponse($row);
}

/* =========================
   CREATE
========================= */
function createResource($db, $input) {
    if (empty($input['title']) || empty($input['link'])) {
        sendResponse("Title and link are required", 400);
    }

    if (!validUrl($input['link'])) {
        sendResponse("Invalid URL", 400);
    }

    $stmt = $db->prepare("
        INSERT INTO resources (title, description, link)
        VALUES (:t, :d, :l)
    ");
    $stmt->execute([
        ':t' => trim($input['title']),
        ':d' => trim($input['description'] ?? ''),
        ':l' => trim($input['link'])
    ]);

    sendResponse(['id' => (int)$db->lastInsertId()], 201);
}

/* =========================
   UPDATE
========================= */
function updateResource($db, $input) {
    if (empty($input['id']) || !is_numeric($input['id'])) {
        sendResponse("Invalid id", 400);
    }

    if (empty($input['title']) || empty($input['link'])) {
        sendResponse("Title and link are required", 400);
    }

    if (!validUrl($input['link'])) {
        sendResponse("Invalid URL", 400);
    }

    $check = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $check->execute([$input['id']]);
    if (!$check->fetch()) {
        sendResponse("Resource not found", 404);
    }

    $stmt = $db->prepare("
        UPDATE resources
        SET title = ?, description = ?, link = ?
        WHERE id = ?
    ");
    $stmt->execute([
        trim($input['title']),
        trim($input['description'] ?? ''),
        trim($input['link']),
        (int)$input['id']
    ]);

    if ($stmt->rowCount() > 0) {
        sendResponse("Resource updated successfully");
    }

    sendResponse("No changes were made");
}

/* =========================
   DELETE
========================= */
function deleteResource($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse("Invalid id", 400);
    }

    $check = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        sendResponse("Resource not found", 404);
    }

    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        sendResponse("Resource deleted successfully");
    }

    sendResponse("Delete failed", 500);
}

/* =========================
   ROUTER
========================= */
try {

    if ($method === 'GET') {
        if ($id) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }

    } elseif ($method === 'POST') {
        createResource($db, $input);

    } elseif ($method === 'PUT') {
        updateResource($db, $input);

    } elseif ($method === 'DELETE') {
        deleteResource($db, $id);

    } else {
        sendResponse("Method not allowed", 405);
    }

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse("Database error", 500);
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse("Server error", 500);
}
