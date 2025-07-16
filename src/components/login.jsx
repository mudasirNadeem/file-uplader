import { useState } from "react";
import { loginUser } from "../service/dbService";

export default function LoginPage() {
  const [email, setEmail] = useState("mudasirnadeem7979@gmail.com");
  const [password, setPassword] = useState("mudasir2525");
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await loginUser(email, password);
      if (result.ok) {
        window.location.href = "/product";
      } else {
        setError("Your password or email is wrong");
      }
    } catch (error) {
      alert("❌ Failed to login user:", error);
    }
    setLoading(false);
  }
  return (
    <div className="min-h-screen  flex items-center justify-center px-4 relative">
      <div
        className={`card w-full max-w-sm shadow-md transition-opacity duration-300`}
      >
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-4 text-base-content">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered"
                name="email"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                value={password}
                name="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input input-bordered"
              />
              {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>

            <div className="form-control mt-4 flex justify-between items-center">
              <label className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="checkbox checkbox-primary" />
                <span className="label-text">Remember me</span>
              </label>

              <a
                href="https://mega.nz/register"
                target="bland"
                className="font-bold text-blue-500"
              >
                Sign Up
              </a>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary `}
               disabled={isLoading}
              >
                
                {isLoading && (
                  <span className="loading loading-spinner loading-3xl text-primary "></span>
                )}
                {isLoading ? "Logging In... " : "Log In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
