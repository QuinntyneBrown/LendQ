import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SavingsGoal } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { createSavingsGoalSchema, updateSavingsGoalSchema } from "./schemas";
import type { CreateSavingsGoalFormData } from "./schemas";
import { useCreateSavingsGoal, useUpdateSavingsGoal } from "./hooks";

interface CreateEditSavingsGoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: SavingsGoal;
  onSuccess?: (goal?: SavingsGoal) => void;
}

export function CreateEditSavingsGoalDialog({
  open,
  onClose,
  goal,
  onSuccess,
}: CreateEditSavingsGoalDialogProps) {
  const isEdit = !!goal;
  const createMutation = useCreateSavingsGoal();
  const updateMutation = useUpdateSavingsGoal();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSavingsGoalFormData>({
    resolver: zodResolver(isEdit ? updateSavingsGoalSchema : createSavingsGoalSchema) as Resolver<CreateSavingsGoalFormData>,
    defaultValues: {
      name: "",
      target_amount: undefined as unknown as number,
      deadline: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          target_amount: goal.target_amount,
          deadline: goal.deadline ?? "",
          description: goal.description ?? "",
        });
      } else {
        reset({
          name: "",
          target_amount: undefined as unknown as number,
          deadline: "",
          description: "",
        });
      }
    }
  }, [open, goal, reset]);

  const onSubmit = (data: CreateSavingsGoalFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      target_amount: data.target_amount,
    };
    if (data.deadline) {
      payload.deadline = data.deadline;
    }
    if (data.description) {
      payload.description = data.description;
    }

    if (isEdit) {
      payload.expected_version = goal.version;
      updateMutation.mutate(
        { id: goal.id, ...payload } as Record<string, unknown> & { id: string },
        {
          onSuccess: (updatedGoal) => {
            toast.success("Savings goal updated");
            onSuccess?.(updatedGoal);
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (createdGoal) => {
          toast.success("Savings goal created");
          onSuccess?.(createdGoal);
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Savings Goal" : "Create Savings Goal"}
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            isLoading={isPending}
            disabled={isPending}
          >
            {isEdit ? "Save" : "Create Goal"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Goal Name"
          {...register("name")}
          error={errors.name?.message}
          placeholder="e.g., Emergency Fund"
        />

        <Input
          label="Target Amount"
          type="number"
          step="0.01"
          {...register("target_amount", { valueAsNumber: true })}
          error={errors.target_amount?.message}
          placeholder="10000.00"
        />

        <Input
          label="Deadline (optional)"
          type="date"
          {...register("deadline")}
          error={errors.deadline?.message}
        />

        <Textarea
          label="Description (optional)"
          name="description"
          value={watch("description") ?? ""}
          onChange={(e) => setValue("description", e.target.value)}
          error={errors.description?.message}
          placeholder="What are you saving for?"
          rows={3}
        />
      </form>
    </Modal>
  );
}

export default CreateEditSavingsGoalDialog;
