import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Landmark, Mail, Lock } from "lucide-react";
import { loginSchema } from "./schemas";
import type { LoginFormData } from "./schemas";
import { useAuth } from "./hooks";
import { useToast } from "@/notifications/useToast";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import { isAxiosError } from "axios";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (auth.isAuthenticated && !auth.isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    try {
      await auth.login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error("Connection failed. Please try again.");
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div
        data-testid="login-left-panel"
        className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-primary"
      >
        <Landmark size={48} className="text-white mb-4" />
        <h1 className="font-heading text-5xl font-extrabold text-white">LendQ</h1>
        <p className="mt-2 text-white/80">Family lending made simple</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <h2 className="font-heading text-[32px] font-bold text-text-primary">Welcome back</h2>
          <p className="mt-1 text-text-secondary">Sign in to manage your loans</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Input
              label="Email Address"
              icon={Mail}
              placeholder="you@example.com"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Enter your password"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-strong"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full"
            >
              Sign In
            </Button>

            <div className="flex items-center gap-3 my-2">
              <hr className="flex-1 border-border-default" />
              <span className="text-text-muted text-sm">or</span>
              <hr className="flex-1 border-border-default" />
            </div>

            <p className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
