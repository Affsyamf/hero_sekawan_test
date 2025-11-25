// pages/auth/LoginPage.jsx
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import { login } from "../../services/auth_service";
import loginImg from "../../assets/images/login-img.jpg";
import logo from "../../assets/images/logo.png";
import { useAuthStore } from "../../stores/useAuthStore";

export default function LoginPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const { accessToken, user } = useAuthStore();

  // ✅ Check if user already logged in
  useEffect(() => {
    if (accessToken && user) {
      navigate("/dashboard");
    }
  }, [accessToken, user]);

  // Load remembered username if exists
  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe");
    const savedUsername = localStorage.getItem("savedUsername"); // ✅ Ganti key biar ga bentrok
    if (rememberMe === "true" && savedUsername) {
      setFormData((prev) => ({
        ...prev,
        username: savedUsername,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
      };

      // ✅ Login akan otomatis simpan token & refresh_token
      await login(payload);

      // ✅ Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Left Side - Image */}
      <div className="relative hidden w-1/2 lg:block">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-4xl font-bold">Welcome to Hero Sekawan</h2>
            <p className="text-lg opacity-90">PLACEHOLDER SLOGAN</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center w-full px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-full"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <img src={logo} alt="Hero Sekawan Logo" className="w-10 h-10" />
              </div>
            </div>
            <h1
              className="mb-2 text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >
              Hello Again!
            </h1>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Welcome back to Heri Sekawan! Please login to your account.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div
                className="p-3 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.status.errorLight,
                  color: colors.status.error,
                  border: `1px solid ${colors.status.error}`,
                }}
              >
                {error}
              </div>
            )}

            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors hover:opacity-70 disabled:opacity-50"
                  style={{ color: colors.text.secondary }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {/* <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    accentColor: colors.primary,
                  }}
                />
                <span
                  className="ml-2 text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Remember Me
                </span>
              </label>
            </div> */}

            {/* Login Button */}
            <Button
              type="submit"
              icon={loading ? Loader2 : undefined}
              label={loading ? "Logging in..." : "Login"}
              variant="primary"
              className={`w-full py-3 text-base font-semibold ${
                loading ? "opacity-80" : ""
              }`}
              disabled={loading}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
