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
import { useCreateUser, useRoles, useUpdateUser } from "./hooks";
import { userSchema } from "./schemas";
import type { UserFormData } from "./schemas";

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
  const rolesQuery = useRoles();

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
      password: "",
      role_ids: [],
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: "",
          role_ids: user.roles.map((r) => r.id),
          is_active: user.is_active,
        });
      } else {
        reset({ name: "", email: "", password: "", role_ids: [], is_active: true });
      }
    }
  }, [open, user, reset]);

  const selectedRoleIds = watch("role_ids");
  const isActive = watch("is_active");
  const isPending = createUser.isPending || updateUser.isPending || rolesQuery.isLoading;

  function handleRoleToggle(roleId: string, checked: boolean) {
    const current = selectedRoleIds ?? [];
    const next = checked ? [...current, roleId] : current.filter((value) => value !== roleId);
    setValue("role_ids", next, { shouldValidate: true });
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
        {
          id: user.id,
          name: data.name,
          email: data.email,
          role_ids: data.role_ids,
          is_active: data.is_active,
        },
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
      if (!data.password || data.password.length < 8) {
        setError("password", { message: "Password must be at least 8 characters" });
        return;
      }

      createUser.mutate(
        {
          name: data.name,
          email: data.email,
          password: data.password,
          role_ids: data.role_ids,
        },
        {
          onSuccess: () => {
            toast.success("User created successfully");
            onClose();
            onSuccess();
          },
          onError: handleError,
        },
      );
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
        {!user && (
          <Input
            label="Password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-text-secondary text-[13px] font-medium font-body mb-1">
            Role
          </legend>
          {rolesQuery.data?.map((role) => (
            <label key={role.id} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoleIds?.includes(role.id) ?? false}
                onChange={(e) => handleRoleToggle(role.id, e.target.checked)}
                className="rounded border-border-strong text-primary focus:ring-primary/30"
              />
              <span className="font-body text-sm text-text-primary">{role.name}</span>
            </label>
          ))}
          {errors.role_ids && (
            <p data-testid="error-role_ids" className="text-danger-text text-xs font-body">
              {errors.role_ids.message}
            </p>
          )}
        </fieldset>
        {user && (
          <Toggle
            label="Active Status"
            description="Inactive users cannot log in to the system"
            checked={isActive}
            onChange={(checked) => setValue("is_active", checked)}
          />
        )}
      </form>
    </Modal>
  );
}

export default AddEditUserDialog;
