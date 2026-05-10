<?php
/**
 * Weekly Course Breakdown API
 */

// ============================================================================
// HEADERS AND INITIALIZATION
// ============================================================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../common/db.php';

$db        = getDBConnection();
$method    = $_SERVER['REQUEST_METHOD'];
$rawData   = file_get_contents('php://input');
$data      = json_decode($rawData, true) ?? [];
$action    = $_GET['action']     ?? null;
$id        = $_GET['id']         ?? null;
$weekId    = $_GET['week_id']    ?? null;
$commentId = $_GET['comment_id'] ?? null;


// ============================================================================
// WEEKS FUNCTIONS
// ============================================================================

function getAllWeeks(PDO $db): void
{
    $sql    = "SELECT id, title, start_date, description, links, created_at FROM weeks";
    $params = [];

    if (!empty($_GET['search'])) {
        $sql             .= " WHERE title LIKE :search OR description LIKE :search";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $allowedSort = ['title', 'start_date'];
    $sort        = $_GET['sort'] ?? 'start_date';
    if (!in_array($sort, $allowedSort)) {
        $sort = 'start_date';
    }

    $order = strtolower($_GET['order'] ?? 'asc');
    if (!in_array($order, ['asc', 'desc'])) {
        $order = 'asc';
    }

    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $weeks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($weeks as &$week) {
        $week['links'] = json_decode($week['links'], true) ?? [];
    }

    sendResponse(['success' => true, 'data' => $weeks]);
}


function getWeekById(PDO $db, $id): void
{
    if (empty($id) || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid week id'], 400);
    }

    $stmt = $db->prepare("
        SELECT id, title, start_date, description, links, created_at
        FROM weeks
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    $week = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$week) {
        sendResponse(['success' => false, 'message' => 'Week not found'], 404);
    }

    $week['links'] = json_decode($week['links'], true) ?? [];
    sendResponse(['success' => true, 'data' => $week]);
}


function createWeek(PDO $db, array $data): void
{
    if (empty($data['title']) || empty($data['start_date'])) {
        sendResponse(['success' => false, 'message' => 'title and start_date are required'], 400);
    }

    $title       = sanitizeInput($data['title']);
    $start_date  = trim($data['start_date']);
    $description = isset($data['description']) ? sanitizeInput($data['description']) : '';

    if (!validateDate($start_date)) {
        sendResponse(['success' => false, 'message' => 'Invalid start_date format. Use YYYY-MM-DD'], 400);
    }

    $links = (!empty($data['links']) && is_array($data['links']))
        ? json_encode($data['links'])
        : json_encode([]);

    $stmt    = $db->prepare("INSERT INTO weeks (title, start_date, description, links) VALUES (?, ?, ?, ?)");
    $success = $stmt->execute([$title, $start_date, $description, $links]);

    if ($success && $stmt->rowCount() > 0) {
        sendResponse([
            'success' => true,
            'message' => 'Week created successfully',
            'id'      => (int) $db->lastInsertId()
        ], 201);
    }

    sendResponse(['success' => false, 'message' => 'Failed to create week'], 500);
}


function updateWeek(PDO $db, array $data): void
{
    if (empty($data['id']) || !is_numeric($data['id'])) {
        sendResponse(['success' => false, 'message' => 'id is required'], 400);
    }

    $id    = (int) $data['id'];
    $check = $db->prepare("SELECT id FROM weeks WHERE id = ?");
    $check->execute([$id]);

    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Week not found'], 404);
    }

    $fields = [];
    $params = [];

    if (isset($data['title']) && $data['title'] !== '') {
        $fields[] = "title = ?";
        $params[] = sanitizeInput($data['title']);
    }

    if (isset($data['start_date']) && $data['start_date'] !== '') {
        $start_date = trim($data['start_date']);
        if (!validateDate($start_date)) {
            sendResponse(['success' => false, 'message' => 'Invalid start_date format. Use YYYY-MM-DD'], 400);
        }
        $fields[] = "start_date = ?";
        $params[] = $start_date;
    }

    if (isset($data['description'])) {
        $fields[] = "description = ?";
        $params[] = sanitizeInput($data['description']);
    }

    if (isset($data['links'])) {
        $fields[] = "links = ?";
        $params[] = is_array($data['links']) ? json_encode($data['links']) : json_encode([]);
    }

    if (empty($fields)) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }

    $sql      = "UPDATE weeks SET " . implode(", ", $fields) . " WHERE id = ?";
    $params[] = $id;
    $stmt     = $db->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Week updated successfully'], 200);
    }

    sendResponse(['success' => false, 'message' => 'No changes were made'], 200);
}


function deleteWeek(PDO $db, $id): void
{
    if (empty($id) || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid week id'], 400);
    }

    $check = $db->prepare("SELECT id FROM weeks WHERE id = ?");
    $check->execute([$id]);

    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Week not found'], 404);
    }

    $stmt = $db->prepare("DELETE FROM weeks WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Week deleted successfully'], 200);
    }

    sendResponse(['success' => false, 'message' => 'Delete failed'], 500);
}


// ============================================================================
// COMMENTS FUNCTIONS
// ============================================================================

function getCommentsByWeek(PDO $db, $weekId): void
{
    if (empty($weekId) || !is_numeric($weekId)) {
        sendResponse(['success' => false, 'message' => 'Invalid week id'], 400);
    }

    $check = $db->prepare("SELECT id FROM weeks WHERE id = ?");
    $check->execute([$weekId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Week not found'], 404);
    }

    $stmt = $db->prepare("
        SELECT id, week_id, author, text, created_at
        FROM comments_week
        WHERE week_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$weekId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(['success' => true, 'data' => $comments]);
}


function createComment(PDO $db, array $data): void
{
    if (
        empty($data['week_id']) ||
        !isset($data['author']) || trim($data['author']) === '' ||
        !isset($data['text'])   || trim($data['text'])   === ''
    ) {
        sendResponse(['success' => false, 'message' => 'week_id, author, and text are required'], 400);
    }

    $weekId = $data['week_id'];

    if (!is_numeric($weekId)) {
        sendResponse(['success' => false, 'message' => 'Invalid week id'], 400);
    }

    $author = sanitizeInput($data['author']);
    $text   = sanitizeInput($data['text']);

    $check = $db->prepare("SELECT id FROM weeks WHERE id = ?");
    $check->execute([$weekId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Week not found'], 404);
    }

    $stmt   = $db->prepare("INSERT INTO comments_week (week_id, author, text) VALUES (?, ?, ?)");
    $result = $stmt->execute([$weekId, $author, $text]);

    if ($result && $stmt->rowCount() > 0) {
        $commentId = (int) $db->lastInsertId();
        sendResponse([
            'success' => true,
            'message' => 'Comment created successfully',
            'id'      => $commentId,
            'data'    => [
                'id'      => $commentId,
                'week_id' => (int) $weekId,
                'author'  => $author,
                'text'    => $text
            ]
        ], 201);
    }

    sendResponse(['success' => false, 'message' => 'Failed to create comment'], 500);
}


function deleteComment(PDO $db, $commentId): void
{
    if (empty($commentId) || !is_numeric($commentId)) {
        sendResponse(['success' => false, 'message' => 'Invalid comment id'], 400);
    }

    $check = $db->prepare("SELECT id FROM comments_week WHERE id = ?");
    $check->execute([$commentId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Comment not found'], 404);
    }

    $stmt = $db->prepare("DELETE FROM comments_week WHERE id = ?");
    $stmt->execute([$commentId]);

    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Comment deleted successfully'], 200);
    }

    sendResponse(['success' => false, 'message' => 'Failed to delete comment'], 500);
}


// ============================================================================
// MAIN REQUEST ROUTER
// ============================================================================

try {

    if ($method === 'GET') {
        if ($action === 'comments') {
            getCommentsByWeek($db, $weekId);
        } elseif (!empty($id)) {
            getWeekById($db, $id);
        } else {
            getAllWeeks($db);
        }

    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createWeek($db, $data);
        }

    } elseif ($method === 'PUT') {
        updateWeek($db, $data);

    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db, $commentId);
        } else {
            deleteWeek($db, $id);
        }

    } else {
        sendResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
    }

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database error occurred'], 500);

} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Internal server error'], 500);
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function validateDate(string $date): bool
{
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

function sanitizeInput(string $data): string
{
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}
