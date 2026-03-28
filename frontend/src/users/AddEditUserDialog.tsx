import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import type { User, ApiError } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Toggle } from "@/ui/Toggle";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { useCreateUser, useUpdateUser } from "./hooks";
import { userSchema } from "./schemas";
import type { UserFormData } from "./schemas";

const AVAILABLE_ROLES = ["Admin", "Creditor", "Borrower"] as const;

interface AddEditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSuccess: () => void;
}

export function AddEditUserDialog({ open, onClose, user, onSuccess }: AddEditUserDialogProps) {
  const toast = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      roles: [],
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          roles: user.roles.map((r) => r.name),
          is_active: user.is_active,
        });
      } else {
        reset({ name: "", email: "", roles: [], is_active: true });
      }
    }
  }, [open, user, reset]);

  const selectedRoles = watch("roles");
  const isActive = watch("is_active");
  const isPending = createUser.isPending || updateUser.isPending;

  function handleRoleToggle(role: string, checked: boolean) {
    const current = selectedRoles ?? [];
    const next = checked ? [...current, role] : current.filter((r) => r !== role);
    setValue("roles", next, { shouldValidate: true });
  }

  function handleError(err: unknown) {
    if (err instanceof AxiosError && err.response) {
      const data = err.response.data as ApiError;
      if (err.response.status === 409) {
        setError("email", { message: "A user with this email already exists" });
      } else if (err.response.status === 422 && data.details) {
        for (const [field, messages] of Object.entries(data.details)) {
          setError(field as keyof UserFormData, { message: messages[0] });
        }
      } else {
        toast.error(data.error || "An error occurred");
      }
    } else {
      toast.error("An unexpected error occurred");
    }
  }

  function onSubmit(data: UserFormData) {
    if (user) {
      updateUser.mutate(
        { id: user.id, ...data },
        {
          onSuccess: () => {
            toast.success("User updated successfully");
            onClose();
            onSuccess();
          },
          onError: handleError,
        },
      );
    } else {
      createUser.mutate(data, {
        onSuccess: () => {
          toast.success("User created successfully");
          onClose();
          onSuccess();
        },
        onError: handleError,
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? "Edit User" : "Add New User"}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            isLoading={isPending}
          >
            Save User
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Email Address"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-text-secondary text-[13px] font-medium font-body mb-1">
            Role
          </legend>
          {AVAILABLE_ROLES.map((role) => (
            <label key={role} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoles?.includes(role) ?? false}
                onChange={(e) => handleRoleToggle(role, e.target.checked)}
                className="rounded border-border-strong text-primary focus:ring-primary/30"
              />
              <span className="font-body text-sm text-text-primary">{role}</span>
            </label>
          ))}
          {errors.roles && (
            <p data-testid="error-roles" className="text-danger-text text-xs font-body">
              {errors.roles.message}
            </p>
          )}
        </fieldset>
        <Toggle
          label="Active Status"
          description="Inactive users cannot log in to the system"
          checked={isActive}
          onChange={(checked) => setValue("is_active", checked)}
        />
      </form>
    </Modal>
  );
}

export default AddEditUserDialog;
