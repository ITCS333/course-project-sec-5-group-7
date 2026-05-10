<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once './config/Database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$resourceId = $_GET['resource_id'] ?? null;
$commentId = $_GET['comment_id'] ?? null;

/* ===================== FUNCTIONS ===================== */

function getAllResources($db) {
    $sql = "SELECT id, title, description, link, created_at FROM resources";
    $params = [];

    if (!empty($_GET['search'])) {
        $sql .= " WHERE title LIKE :search OR description LIKE :search";
        $params[':search'] = "%" . $_GET['search'] . "%";
    }

    $sort = $_GET['sort'] ?? 'created_at';
    $order = strtolower($_GET['order'] ?? 'desc');

    if (!in_array($sort, ['title', 'created_at'])) $sort = 'created_at';
    if (!in_array($order, ['asc', 'desc'])) $order = 'desc';

    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);

    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }

    $stmt->execute();
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(['success' => true, 'data' => $resources]);
}

function getResourceById($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        return sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$resourceId]);
    $resource = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resource) {
        sendResponse(['success' => true, 'data' => $resource]);
    } else {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }
}

function createResource($db, $data) {
    if (empty($data['title']) || empty($data['link'])) {
        return sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    }

    $title = sanitizeInput($data['title']);
    $link = sanitizeInput($data['link']);
    $description = sanitizeInput($data['description'] ?? '');

    if (!validateUrl($link)) {
        return sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
    }

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    $stmt->execute([$title, $description, $link]);

    sendResponse([
        'success' => true,
        'message' => 'Created',
        'id' => $db->lastInsertId()
    ], 201);
}

function updateResource($db, $data) {
    if (empty($data['id'])) {
        return sendResponse(['success' => false, 'message' => 'ID required'], 400);
    }

    $id = $data['id'];

    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        return sendResponse(['success' => false, 'message' => 'Not found'], 404);
    }

    $fields = [];
    $values = [];

    if (!empty($data['title'])) {
        $fields[] = "title=?";
        $values[] = sanitizeInput($data['title']);
    }

    if (!empty($data['description'])) {
        $fields[] = "description=?";
        $values[] = sanitizeInput($data['description']);
    }

    if (!empty($data['link'])) {
        if (!validateUrl($data['link'])) {
            return sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
        }
        $fields[] = "link=?";
        $values[] = sanitizeInput($data['link']);
    }

    if (!$fields) {
        return sendResponse(['success' => false, 'message' => 'Nothing to update'], 400);
    }

    $values[] = $id;

    $sql = "UPDATE resources SET " . implode(",", $fields) . " WHERE id=?";
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    sendResponse(['success' => true, 'message' => 'Updated']);
}

function deleteResource($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        return sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    }

    $stmt = $db->prepare("DELETE FROM resources WHERE id=?");
    $stmt->execute([$resourceId]);

    if ($stmt->rowCount()) {
        sendResponse(['success' => true, 'message' => 'Deleted']);
    } else {
        sendResponse(['success' => false, 'message' => 'Not found'], 404);
    }
}

function getCommentsByResourceId($db, $resourceId) {
    if (!$resourceId) {
        return sendResponse(['success' => false, 'message' => 'Missing ID'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM comments_resource WHERE resource_id=? ORDER BY created_at ASC");
    $stmt->execute([$resourceId]);

    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment($db, $data) {
    if (empty($data['resource_id']) || empty($data['author']) || empty($data['text'])) {
        return sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    }

    $stmt = $db->prepare("SELECT id FROM resources WHERE id=?");
    $stmt->execute([$data['resource_id']]);

    if (!$stmt->fetch()) {
        return sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([
        $data['resource_id'],
        sanitizeInput($data['author']),
        sanitizeInput($data['text'])
    ]);

    sendResponse([
        'success' => true,
        'id' => $db->lastInsertId()
    ], 201);
}

function deleteComment($db, $commentId) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id=?");
    $stmt->execute([$commentId]);

    if ($stmt->rowCount()) {
        sendResponse(['success' => true, 'message' => 'Deleted']);
    } else {
        sendResponse(['success' => false, 'message' => 'Not found'], 404);
    }
}

/* ===================== ROUTER ===================== */

try {

    if ($method === 'GET') {

        if ($action === 'comments') {
            getCommentsByResourceId($db, $resourceId);
        } elseif ($id) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }

    } elseif ($method === 'POST') {

        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }

    } elseif ($method === 'PUT') {
        updateResource($db, $data);

    } elseif ($method === 'DELETE') {

        if ($action === 'delete_comment') {
            deleteComment($db, $commentId);
        } else {
            deleteResource($db, $id);
        }

    } else {
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Server error'], 500);
}

/* ===================== HELPERS ===================== */

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function validateUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function validateRequiredFields($data, $fields) {
    $missing = [];

    foreach ($fields as $field) {
        if (empty($data[$field])) {
            $missing[] = $field;
        }
    }

    return [
        'valid' => empty($missing),
        'missing' => $missing
    ];
}
?>
