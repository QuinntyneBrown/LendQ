import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate } from "react-router-dom";
import { Landmark, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { signUpSchema } from "./schemas";
import type { SignUpFormData } from "./schemas";
import { useAuth } from "./hooks";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import { isAxiosError } from "axios";

export function SignUpPage() {
  const auth = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  if (auth.isAuthenticated && !auth.isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data: SignUpFormData) {
    try {
      await auth.signup(data);
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError("email", { message: "An account with this email already exists" });
      }
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div data-testid="signup-success" className="text-center max-w-md px-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Account created successfully!
          </h2>
          <p className="text-text-secondary">
            Please check your email to verify your account, then{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-primary">
        <Landmark size={48} className="text-white mb-4" />
        <h1 className="font-heading text-5xl font-extrabold text-white">LendQ</h1>
        <p className="mt-2 text-white/80">Track family loans with ease</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <h2 className="font-heading text-[32px] font-bold text-text-primary">Create your account</h2>
          <p className="mt-1 text-text-secondary">Join your family&apos;s lending circle</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Input
              label="Full Name"
              icon={User}
              placeholder="John Doe"
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />

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
              placeholder="Create a password"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={ShieldCheck}
              placeholder="Confirm your password"
              disabled={isSubmitting}
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-2"
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-text-secondary mt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
