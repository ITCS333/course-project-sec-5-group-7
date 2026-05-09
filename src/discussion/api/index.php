<?php
// ============================================================================
// HEADERS AND INITIALIZATION
// ============================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include DB connection
require_once __DIR__ . '/../../common/db.php';
$db = getDBConnection();

// Read method, input, and query params
$method  = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data    = json_decode($rawData, true) ?? [];
$action  = $_GET['action'] ?? null;
$id      = $_GET['id'] ?? null;
$topicId = $_GET['topic_id'] ?? null;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function sanitizeInput(string $data): string {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// ============================================================================
// TOPICS FUNCTIONS
// ============================================================================

function getAllTopics(PDO $db): void {
    $query = "SELECT id, subject, message, author, created_at FROM topics";
    $params = [];

    if (!empty($_GET['search'])) {
        $query .= " WHERE subject LIKE :search OR message LIKE :search OR author LIKE :search";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $sort  = in_array($_GET['sort'] ?? '', ['subject','author','created_at']) ? $_GET['sort'] : 'created_at';
    $order = in_array(strtolower($_GET['order'] ?? ''), ['asc','desc']) ? $_GET['order'] : 'desc';
    $query .= " ORDER BY $sort $order";

    $stmt = $db->prepare($query);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->execute();

    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['success' => true, 'data' => $topics]);
}

function getTopicById(PDO $db, $id): void {
    if (!is_numeric($id)) sendResponse(['success' => false, 'message' => 'Invalid topic id'], 400);

    $stmt = $db->prepare("SELECT id, subject, message, author, created_at FROM topics WHERE id = ?");
    $stmt->execute([$id]);
    $topic = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($topic) sendResponse(['success' => true, 'data' => $topic]);
    else sendResponse(['success' => false, 'message' => 'Topic not found'], 404);
}

function createTopic(PDO $db, array $data): void {
    if (empty($data['subject']) || empty($data['message']) || empty($data['author'])) {
        sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    }

    $subject = sanitizeInput($data['subject']);
    $message = sanitizeInput($data['message']);
    $author  = sanitizeInput($data['author']);

    $stmt = $db->prepare("INSERT INTO topics (subject, message, author) VALUES (?, ?, ?)");
    if ($stmt->execute([$subject, $message, $author])) {
        sendResponse([
            'success' => true,
            'message' => 'Topic created',
            'id' => (int)$db->lastInsertId()
        ], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to create topic'], 500);
    }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

try {
    if ($method === 'GET') {
        if ($action === 'replies' && $topicId) {
            getRepliesByTopicId($db, $topicId);
        } elseif ($id) {
            getTopicById($db, $id);
        } else {
            getAllTopics($db);
        }
    } elseif ($method === 'POST') {
        if ($action === 'reply') {
            createReply($db, $data);
        } else {
            createTopic($db, $data);
        }
    } elseif ($method === 'PUT') {
        updateTopic($db, $data);
    } elseif ($method === 'DELETE') {
        if ($action === 'delete_reply') {
            deleteReply($db, $id);
        } else {
            deleteTopic($db, $id);
        }
    } else {
        sendResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Internal Server Error'], 500);
}
