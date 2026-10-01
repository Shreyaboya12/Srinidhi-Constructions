<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "http://localhost:5173"));
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

require_once __DIR__ . "/../../config/database.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

try {

    $method = $_SERVER["REQUEST_METHOD"];


    // =====================================================
    // GET SERVICES
    // =====================================================

    if ($method === "GET") {

        // Get single service by ID
        if (isset($_GET["id"]) && $_GET["id"] !== "") {

            $id = (int)$_GET["id"];

            $stmt = $pdo->prepare("
                SELECT *
                FROM services
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([
                ":id" => $id
            ]);

            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {

                http_response_code(404);

                echo json_encode([
                    "success" => false,
                    "message" => "Service not found"
                ]);

                exit;
            }

            echo json_encode([
                "success" => true,
                "data" => $service
            ]);

            exit;
        }


        // Get single service by Slug
        if (isset($_GET["slug"]) && trim($_GET["slug"]) !== "") {

            $slug = trim($_GET["slug"]);

            $stmt = $pdo->prepare("
                SELECT *
                FROM services
                WHERE slug = :slug
                LIMIT 1
            ");

            $stmt->execute([
                ":slug" => $slug
            ]);

            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {

                http_response_code(404);

                echo json_encode([
                    "success" => false,
                    "message" => "Service not found"
                ]);

                exit;
            }

            echo json_encode([
                "success" => true,
                "data" => $service
            ]);

            exit;
        }


        // Get all services (optional filter by is_active)
        if (isset($_GET["is_active"])) {

            $isActive = (int)$_GET["is_active"];

            $stmt = $pdo->prepare("
                SELECT *
                FROM services
                WHERE is_active = :is_active
                ORDER BY created_at DESC
            ");

            $stmt->execute([
                ":is_active" => $isActive
            ]);

        } else {

            $stmt = $pdo->query("
                SELECT *
                FROM services
                ORDER BY created_at DESC
            ");
        }

        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $services
        ]);

        exit;
    }


    // =====================================================
    // READ JSON INPUT
    // =====================================================

    if ($method === "POST" || $method === "PUT" || $method === "DELETE") {

        $rawInput = file_get_contents("php://input");

        if (!empty($rawInput)) {

            $input = json_decode($rawInput, true);

            if (!is_array($input) && ($method === "POST" || $method === "PUT")) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid JSON data"
                ]);

                exit;
            }

        } else {

            $input = [];
        }
    }


    // =====================================================
    // CREATE SERVICE
    // =====================================================

    if ($method === "POST") {

        $title = trim($input["title"] ?? "");
        $description = trim($input["description"] ?? "");
        $image = isset($input["image"]) && trim($input["image"]) !== "" ? trim($input["image"]) : null;
        $is_active = isset($input["is_active"]) ? (int)$input["is_active"] : 1;


        // Required fields
        if ($title === "" || $description === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Title and description are required"
            ]);

            exit;
        }


        // Title length validation
        if (strlen($title) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Service title must not exceed 150 characters"
            ]);

            exit;
        }


        // Image length validation
        if ($image !== null && strlen($image) > 255) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Image path/URL must not exceed 255 characters"
            ]);

            exit;
        }


        // is_active validation
        if ($is_active !== 0 && $is_active !== 1) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "is_active must be 0 or 1"
            ]);

            exit;
        }


        // Create slug
        $rawSlug = !empty($input["slug"]) ? trim($input["slug"]) : $title;
        $slug = strtolower($rawSlug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        if ($slug === "") {
            $slug = "service-" . time();
        }

        if (strlen($slug) > 170) {
            $slug = substr($slug, 0, 170);
            $slug = trim($slug, '-');
        }


        // Check duplicate slug
        $slugCheck = $pdo->prepare("
            SELECT id
            FROM services
            WHERE slug = :slug
            LIMIT 1
        ");

        $slugCheck->execute([
            ":slug" => $slug
        ]);

        if ($slugCheck->fetch()) {
            $slug .= "-" . time();
        }


        // Insert service
        $stmt = $pdo->prepare("
            INSERT INTO services
            (
                title,
                slug,
                description,
                image,
                is_active
            )
            VALUES
            (
                :title,
                :slug,
                :description,
                :image,
                :is_active
            )
        ");

        $stmt->execute([
            ":title" => $title,
            ":slug" => $slug,
            ":description" => $description,
            ":image" => $image,
            ":is_active" => $is_active
        ]);

        $newId = (int)$pdo->lastInsertId();

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Service created successfully",
            "id" => $newId,
            "slug" => $slug
        ]);

        exit;
    }


    // =====================================================
    // UPDATE SERVICE
    // =====================================================

    if ($method === "PUT") {

        $id = 0;

        if (isset($input["id"])) {
            $id = (int)$input["id"];
        } elseif (isset($_GET["id"])) {
            $id = (int)$_GET["id"];
        }

        if ($id <= 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid service ID is required"
            ]);

            exit;
        }


        // Check service exists
        $check = $pdo->prepare("
            SELECT *
            FROM services
            WHERE id = :id
            LIMIT 1
        ");

        $check->execute([
            ":id" => $id
        ]);

        $existing = $check->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "message" => "Service not found"
            ]);

            exit;
        }


        // Get fields (fall back to existing values if not provided)
        $title = isset($input["title"]) ? trim($input["title"]) : $existing["title"];
        $description = isset($input["description"]) ? trim($input["description"]) : $existing["description"];
        $image = array_key_exists("image", $input)
            ? (trim($input["image"] ?? "") !== "" ? trim($input["image"]) : null)
            : $existing["image"];
        $is_active = isset($input["is_active"]) ? (int)$input["is_active"] : (int)$existing["is_active"];


        // Required fields validation
        if ($title === "" || $description === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Title and description cannot be empty"
            ]);

            exit;
        }


        // Title length validation
        if (strlen($title) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Service title must not exceed 150 characters"
            ]);

            exit;
        }


        // Image length validation
        if ($image !== null && strlen($image) > 255) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Image path/URL must not exceed 255 characters"
            ]);

            exit;
        }


        // is_active validation
        if ($is_active !== 0 && $is_active !== 1) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "is_active must be 0 or 1"
            ]);

            exit;
        }


        // Slug handling
        if (isset($input["slug"]) && trim($input["slug"]) !== "") {
            $rawSlug = trim($input["slug"]);
            $slug = strtolower($rawSlug);
            $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
            $slug = trim($slug, '-');
        } elseif (isset($input["title"]) && $input["title"] !== $existing["title"]) {
            $slug = strtolower($title);
            $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
            $slug = trim($slug, '-');
        } else {
            $slug = $existing["slug"];
        }

        if ($slug === "") {
            $slug = "service-" . time();
        }

        if (strlen($slug) > 170) {
            $slug = substr($slug, 0, 170);
            $slug = trim($slug, '-');
        }


        // Make sure slug is unique among other services
        $slugCheck = $pdo->prepare("
            SELECT id
            FROM services
            WHERE slug = :slug
            AND id != :id
            LIMIT 1
        ");

        $slugCheck->execute([
            ":slug" => $slug,
            ":id" => $id
        ]);

        if ($slugCheck->fetch()) {
            $slug .= "-" . time();
        }


        // Update service
        $stmt = $pdo->prepare("
            UPDATE services
            SET
                title = :title,
                slug = :slug,
                description = :description,
                image = :image,
                is_active = :is_active,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->execute([
            ":title" => $title,
            ":slug" => $slug,
            ":description" => $description,
            ":image" => $image,
            ":is_active" => $is_active,
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Service updated successfully",
            "id" => $id,
            "slug" => $slug
        ]);

        exit;
    }


    // =====================================================
    // DELETE SERVICE
    // =====================================================

    if ($method === "DELETE") {

        $id = 0;

        if (isset($_GET["id"])) {
            $id = (int)$_GET["id"];
        } elseif (isset($input["id"])) {
            $id = (int)$input["id"];
        }

        if ($id <= 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid service ID is required"
            ]);

            exit;
        }


        // Check service exists
        $check = $pdo->prepare("
            SELECT id
            FROM services
            WHERE id = :id
            LIMIT 1
        ");

        $check->execute([
            ":id" => $id
        ]);

        if (!$check->fetch()) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "message" => "Service not found"
            ]);

            exit;
        }


        // Delete service
        $stmt = $pdo->prepare("
            DELETE FROM services
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Service deleted successfully",
            "id" => $id
        ]);

        exit;
    }


    // =====================================================
    // METHOD NOT ALLOWED
    // =====================================================

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);


} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database error"
    ]);
}
