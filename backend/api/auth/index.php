<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "http://localhost:5173"));
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle CORS preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Enforce POST method only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit;
}

require_once __DIR__ . "/../../config/database.php";

try {

    // Read and decode JSON request body
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid JSON data"
        ]);
        exit;
    }

    $email = trim($input["email"] ?? "");
    $password = $input["password"] ?? "";

    // Validate missing fields
    if ($email === "" || $password === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Email and password are required"
        ]);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid email format"
        ]);
        exit;
    }

    // Query admin by email using prepared statement
    $stmt = $pdo->prepare("
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM admins
        WHERE email = :email
        LIMIT 1
    ");

    $stmt->execute([
        ":email" => $email
    ]);

    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify admin exists and password matches
    if (!$admin || !password_verify($password, $admin["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password"
        ]);
        exit;
    }

    // Return successful response without password_hash
    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "data" => [
            "id" => (int)$admin["id"],
            "name" => $admin["name"],
            "email" => $admin["email"],
            "created_at" => $admin["created_at"],
            "updated_at" => $admin["updated_at"]
        ]
    ]);
    exit;

} catch (PDOException $e) {

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error"
    ]);
    exit;
}
