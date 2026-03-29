import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Landmark, Mail } from "lucide-react";
import { forgotPasswordSchema } from "./schemas";
import type { ForgotPasswordFormData } from "./schemas";
import { apiPost } from "@/api/client";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await apiPost("/auth/forgot-password", { email: data.email });
    } catch {
      // Always show success to not leak user existence
    } finally {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div data-testid="reset-success" className="text-center max-w-md px-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary">
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
          <Link to="/login" className="inline-block mt-4 text-primary font-medium hover:underline">
            Back to Login
          </Link>
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
        <p className="mt-2 text-white/80">We&apos;ll help you get back in</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <h2 className="font-heading text-[32px] font-bold text-text-primary">Reset your password</h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            Enter your email and we&apos;ll send you a reset link
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-6">
            <Input
              label="Email Address"
              icon={Mail}
              placeholder="you@example.com"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full"
            >
              Send Reset Link
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Remember your password?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
