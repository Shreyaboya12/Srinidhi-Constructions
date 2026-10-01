import { useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";

import {
  getProjects,
  getServices,
  getProjectImages,
  createEnquiry,
  getEnquiries,
  updateEnquiry,
  deleteEnquiry,
  createProject,
  updateProject,
  deleteProject,
} from "./api";

import "./App.css";

const API_BASE_URL = "http://localhost:8000";

/* =========================================================
   DEFAULT SERVICES
   Used when the database has no services or the service
   endpoint is temporarily unavailable.
========================================================= */

const defaultServices = [
  {
    id: "default-residential",
    title: "Residential Construction",
    slug: "residential-construction",
    description:
      "Complete construction solutions for residential buildings and homes.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "default-commercial",
    title: "Commercial Construction",
    slug: "commercial-construction",
    description:
      "Professional construction solutions for commercial properties and developments.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "default-renovation",
    title: "Renovation",
    slug: "renovation",
    description:
      "Reliable renovation and improvement services for existing properties.",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=85",
  },
];

/* =========================================================
   FALLBACK PROJECT IMAGES
========================================================= */

const fallbackProjectImages = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85",
];

/* =========================================================
   IMAGE URL HELPER
========================================================= */

function buildImageUrl(image) {
  if (!image) return null;

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function App() {
  /* =========================================================
     ADMIN
  ========================================================= */

  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem("admin");
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  const [adminPage, setAdminPage] = useState("dashboard");

  /* =========================================================
     WEBSITE DATA
  ========================================================= */

  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [projectImages, setProjectImages] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     ENQUIRY MODAL
  ========================================================= */

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  /* =========================================================
     PROJECT MANAGEMENT
  ========================================================= */

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");

  const emptyProject = {
    title: "",
    description: "",
    category: "Residential",
    location: "",
    completion_year: "",
    status: "completed",
    featured_image: "",
    is_featured: 0,
  };

  const [projectForm, setProjectForm] = useState(emptyProject);

  /* =========================================================
     CONTACT FORM
  ========================================================= */

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [formMessage, setFormMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  /* =========================================================
     LOAD DATA
     
     IMPORTANT:
     Promise.allSettled prevents one failed API from breaking
     the complete website.
  ========================================================= */

  async function loadData() {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getProjects(),
      getServices(),
      getProjectImages(),
      getEnquiries(),
    ]);

    let hasImportantError = false;

    /* PROJECTS */

    if (results[0].status === "fulfilled") {
      const result = results[0].value;

      if (result?.success) {
        setProjects(result.data || []);
      } else if (Array.isArray(result)) {
        setProjects(result);
      } else {
        setProjects([]);
        hasImportantError = true;
      }
    } else {
      console.error("Projects API error:", results[0].reason);
      setProjects([]);
      hasImportantError = true;
    }

    /* SERVICES */

    if (results[1].status === "fulfilled") {
      const result = results[1].value;

      if (result?.success) {
        setServices(
          Array.isArray(result.data) && result.data.length > 0
            ? result.data
            : defaultServices
        );
      } else if (Array.isArray(result) && result.length > 0) {
        setServices(result);
      } else {
        setServices(defaultServices);
      }
    } else {
      console.error("Services API error:", results[1].reason);
      setServices(defaultServices);
    }

    /* PROJECT IMAGES */

    if (results[2].status === "fulfilled") {
      const result = results[2].value;

      if (result?.success) {
        setProjectImages(result.data || []);
      } else if (Array.isArray(result)) {
        setProjectImages(result);
      } else {
        setProjectImages([]);
      }
    } else {
      console.error(
        "Project images API error:",
        results[2].reason
      );
      setProjectImages([]);
    }

    /* ENQUIRIES */

    if (results[3].status === "fulfilled") {
      const result = results[3].value;

      if (result?.success) {
        setEnquiries(result.data || []);
      } else if (Array.isArray(result)) {
        setEnquiries(result);
      } else {
        setEnquiries([]);
      }
    } else {
      console.error(
        "Enquiries API error:",
        results[3].reason
      );
      setEnquiries([]);
    }

    if (hasImportantError) {
      setError(
        "Some website data could not be loaded. Other sections are still available."
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     PROJECT IMAGE
  ========================================================= */

  const getProjectImage = (projectId, project) => {
    const image = projectImages.find(
      (item) =>
        Number(item.project_id) === Number(projectId)
    );

    if (image?.image_path) {
      return buildImageUrl(image.image_path);
    }

    if (project?.featured_image) {
      return buildImageUrl(project.featured_image);
    }

    return null;
  };

  /* =========================================================
     SERVICE IMAGE
  ========================================================= */

  const getServiceImage = (image) => {
    return buildImageUrl(image);
  };

  /* =========================================================
     CONTACT FORM
  ========================================================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormMessage("");
    setFormLoading(true);

    try {
      const result = await createEnquiry({
        ...formData,
        status: "new",
      });

      if (result?.success) {
        setFormMessage(
          "Thank you! Your enquiry has been submitted successfully."
        );

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });

        await loadData();
      } else {
        setFormMessage(
          result?.message ||
          result?.error ||
          "Unable to submit your enquiry."
        );
      }
    } catch (err) {
      console.error(err);

      setFormMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* =========================================================
     ADMIN LOGOUT
  ========================================================= */

  const handleAdminLogout = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
    setAdminPage("dashboard");
    window.location.href = "/admin";
  };

  /* =========================================================
     PROJECT FORM
  ========================================================= */

  const handleProjectFormChange = (e) => {
    const { name, value } = e.target;

    setProjectForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProject);
    setProjectMessage("");
    setShowProjectForm(true);
  };

  const openEditProject = (project) => {
    setEditingProject(project);

    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Residential",
      location: project.location || "",
      completion_year:
        project.completion_year || "",
      status: project.status || "completed",
      featured_image:
        project.featured_image || "",
      is_featured:
        Number(project.is_featured || 0),
    });

    setProjectMessage("");
    setShowProjectForm(true);
  };

  const closeProjectForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    setProjectForm(emptyProject);
    setProjectMessage("");
  };

  /* =========================================================
     SAVE PROJECT
  ========================================================= */

  const handleProjectSubmit = async (e) => {
    e.preventDefault();

    setProjectLoading(true);
    setProjectMessage("");

    try {
      let result;

      const data = {
        ...projectForm,
        completion_year:
          projectForm.completion_year === ""
            ? null
            : Number(projectForm.completion_year),
        is_featured:
          Number(projectForm.is_featured),
      };

      if (editingProject) {
        result = await updateProject({
          id: editingProject.id,
          ...data,
        });
      } else {
        result = await createProject(data);
      }

      if (!result?.success) {
        setProjectMessage(
          result?.message ||
          result?.error ||
          "Unable to save project."
        );

        return;
      }

      setProjectMessage(
        editingProject
          ? "Project updated successfully."
          : "Project created successfully."
      );

      await loadData();

      setTimeout(() => {
        closeProjectForm();
      }, 700);
    } catch (err) {
      console.error(err);

      setProjectMessage(
        "Unable to connect to the server."
      );
    } finally {
      setProjectLoading(false);
    }
  };

  /* =========================================================
     DELETE PROJECT
  ========================================================= */

  const handleDeleteProject = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"?`
    );

    if (!confirmed) return;

    try {
      const result = await deleteProject(project.id);

      if (!result?.success) {
        alert(
          result?.message ||
          result?.error ||
          "Unable to delete project."
        );

        return;
      }

      await loadData();

      alert("Project deleted successfully.");
    } catch (err) {
      console.error(err);

      alert("Unable to connect to the server.");
    }
  };

  /* =========================================================
     ENQUIRY MODAL
  ========================================================= */

  const openEnquiryModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowEnquiryModal(true);
  };

  const closeEnquiryModal = () => {
    setSelectedEnquiry(null);
    setShowEnquiryModal(false);
  };

  /* =========================================================
     UPDATE ENQUIRY
  ========================================================= */

  const handleEnquiryStatusChange = async (
    enquiry,
    status
  ) => {
    try {
      const result = await updateEnquiry({
        id: enquiry.id,
        status,
      });

      if (!result?.success) {
        alert(
          result?.message ||
          result?.error ||
          "Unable to update enquiry."
        );

        return;
      }

      setSelectedEnquiry((previous) =>
        previous
          ? {
            ...previous,
            status,
          }
          : previous
      );

      await loadData();
    } catch (err) {
      console.error(err);

      alert("Unable to connect to the server.");
    }
  };

  /* =========================================================
     DELETE ENQUIRY
  ========================================================= */

  const handleDeleteEnquiry = async (enquiry) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the enquiry from "${enquiry.name}"?`
    );

    if (!confirmed) return;

    try {
      const result = await deleteEnquiry(enquiry.id);

      if (!result?.success) {
        alert(
          result?.message ||
          result?.error ||
          "Unable to delete enquiry."
        );

        return;
      }

      closeEnquiryModal();
      await loadData();

      alert("Enquiry deleted successfully.");
    } catch (err) {
      console.error(err);

      alert("Unable to connect to the server.");
    }
  };

  /* =========================================================
     ADMIN LOGIN
  ========================================================= */

  if (
    window.location.pathname === "/admin" &&
    !admin
  ) {
    return <AdminLogin onLogin={setAdmin} />;
  }

  /* =========================================================
     ADMIN DASHBOARD
  ========================================================= */

  if (
    window.location.pathname === "/admin" &&
    admin
  ) {
    const newEnquiries = enquiries.filter(
      (item) => item.status === "new"
    );

    const recentEnquiries = [...enquiries]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .slice(0, 5);

    return (
      <div className="admin-dashboard">

        <header className="admin-dashboard-header">

          <div>
            <h1>
              Srinidhi Constructions
            </h1>

            <p>
              Admin Dashboard
            </p>
          </div>

          <button onClick={handleAdminLogout}>
            Logout
          </button>

        </header>

        <main className="admin-dashboard-content">

          {/* DASHBOARD */}

          {adminPage === "dashboard" && (
            <>
              <div className="admin-welcome-card">

                <h2>
                  Welcome, {admin.name}
                </h2>

                <p>
                  Manage your Srinidhi
                  Constructions website
                  from this dashboard.
                </p>

              </div>

              <div className="admin-stats">

                <button
                  className="admin-stat-card admin-clickable"
                  onClick={() =>
                    setAdminPage("projects")
                  }
                >
                  <h3>Projects</h3>

                  <strong>
                    {projects.length}
                  </strong>

                  <span>
                    View Projects →
                  </span>
                </button>

                <button
                  className="admin-stat-card admin-clickable"
                  onClick={() =>
                    setAdminPage("services")
                  }
                >
                  <h3>Services</h3>

                  <strong>
                    {services.length}
                  </strong>

                  <span>
                    View Services →
                  </span>
                </button>

                <button
                  className="admin-stat-card admin-clickable"
                  onClick={() =>
                    setAdminPage("images")
                  }
                >
                  <h3>
                    Project Images
                  </h3>

                  <strong>
                    {projectImages.length}
                  </strong>

                  <span>
                    View Images →
                  </span>
                </button>

                <button
                  className="admin-stat-card admin-clickable"
                  onClick={() =>
                    setAdminPage("enquiries")
                  }
                >
                  <h3>
                    New Enquiries
                  </h3>

                  <strong>
                    {newEnquiries.length}
                  </strong>

                  <span>
                    View Enquiries →
                  </span>
                </button>

              </div>

              <div className="admin-next-card">

                <div className="admin-section-header">

                  <div>
                    <h2>
                      Recent Enquiries
                    </h2>

                    <p>
                      Latest enquiries submitted
                      through your website.
                    </p>
                  </div>

                  <button
                    className="admin-view-all-button"
                    onClick={() =>
                      setAdminPage("enquiries")
                    }
                  >
                    View All
                  </button>

                </div>

                {recentEnquiries.length === 0 ? (
                  <div className="admin-empty-state">
                    <p>
                      No enquiries yet.
                    </p>
                  </div>
                ) : (
                  <div className="recent-enquiries-list">

                    {recentEnquiries.map(
                      (enquiry) => (
                        <div
                          className="recent-enquiry-item"
                          key={enquiry.id}
                        >

                          <div className="recent-enquiry-info">

                            <strong>
                              {enquiry.name}
                            </strong>

                            <span>
                              {enquiry.subject ||
                                "No subject"}
                            </span>

                            <small>
                              {formatDate(
                                enquiry.created_at
                              )}
                            </small>

                          </div>

                          <button
                            className="recent-enquiry-view-button"
                            onClick={() =>
                              openEnquiryModal(
                                enquiry
                              )
                            }
                          >
                            View
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            </>
          )}

          {/* PROJECTS */}

          {adminPage === "projects" && (
            <div className="admin-management-page">

              <div className="admin-page-heading">

                <div>
                  <p className="admin-page-label">
                    CONTENT MANAGEMENT
                  </p>

                  <h2>Projects</h2>

                  <p>
                    Manage the construction
                    projects displayed on
                    your website.
                  </p>
                </div>

                <div className="admin-page-actions">

                  <button
                    className="admin-refresh-button"
                    onClick={loadData}
                  >
                    ↻ Refresh
                  </button>

                  <button
                    className="admin-add-button"
                    onClick={openAddProject}
                  >
                    + Add Project
                  </button>

                  <button
                    className="admin-back-button"
                    onClick={() =>
                      setAdminPage("dashboard")
                    }
                  >
                    ← Dashboard
                  </button>

                </div>

              </div>

              {showProjectForm && (
                <div className="admin-project-form-card">

                  <div className="admin-form-header">

                    <div>
                      <p className="admin-page-label">
                        PROJECT MANAGEMENT
                      </p>

                      <h2>
                        {editingProject
                          ? "Edit Project"
                          : "Add New Project"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="admin-close-button"
                      onClick={closeProjectForm}
                    >
                      ×
                    </button>

                  </div>

                  <form
                    className="admin-project-form"
                    onSubmit={handleProjectSubmit}
                  >

                    <div className="admin-form-grid">

                      <div className="form-group">

                        <label>
                          Project Title
                        </label>

                        <input
                          type="text"
                          name="title"
                          value={
                            projectForm.title
                          }
                          onChange={
                            handleProjectFormChange
                          }
                          placeholder="Srinidhi Residency"
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Category
                        </label>

                        <select
                          name="category"
                          value={
                            projectForm.category
                          }
                          onChange={
                            handleProjectFormChange
                          }
                        >
                          <option value="Residential">
                            Residential
                          </option>

                          <option value="Commercial">
                            Commercial
                          </option>

                          <option value="Renovation">
                            Renovation
                          </option>

                          <option value="Infrastructure">
                            Infrastructure
                          </option>
                        </select>

                      </div>

                      <div className="form-group">

                        <label>
                          Location
                        </label>

                        <input
                          type="text"
                          name="location"
                          value={
                            projectForm.location
                          }
                          onChange={
                            handleProjectFormChange
                          }
                          placeholder="Hyderabad, India"
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Completion Year
                        </label>

                        <input
                          type="number"
                          name="completion_year"
                          value={
                            projectForm.completion_year
                          }
                          onChange={
                            handleProjectFormChange
                          }
                          placeholder="2026"
                          min="1900"
                          max="2100"
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Status
                        </label>

                        <select
                          name="status"
                          value={
                            projectForm.status
                          }
                          onChange={
                            handleProjectFormChange
                          }
                        >
                          <option value="completed">
                            Completed
                          </option>

                          <option value="ongoing">
                            Ongoing
                          </option>

                          <option value="upcoming">
                            Upcoming
                          </option>
                        </select>

                      </div>

                      <div className="form-group">

                        <label>
                          Featured
                        </label>

                        <select
                          name="is_featured"
                          value={
                            projectForm.is_featured
                          }
                          onChange={
                            handleProjectFormChange
                          }
                        >
                          <option value={0}>
                            No
                          </option>

                          <option value={1}>
                            Yes
                          </option>
                        </select>

                      </div>

                    </div>

                    <div className="form-group">

                      <label>
                        Featured Image Path
                      </label>

                      <input
                        type="text"
                        name="featured_image"
                        value={
                          projectForm.featured_image
                        }
                        onChange={
                          handleProjectFormChange
                        }
                        placeholder="uploads/projects/project.jpg"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Description
                      </label>

                      <textarea
                        name="description"
                        rows="5"
                        value={
                          projectForm.description
                        }
                        onChange={
                          handleProjectFormChange
                        }
                        placeholder="Describe the construction project..."
                        required
                      />

                    </div>

                    {projectMessage && (
                      <div className="admin-form-message">
                        {projectMessage}
                      </div>
                    )}

                    <div className="admin-form-actions">

                      <button
                        type="button"
                        className="admin-cancel-button"
                        onClick={closeProjectForm}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="admin-save-button"
                        disabled={projectLoading}
                      >
                        {projectLoading
                          ? "Saving..."
                          : editingProject
                            ? "Update Project"
                            : "Create Project"}
                      </button>

                    </div>

                  </form>

                </div>
              )}

              {loading ? (
                <div className="admin-empty-state">
                  <h3>
                    Loading projects...
                  </h3>
                </div>
              ) : projects.length === 0 ? (
                <div className="admin-empty-state">

                  <h3>
                    No projects found
                  </h3>

                  <p>
                    Click "Add Project" to
                    create your first project.
                  </p>

                </div>
              ) : (
                <div className="admin-project-grid">

                  {projects.map((project, index) => {

                    const imageUrl =
                      getProjectImage(
                        project.id,
                        project
                      );

                    return (
                      <article
                        className="admin-project-card"
                        key={project.id}
                      >

                        <div className="admin-project-image">

                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={
                                project.title ||
                                "Construction project"
                              }
                            />
                          ) : (
                            <img
                              src={
                                fallbackProjectImages[
                                index %
                                fallbackProjectImages.length
                                ]
                              }
                              alt={
                                project.title ||
                                "Construction project"
                              }
                            />
                          )}

                        </div>

                        <div className="admin-project-content">

                          <div className="admin-project-top">

                            <span>
                              {project.category ||
                                "Construction"}
                            </span>

                            {project.status && (
                              <small
                                className={`project-status ${project.status}`}
                              >
                                {project.status}
                              </small>
                            )}

                          </div>

                          <h3>
                            {project.title}
                          </h3>

                          <p>
                            {project.description ||
                              "No description available."}
                          </p>

                          {project.location && (
                            <small>
                              📍{" "}
                              {project.location}
                            </small>
                          )}

                          <div className="admin-project-actions">

                            <button
                              className="admin-edit-button"
                              onClick={() =>
                                openEditProject(
                                  project
                                )
                              }
                            >
                              ✎ Edit
                            </button>

                            <button
                              className="admin-delete-button"
                              onClick={() =>
                                handleDeleteProject(
                                  project
                                )
                              }
                            >
                              🗑 Delete
                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  })}

                </div>
              )}

            </div>
          )}

          {/* SERVICES */}

          {adminPage === "services" && (
            <div className="admin-management-page">

              <div className="admin-page-heading">

                <div>
                  <p className="admin-page-label">
                    CONTENT MANAGEMENT
                  </p>

                  <h2>Services</h2>

                  <p>
                    Services currently available
                    on the website.
                  </p>
                </div>

                <button
                  className="admin-back-button"
                  onClick={() =>
                    setAdminPage("dashboard")
                  }
                >
                  ← Dashboard
                </button>

              </div>

              {services.length === 0 ? (
                <div className="admin-empty-state">

                  <h3>
                    No services found
                  </h3>

                  <p>
                    Your services table
                    currently has no records.
                  </p>

                </div>
              ) : (
                <div className="admin-service-grid">

                  {services.map((service) => (

                    <article
                      className="admin-service-card"
                      key={service.id}
                    >

                      <div className="admin-service-image">

                        {service.image ? (
                          <img
                            src={getServiceImage(
                              service.image
                            )}
                            alt={service.title}
                          />
                        ) : (
                          <div className="service-image-placeholder">
                            CONSTRUCTION
                          </div>
                        )}

                      </div>

                      <div>
                        <h3>
                          {service.title}
                        </h3>

                        <p>
                          {service.description}
                        </p>
                      </div>

                    </article>

                  ))}

                </div>
              )}

            </div>
          )}

          {/* PROJECT IMAGES */}

          {adminPage === "images" && (
            <div className="admin-management-page">

              <div className="admin-page-heading">

                <div>
                  <p className="admin-page-label">
                    CONTENT MANAGEMENT
                  </p>

                  <h2>
                    Project Images
                  </h2>

                  <p>
                    Images currently connected
                    to your projects.
                  </p>
                </div>

                <button
                  className="admin-back-button"
                  onClick={() =>
                    setAdminPage("dashboard")
                  }
                >
                  ← Dashboard
                </button>

              </div>

              {projectImages.length === 0 ? (
                <div className="admin-empty-state">

                  <h3>
                    No project images found
                  </h3>

                  <p>
                    There are currently no
                    project images.
                  </p>

                </div>
              ) : (
                <div className="admin-image-grid">

                  {projectImages.map((image) => (

                    <article
                      className="admin-image-card"
                      key={image.id}
                    >

                      <img
                        src={buildImageUrl(
                          image.image_path
                        )}
                        alt={
                          image.alt_text ||
                          "Project image"
                        }
                      />

                      <div>

                        <h3>
                          {image.alt_text ||
                            "Project Image"}
                        </h3>

                        <p>
                          Project ID:{" "}
                          {image.project_id}
                        </p>

                      </div>

                    </article>

                  ))}

                </div>
              )}

            </div>
          )}

          {/* ENQUIRIES */}

          {adminPage === "enquiries" && (
            <div className="admin-management-page">

              <div className="admin-page-heading">

                <div>

                  <p className="admin-page-label">
                    CUSTOMER MANAGEMENT
                  </p>

                  <h2>
                    Enquiries
                  </h2>

                  <p>
                    View and manage enquiries
                    submitted through your website.
                  </p>

                </div>

                <div className="admin-page-actions">

                  <button
                    className="admin-refresh-button"
                    onClick={loadData}
                  >
                    ↻ Refresh
                  </button>

                  <button
                    className="admin-back-button"
                    onClick={() =>
                      setAdminPage("dashboard")
                    }
                  >
                    ← Dashboard
                  </button>

                </div>

              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="admin-empty-state">

                  <h3>
                    Loading enquiries...
                  </h3>

                </div>
              ) : enquiries.length === 0 ? (

                <div className="admin-empty-state">

                  <h3>
                    No enquiries found
                  </h3>

                  <p>
                    Customer enquiries will
                    appear here when someone
                    submits the contact form.
                  </p>

                </div>

              ) : (

                <div className="admin-enquiries-table-wrapper">

                  <table className="admin-enquiries-table">

                    <thead>

                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {enquiries.map(
                        (enquiry) => (

                          <tr
                            key={enquiry.id}
                          >

                            <td>
                              <strong>
                                {enquiry.name ||
                                  "-"}
                              </strong>
                            </td>

                            <td>
                              {enquiry.email ||
                                "-"}
                            </td>

                            <td>
                              <span className="enquiry-subject-cell">
                                {enquiry.subject ||
                                  "No subject"}
                              </span>
                            </td>

                            <td>

                              <select
                                className="enquiry-status-select"
                                value={
                                  enquiry.status ||
                                  "new"
                                }
                                onChange={(e) =>
                                  handleEnquiryStatusChange(
                                    enquiry,
                                    e.target.value
                                  )
                                }
                              >

                                <option value="new">
                                  New
                                </option>

                                <option value="contacted">
                                  Contacted
                                </option>

                                <option value="closed">
                                  Closed
                                </option>

                              </select>

                            </td>

                            <td>
                              {formatDate(
                                enquiry.created_at
                              )}
                            </td>

                            <td>

                              <div className="enquiry-action-buttons">

                                <button
                                  className="admin-edit-button"
                                  onClick={() =>
                                    openEnquiryModal(
                                      enquiry
                                    )
                                  }
                                >
                                  View
                                </button>

                                <button
                                  className="admin-delete-button"
                                  onClick={() =>
                                    handleDeleteEnquiry(
                                      enquiry
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

              {/* ENQUIRY MODAL */}

              {showEnquiryModal &&
                selectedEnquiry && (

                  <div
                    className="admin-modal-overlay"
                    onClick={closeEnquiryModal}
                  >

                    <div
                      className="admin-modal"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >

                      <div className="admin-modal-header">

                        <div>

                          <p className="admin-page-label">
                            CUSTOMER ENQUIRY
                          </p>

                          <h2>
                            Enquiry Details
                          </h2>

                        </div>

                        <button
                          className="admin-close-button"
                          onClick={
                            closeEnquiryModal
                          }
                        >
                          ×
                        </button>

                      </div>

                      <div className="enquiry-modal-customer">

                        <h3>
                          {selectedEnquiry.name ||
                            "Customer"}
                        </h3>

                      </div>

                      <div className="enquiry-detail-list">

                        <div>
                          <strong>
                            Name:
                          </strong>

                          <span>
                            {selectedEnquiry.name ||
                              "-"}
                          </span>
                        </div>

                        <div>
                          <strong>
                            Email:
                          </strong>

                          <span>
                            {selectedEnquiry.email ||
                              "-"}
                          </span>
                        </div>

                        <div>
                          <strong>
                            Phone:
                          </strong>

                          <span>
                            {selectedEnquiry.phone ||
                              "-"}
                          </span>
                        </div>

                        <div>
                          <strong>
                            Subject:
                          </strong>

                          <span>
                            {selectedEnquiry.subject ||
                              "-"}
                          </span>
                        </div>

                        <div>
                          <strong>
                            Date:
                          </strong>

                          <span>
                            {formatDate(
                              selectedEnquiry.created_at
                            )}
                          </span>
                        </div>

                        <div>
                          <strong>
                            Status:
                          </strong>

                          <select
                            className="enquiry-status-select"
                            value={
                              selectedEnquiry.status ||
                              "new"
                            }
                            onChange={(e) =>
                              handleEnquiryStatusChange(
                                selectedEnquiry,
                                e.target.value
                              )
                            }
                          >

                            <option value="new">
                              New
                            </option>

                            <option value="contacted">
                              Contacted
                            </option>

                            <option value="closed">
                              Closed
                            </option>

                          </select>

                        </div>

                      </div>

                      <div className="enquiry-message-box">

                        <strong>
                          Message
                        </strong>

                        <p>
                          {selectedEnquiry.message ||
                            "No message provided."}
                        </p>

                      </div>

                      <div className="enquiry-modal-actions">

                        <button
                          className="admin-delete-button"
                          onClick={() =>
                            handleDeleteEnquiry(
                              selectedEnquiry
                            )
                          }
                        >
                          Delete Enquiry
                        </button>

                        <button
                          className="admin-cancel-button"
                          onClick={
                            closeEnquiryModal
                          }
                        >
                          Close
                        </button>

                      </div>

                    </div>

                  </div>

                )}

            </div>
          )}

        </main>
      </div>
    );
  }

  /* =========================================================
     PUBLIC WEBSITE
  ========================================================= */

  return (
    <div className="site-wrapper">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="navbar-container">

          <a
            href="#home"
            className="logo"
          >
            Srinidhi
            <span>
              Constructions
            </span>
          </a>

          <nav className="nav-menu">

            <a href="#home">
              Home
            </a>

            <a href="#about">
              About
            </a>

            <a href="#projects">
              Projects
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#contact">
              Contact
            </a>

          </nav>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="home"
        className="hero-section"
      >

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <p className="hero-small-text">
            BUILDING TRUST. CREATING FUTURES.
          </p>

          <h1>
            Quality Construction
            <br />
            For A Better Tomorrow
          </h1>

          <p>
            Reliable construction solutions
            with quality, transparency and
            professional workmanship.
          </p>

          <a
            href="#contact"
            className="primary-button"
          >
            Get In Touch
          </a>

        </div>

      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="about-section"
      >

        <div className="section-container">

          <div className="section-heading">

            <p className="section-label">
              ABOUT US
            </p>

            <h2>
              Building With Quality,
              <br />
              Trust & Commitment
            </h2>

          </div>

          <div className="about-content">

            <div className="about-text">

              <p>
                Srinidhi Constructions is
                committed to delivering
                high-quality construction
                projects with a strong focus
                on reliability, safety and
                customer satisfaction.
              </p>

              <p>
                From residential buildings
                to commercial developments,
                we focus on combining modern
                construction practices with
                dependable workmanship.
              </p>

            </div>

            <div className="about-stats">

              <div className="stat-item">

                <strong>
                  10+
                </strong>

                <span>
                  Years Experience
                </span>

              </div>

              <div className="stat-item">

                <strong>
                  50+
                </strong>

                <span>
                  Projects Completed
                </span>

              </div>

              <div className="stat-item">

                <strong>
                  100%
                </strong>

                <span>
                  Commitment
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          PROJECTS
      ===================================================== */}

      <section
        id="projects"
        className="projects-section"
      >

        <div className="section-container">

          <div className="section-heading center-heading">

            <p className="section-label">
              OUR PROJECTS
            </p>

            <h2>
              Featured Projects
            </h2>

            <p>
              Explore some of our
              construction projects.
            </p>

          </div>

          {loading && (
            <div className="loading-message">
              Loading projects...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!loading &&
            projects.length === 0 && (
              <div className="empty-message">
                No projects available.
              </div>
            )}

          {!loading &&
            projects.length > 0 && (

              <div className="projects-grid">

                {projects.map((project, index) => {

                  const imageUrl =
                    getProjectImage(
                      project.id,
                      project
                    );

                  const finalImage =
                    imageUrl ||
                    fallbackProjectImages[
                    index %
                    fallbackProjectImages.length
                    ];

                  return (
                    <article
                      className="project-card"
                      key={project.id}
                    >

                      <div className="project-image">

                        <img
                          src={finalImage}
                          alt={
                            project.title ||
                            "Srinidhi Constructions project"
                          }
                        />

                        <div className="project-image-overlay">

                          <span>
                            {project.status ||
                              "PROJECT"}
                          </span>

                        </div>

                      </div>

                      <div className="project-info">

                        <p className="project-category">
                          {project.category ||
                            "Construction"}
                        </p>

                        <h3>
                          {project.title}
                        </h3>

                        <p>
                          {project.description ||
                            "Quality construction project by Srinidhi Constructions."}
                        </p>

                        {project.location && (
                          <span className="project-location">
                            📍{" "}
                            {project.location}
                          </span>
                        )}

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

        </div>

      </section>

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section
        id="services"
        className="services-section"
      >

        <div className="section-container">

          <div className="section-heading center-heading">

            <p className="section-label">
              WHAT WE DO
            </p>

            <h2>
              Our Services
            </h2>

            <p>
              Professional construction
              services for residential
              and commercial requirements.
            </p>

          </div>

          <div className="services-grid">

            {services.map((service, index) => {

              const image =
                getServiceImage(
                  service.image
                ) ||
                fallbackProjectImages[
                index %
                fallbackProjectImages.length
                ];

              return (
                <article
                  className="service-card"
                  key={service.id}
                >

                  {/* SERVICE IMAGE */}

                  <div className="service-image">

                    <img
                      src={image}
                      alt={
                        service.title ||
                        "Construction service"
                      }
                    />

                    <div className="service-image-overlay">

                      <span>
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                    </div>

                  </div>

                  {/* SERVICE CONTENT */}

                  <div className="service-content">

                    <p className="service-number">
                      SERVICE {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3>
                      {service.title}
                    </h3>

                    <p>
                      {service.description}
                    </p>

                    <a
                      href="#contact"
                      className="service-link"
                    >
                      Discuss Your Project →
                    </a>

                  </div>

                </article>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        id="contact"
        className="contact-section"
      >

        <div className="contact-overlay"></div>

        <div className="section-container contact-container">

          <div className="contact-info">

            <p className="section-label">
              CONTACT US
            </p>

            <h2>
              Let's Build Something Together
            </h2>

            <p>
              Have a construction project
              in mind? Contact us and our
              team will get back to you.
            </p>

            <div className="contact-details">

              <div className="contact-detail">

                <strong>
                  Phone
                </strong>

                <span>
                  +91 98765 43210
                </span>

              </div>

              <div className="contact-detail">

                <strong>
                  Email
                </strong>

                <span>
                  info@srinidhiconstructions.com
                </span>

              </div>

              <div className="contact-detail">

                <strong>
                  Location
                </strong>

                <span>
                  India
                </span>

              </div>

            </div>

          </div>

          <div className="contact-form-container">

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="subject">
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />

              </div>

              <div className="form-group">

                <label htmlFor="message">
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  placeholder="Tell us about your project"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                ></textarea>

              </div>

              <button
                type="submit"
                className="primary-button form-button"
                disabled={formLoading}
              >
                {formLoading
                  ? "Sending..."
                  : "Send Enquiry"}
              </button>

              {formMessage && (
                <div className="form-message">
                  {formMessage}
                </div>
              )}

            </form>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-container">

          <div>

            <h3>
              Srinidhi Constructions
            </h3>

            <p>
              Building quality spaces
              with trust and commitment.
            </p>

          </div>

          <div className="footer-links">

            <a href="#home">
              Home
            </a>

            <a href="#about">
              About
            </a>

            <a href="#projects">
              Projects
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#contact">
              Contact
            </a>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © 2026 Srinidhi Constructions.
            All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;