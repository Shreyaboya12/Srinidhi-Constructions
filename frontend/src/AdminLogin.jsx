import { useState } from "react";
import { adminLogin } from "./api";

function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const result = await adminLogin(email, password);

            if (result.success) {
                setMessage("Login successful!");

                localStorage.setItem("admin", JSON.stringify(result.data));

                setTimeout(() => {
                    onLogin(result.data);
                }, 500);
            } else {
                setMessage(result.message || "Invalid email or password.");
            }
        } catch (error) {
            setMessage("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <h1>Srinidhi Constructions</h1>

                <h2>Admin Login</h2>

                <p>Sign in to manage your website.</p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter admin email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {message && <div className="admin-login-message">{message}</div>}
            </div>
        </div>
    );
}

export default AdminLogin;