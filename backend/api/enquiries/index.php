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
    $allowedStatuses = ["new", "contacted", "closed"];


    // =====================================================
    // GET ENQUIRIES
    // =====================================================

    if ($method === "GET") {

        // Get single enquiry by ID
        if (isset($_GET["id"]) && $_GET["id"] !== "") {

            $id = (int)$_GET["id"];

            $stmt = $pdo->prepare("
                SELECT *
                FROM enquiries
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([
                ":id" => $id
            ]);

            $enquiry = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$enquiry) {

                http_response_code(404);

                echo json_encode([
                    "success" => false,
                    "message" => "Enquiry not found"
                ]);

                exit;
            }

            echo json_encode([
                "success" => true,
                "data" => $enquiry
            ]);

            exit;
        }


        // Optional filter by status
        if (isset($_GET["status"]) && trim($_GET["status"]) !== "") {

            $status = trim($_GET["status"]);

            if (!in_array($status, $allowedStatuses, true)) {

                http_response_code(422);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid status filter. Allowed values: new, contacted, closed"
                ]);

                exit;
            }

            $stmt = $pdo->prepare("
                SELECT *
                FROM enquiries
                WHERE status = :status
                ORDER BY created_at DESC
            ");

            $stmt->execute([
                ":status" => $status
            ]);

        } else {

            $stmt = $pdo->query("
                SELECT *
                FROM enquiries
                ORDER BY created_at DESC
            ");
        }

        $enquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $enquiries
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
    // CREATE ENQUIRY (POST)
    // =====================================================

    if ($method === "POST") {

        $name = trim($input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $phone = trim($input["phone"] ?? "");
        $subject = isset($input["subject"]) && trim($input["subject"]) !== "" ? trim($input["subject"]) : null;
        $message = trim($input["message"] ?? "");
        $status = trim($input["status"] ?? "new");


        // Required fields validation
        if ($name === "" || $email === "" || $phone === "" || $message === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Name, email, phone, and message are required"
            ]);

            exit;
        }


        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid email format"
            ]);

            exit;
        }


        // Length validations
        if (strlen($name) > 100) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Name must not exceed 100 characters"
            ]);

            exit;
        }

        if (strlen($email) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Email must not exceed 150 characters"
            ]);

            exit;
        }

        if (strlen($phone) > 20) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Phone number must not exceed 20 characters"
            ]);

            exit;
        }

        if ($subject !== null && strlen($subject) > 200) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Subject must not exceed 200 characters"
            ]);

            exit;
        }


        // Status validation
        if (!in_array($status, $allowedStatuses, true)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid status. Allowed values: new, contacted, closed"
            ]);

            exit;
        }


        // Insert enquiry
        $stmt = $pdo->prepare("
            INSERT INTO enquiries
            (
                name,
                email,
                phone,
                subject,
                message,
                status
            )
            VALUES
            (
                :name,
                :email,
                :phone,
                :subject,
                :message,
                :status
            )
        ");

        $stmt->execute([
            ":name" => $name,
            ":email" => $email,
            ":phone" => $phone,
            ":subject" => $subject,
            ":message" => $message,
            ":status" => $status
        ]);

        $newId = (int)$pdo->lastInsertId();

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Enquiry created successfully",
            "id" => $newId
        ]);

        exit;
    }


    // =====================================================
    // UPDATE ENQUIRY (PUT)
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
                "message" => "Valid enquiry ID is required"
            ]);

            exit;
        }


        // Check enquiry exists
        $check = $pdo->prepare("
            SELECT *
            FROM enquiries
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
                "message" => "Enquiry not found"
            ]);

            exit;
        }


        // Resolve updated values (fallback to existing if not provided)
        $name = isset($input["name"]) ? trim($input["name"]) : $existing["name"];
        $email = isset($input["email"]) ? trim($input["email"]) : $existing["email"];
        $phone = isset($input["phone"]) ? trim($input["phone"]) : $existing["phone"];
        $subject = array_key_exists("subject", $input)
            ? (trim($input["subject"] ?? "") !== "" ? trim($input["subject"]) : null)
            : $existing["subject"];
        $message = isset($input["message"]) ? trim($input["message"]) : $existing["message"];
        $status = isset($input["status"]) ? trim($input["status"]) : $existing["status"];


        // Required fields validation
        if ($name === "" || $email === "" || $phone === "" || $message === "") {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Name, email, phone, and message cannot be empty"
            ]);

            exit;
        }


        // Email format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid email format"
            ]);

            exit;
        }


        // Length validations
        if (strlen($name) > 100) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Name must not exceed 100 characters"
            ]);

            exit;
        }

        if (strlen($email) > 150) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Email must not exceed 150 characters"
            ]);

            exit;
        }

        if (strlen($phone) > 20) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Phone number must not exceed 20 characters"
            ]);

            exit;
        }

        if ($subject !== null && strlen($subject) > 200) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Subject must not exceed 200 characters"
            ]);

            exit;
        }


        // Status validation
        if (!in_array($status, $allowedStatuses, true)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Invalid status. Allowed values: new, contacted, closed"
            ]);

            exit;
        }


        // Update enquiry
        $stmt = $pdo->prepare("
            UPDATE enquiries
            SET
                name = :name,
                email = :email,
                phone = :phone,
                subject = :subject,
                message = :message,
                status = :status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->execute([
            ":name" => $name,
            ":email" => $email,
            ":phone" => $phone,
            ":subject" => $subject,
            ":message" => $message,
            ":status" => $status,
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Enquiry updated successfully",
            "id" => $id
        ]);

        exit;
    }


    // =====================================================
    // DELETE ENQUIRY
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
                "message" => "Valid enquiry ID is required"
            ]);

            exit;
        }


        // Check enquiry exists
        $check = $pdo->prepare("
            SELECT id
            FROM enquiries
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
                "message" => "Enquiry not found"
            ]);

            exit;
        }


        // Delete enquiry
        $stmt = $pdo->prepare("
            DELETE FROM enquiries
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Enquiry deleted successfully",
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
