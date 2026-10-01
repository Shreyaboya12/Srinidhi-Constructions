const API_BASE_URL = "http://localhost:8000/api";

/* =========================================================
   PROJECTS
========================================================= */

/* GET PROJECTS */
export async function getProjects() {
    const response = await fetch(`${API_BASE_URL}/projects/`);

    if (!response.ok) {
        throw new Error("Failed to fetch projects");
    }

    return response.json();
}

/* CREATE PROJECT */
export async function createProject(projectData) {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
    });

    return response.json();
}

/* UPDATE PROJECT */
export async function updateProject(projectData) {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
    });

    return response.json();
}

/* DELETE PROJECT */
export async function deleteProject(projectId) {
    const response = await fetch(
        `${API_BASE_URL}/projects/?id=${projectId}`,
        {
            method: "DELETE",
        }
    );

    return response.json();
}


/* =========================================================
   SERVICES
========================================================= */

/* GET SERVICES */
export async function getServices() {
    const response = await fetch(`${API_BASE_URL}/services/`);

    if (!response.ok) {
        throw new Error("Failed to fetch services");
    }

    return response.json();
}

/* CREATE SERVICE */
export async function createService(serviceData) {
    const response = await fetch(`${API_BASE_URL}/services/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
    });

    return response.json();
}

/* UPDATE SERVICE */
export async function updateService(serviceData) {
    const response = await fetch(`${API_BASE_URL}/services/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
    });

    return response.json();
}

/* DELETE SERVICE */
export async function deleteService(serviceId) {
    const response = await fetch(
        `${API_BASE_URL}/services/?id=${serviceId}`,
        {
            method: "DELETE",
        }
    );

    return response.json();
}


/* =========================================================
   PROJECT IMAGES
========================================================= */

/* GET PROJECT IMAGES */
export async function getProjectImages() {
    const response = await fetch(
        `${API_BASE_URL}/project-images/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch project images");
    }

    return response.json();
}


/* =========================================================
   ENQUIRIES
========================================================= */

/* GET ALL ENQUIRIES */
export async function getEnquiries() {
    const response = await fetch(
        `${API_BASE_URL}/enquiries/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch enquiries");
    }

    return response.json();
}


/* CREATE ENQUIRY */
export async function createEnquiry(enquiryData) {
    const response = await fetch(
        `${API_BASE_URL}/enquiries/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(enquiryData),
        }
    );

    return response.json();
}


/* UPDATE ENQUIRY */
export async function updateEnquiry(enquiryData) {
    const response = await fetch(
        `${API_BASE_URL}/enquiries/`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(enquiryData),
        }
    );

    return response.json();
}


/* DELETE ENQUIRY */
export async function deleteEnquiry(enquiryId) {
    const response = await fetch(
        `${API_BASE_URL}/enquiries/?id=${enquiryId}`,
        {
            method: "DELETE",
        }
    );

    return response.json();
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

/* ADMIN LOGIN */
export async function adminLogin(email, password) {
    const response = await fetch(
        `${API_BASE_URL}/auth/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    return response.json();
}