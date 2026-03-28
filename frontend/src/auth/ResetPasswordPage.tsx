import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { Landmark, Lock, ShieldCheck } from "lucide-react";
import { resetPasswordSchema } from "./schemas";
import type { ResetPasswordFormData } from "./schemas";
import { apiPost } from "@/api/client";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    try {
      await apiPost("/auth/reset-password", {
        token,
        password: data.password,
        confirm_password: data.confirm_password,
      });
      setSuccess(true);
    } catch {
      setTokenError("This reset link is invalid or has expired. Please request a new one.");
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div data-testid="reset-complete-success" className="text-center max-w-md px-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Password reset successful
          </h2>
          <p className="text-text-secondary">
            Your password has been updated. You can now{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              sign in
            </Link>{" "}
            with your new password.
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div data-testid="token-error" className="text-center max-w-md px-6">
          <h2 className="font-heading text-2xl font-bold text-danger-text mb-2">Invalid reset link</h2>
          <p className="text-text-secondary">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="inline-block mt-4 text-primary font-medium hover:underline"
          >
            Request a new reset link
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
        <p className="mt-2 text-white/80">Almost there</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <h2 className="font-heading text-[32px] font-bold text-text-primary">Set new password</h2>
          <p className="mt-1 text-text-secondary">Choose a strong password for your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Input
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="Enter new password"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={ShieldCheck}
              placeholder="Confirm new password"
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
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
