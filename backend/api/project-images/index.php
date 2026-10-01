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
    // GET PROJECT IMAGES
    // =====================================================

    if ($method === "GET") {

        // Get single image by ID
        if (isset($_GET["id"]) && $_GET["id"] !== "") {

            $id = (int)$_GET["id"];

            $stmt = $pdo->prepare("
                SELECT *
                FROM project_images
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([
                ":id" => $id
            ]);

            $image = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$image) {

                http_response_code(404);

                echo json_encode([
                    "success" => false,
                    "message" => "Project image not found"
                ]);

                exit;
            }

            echo json_encode([
                "success" => true,
                "data" => $image
            ]);

            exit;
        }


        // Filter images by project_id
        if (isset($_GET["project_id"]) && $_GET["project_id"] !== "") {

            $projectId = (int)$_GET["project_id"];

            $stmt = $pdo->prepare("
                SELECT *
                FROM project_images
                WHERE project_id = :project_id
                ORDER BY sort_order ASC, created_at ASC
            ");

            $stmt->execute([
                ":project_id" => $projectId
            ]);

            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "data" => $images
            ]);

            exit;
        }


        // Get all images
        $stmt = $pdo->query("
            SELECT *
            FROM project_images
            ORDER BY project_id ASC, sort_order ASC, created_at ASC
        ");

        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $images
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
    // CREATE PROJECT IMAGE (POST)
    // =====================================================

    if ($method === "POST") {

        $projectId = isset($input["project_id"]) ? (int)$input["project_id"] : 0;
        $imagePath = trim($input["image_path"] ?? "");
        $altText = isset($input["alt_text"]) && trim($input["alt_text"]) !== "" ? trim($input["alt_text"]) : null;
        $sortOrder = isset($input["sort_order"]) ? (int)$input["sort_order"] : 0;


        // Required fields validation
        if ($projectId <= 0 || $imagePath === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid project ID and image path are required"
            ]);

            exit;
        }


        // Validate that referenced project exists
        $projCheck = $pdo->prepare("
            SELECT id
            FROM projects
            WHERE id = :project_id
            LIMIT 1
        ");

        $projCheck->execute([
            ":project_id" => $projectId
        ]);

        if (!$projCheck->fetch()) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "message" => "Referenced project does not exist"
            ]);

            exit;
        }


        // Field length & value validations
        if (strlen($imagePath) > 255) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Image path must not exceed 255 characters"
            ]);

            exit;
        }

        if ($altText !== null && strlen($altText) > 200) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Alt text must not exceed 200 characters"
            ]);

            exit;
        }

        if ($sortOrder < 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Sort order must be a non-negative integer"
            ]);

            exit;
        }


        // Insert image
        $stmt = $pdo->prepare("
            INSERT INTO project_images
            (
                project_id,
                image_path,
                alt_text,
                sort_order
            )
            VALUES
            (
                :project_id,
                :image_path,
                :alt_text,
                :sort_order
            )
        ");

        $stmt->execute([
            ":project_id" => $projectId,
            ":image_path" => $imagePath,
            ":alt_text" => $altText,
            ":sort_order" => $sortOrder
        ]);

        $newId = (int)$pdo->lastInsertId();

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Project image created successfully",
            "id" => $newId
        ]);

        exit;
    }


    // =====================================================
    // UPDATE PROJECT IMAGE (PUT)
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
                "message" => "Valid project image ID is required"
            ]);

            exit;
        }


        // Check image exists
        $check = $pdo->prepare("
            SELECT *
            FROM project_images
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
                "message" => "Project image not found"
            ]);

            exit;
        }


        // Resolve updated values (fallback to existing if not provided)
        $projectId = isset($input["project_id"]) ? (int)$input["project_id"] : (int)$existing["project_id"];
        $imagePath = isset($input["image_path"]) ? trim($input["image_path"]) : $existing["image_path"];
        $altText = array_key_exists("alt_text", $input)
            ? (trim($input["alt_text"] ?? "") !== "" ? trim($input["alt_text"]) : null)
            : $existing["alt_text"];
        $sortOrder = isset($input["sort_order"]) ? (int)$input["sort_order"] : (int)$existing["sort_order"];


        // Required fields validation
        if ($projectId <= 0 || $imagePath === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid project ID and image path cannot be empty"
            ]);

            exit;
        }


        // Validate referenced project exists
        $projCheck = $pdo->prepare("
            SELECT id
            FROM projects
            WHERE id = :project_id
            LIMIT 1
        ");

        $projCheck->execute([
            ":project_id" => $projectId
        ]);

        if (!$projCheck->fetch()) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "message" => "Referenced project does not exist"
            ]);

            exit;
        }


        // Field length & value validations
        if (strlen($imagePath) > 255) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Image path must not exceed 255 characters"
            ]);

            exit;
        }

        if ($altText !== null && strlen($altText) > 200) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Alt text must not exceed 200 characters"
            ]);

            exit;
        }

        if ($sortOrder < 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Sort order must be a non-negative integer"
            ]);

            exit;
        }


        // Update image
        $stmt = $pdo->prepare("
            UPDATE project_images
            SET
                project_id = :project_id,
                image_path = :image_path,
                alt_text = :alt_text,
                sort_order = :sort_order
            WHERE id = :id
        ");

        $stmt->execute([
            ":project_id" => $projectId,
            ":image_path" => $imagePath,
            ":alt_text" => $altText,
            ":sort_order" => $sortOrder,
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Project image updated successfully",
            "id" => $id
        ]);

        exit;
    }


    // =====================================================
    // DELETE PROJECT IMAGE
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
                "message" => "Valid project image ID is required"
            ]);

            exit;
        }


        // Check image exists
        $check = $pdo->prepare("
            SELECT id
            FROM project_images
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
                "message" => "Project image not found"
            ]);

            exit;
        }


        // Delete image
        $stmt = $pdo->prepare("
            DELETE FROM project_images
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Project image deleted successfully",
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
