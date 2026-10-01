<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once "../../config/database.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

try {

    $method = $_SERVER["REQUEST_METHOD"];


    // =====================================================
    // GET PROJECTS
    // =====================================================

    if ($method === "GET") {

        $stmt = $pdo->query("
            SELECT *
            FROM projects
            ORDER BY created_at DESC
        ");

        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $projects
        ]);

        exit;
    }


    // =====================================================
    // READ JSON INPUT
    // =====================================================

    if ($method === "POST" || $method === "PUT") {

        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON data"
            ]);

            exit;
        }
    }


    // =====================================================
    // CREATE PROJECT
    // =====================================================

    if ($method === "POST") {

        $title = trim($input["title"] ?? "");
        $description = trim($input["description"] ?? "");
        $category = trim($input["category"] ?? "");
        $location = trim($input["location"] ?? "");
        $completion_year = $input["completion_year"] ?? null;
        $status = trim($input["status"] ?? "completed");
        $featured_image = trim($input["featured_image"] ?? "");
        $is_featured = isset($input["is_featured"])
            ? (int)$input["is_featured"]
            : 0;


        // Required fields

        if ($title === "" || $description === "" || $category === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Title, description and category are required"
            ]);

            exit;
        }


        // Title validation

        if (strlen($title) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Project title is too long"
            ]);

            exit;
        }


        // Status validation

        $allowedStatuses = [
            "ongoing",
            "completed",
            "upcoming"
        ];

        if (!in_array($status, $allowedStatuses, true)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid project status"
            ]);

            exit;
        }


        // Completion year validation

        if ($completion_year !== null && $completion_year !== "") {

            $completion_year = (int)$completion_year;

            if ($completion_year < 1900 || $completion_year > 2100) {

                http_response_code(422);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid completion year"
                ]);

                exit;
            }

        } else {

            $completion_year = null;
        }


        // Featured validation

        if ($is_featured !== 0 && $is_featured !== 1) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "is_featured must be 0 or 1"
            ]);

            exit;
        }


        // Create slug

        $slug = strtolower($title);

        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        $slug = trim($slug, '-');


        // Check duplicate slug

        $slugCheck = $pdo->prepare("
            SELECT id
            FROM projects
            WHERE slug = :slug
            LIMIT 1
        ");

        $slugCheck->execute([
            ":slug" => $slug
        ]);

        if ($slugCheck->fetch()) {

            $slug .= "-" . time();
        }


        // Insert project

        $stmt = $pdo->prepare("
            INSERT INTO projects
            (
                title,
                slug,
                description,
                category,
                location,
                completion_year,
                status,
                featured_image,
                is_featured
            )
            VALUES
            (
                :title,
                :slug,
                :description,
                :category,
                :location,
                :completion_year,
                :status,
                :featured_image,
                :is_featured
            )
        ");

        $stmt->execute([
            ":title" => $title,
            ":slug" => $slug,
            ":description" => $description,
            ":category" => $category,
            ":location" => $location !== "" ? $location : null,
            ":completion_year" => $completion_year,
            ":status" => $status,
            ":featured_image" => $featured_image !== "" ? $featured_image : null,
            ":is_featured" => $is_featured
        ]);


        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Project created successfully",
            "id" => $pdo->lastInsertId(),
            "slug" => $slug
        ]);

        exit;
    }


    // =====================================================
    // UPDATE PROJECT
    // =====================================================

    if ($method === "PUT") {

        $id = isset($input["id"]) ? (int)$input["id"] : 0;

        if ($id <= 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid project ID is required"
            ]);

            exit;
        }


        // Check project exists

        $check = $pdo->prepare("
            SELECT id
            FROM projects
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
                "message" => "Project not found"
            ]);

            exit;
        }


        // Get fields

        $title = trim($input["title"] ?? "");
        $description = trim($input["description"] ?? "");
        $category = trim($input["category"] ?? "");
        $location = trim($input["location"] ?? "");
        $completion_year = $input["completion_year"] ?? null;
        $status = trim($input["status"] ?? "completed");
        $featured_image = trim($input["featured_image"] ?? "");
        $is_featured = isset($input["is_featured"])
            ? (int)$input["is_featured"]
            : 0;


        // Required fields

        if ($title === "" || $description === "" || $category === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Title, description and category are required"
            ]);

            exit;
        }


        // Title validation

        if (strlen($title) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Project title is too long"
            ]);

            exit;
        }


        // Status validation

        $allowedStatuses = [
            "ongoing",
            "completed",
            "upcoming"
        ];

        if (!in_array($status, $allowedStatuses, true)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid project status"
            ]);

            exit;
        }


        // Completion year validation

        if ($completion_year !== null && $completion_year !== "") {

            $completion_year = (int)$completion_year;

            if ($completion_year < 1900 || $completion_year > 2100) {

                http_response_code(422);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid completion year"
                ]);

                exit;
            }

        } else {

            $completion_year = null;
        }


        // Featured validation

        if ($is_featured !== 0 && $is_featured !== 1) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "is_featured must be 0 or 1"
            ]);

            exit;
        }


        // Create new slug

        $slug = strtolower($title);

        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        $slug = trim($slug, '-');


        // Make sure slug is unique

        $slugCheck = $pdo->prepare("
            SELECT id
            FROM projects
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


        // Update project

        $stmt = $pdo->prepare("
            UPDATE projects
            SET
                title = :title,
                slug = :slug,
                description = :description,
                category = :category,
                location = :location,
                completion_year = :completion_year,
                status = :status,
                featured_image = :featured_image,
                is_featured = :is_featured,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->execute([
            ":title" => $title,
            ":slug" => $slug,
            ":description" => $description,
            ":category" => $category,
            ":location" => $location !== "" ? $location : null,
            ":completion_year" => $completion_year,
            ":status" => $status,
            ":featured_image" => $featured_image !== "" ? $featured_image : null,
            ":is_featured" => $is_featured,
            ":id" => $id
        ]);


        echo json_encode([
            "success" => true,
            "message" => "Project updated successfully",
            "id" => $id,
            "slug" => $slug
        ]);

        exit;
    }


    // =====================================================
    // DELETE PROJECT
    // =====================================================

    if ($method === "DELETE") {

        // Get ID from URL query parameter
        // Example:
        // /api/projects/?id=2

        $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;


        if ($id <= 0) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Valid project ID is required"
            ]);

            exit;
        }


        // Check project exists

        $check = $pdo->prepare("
            SELECT id
            FROM projects
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
                "message" => "Project not found"
            ]);

            exit;
        }


        // Delete project

        $stmt = $pdo->prepare("
            DELETE FROM projects
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);


        echo json_encode([
            "success" => true,
            "message" => "Project deleted successfully",
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