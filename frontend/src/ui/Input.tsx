import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  name: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, name, error, icon: Icon, className = "", ...rest },
  ref,
) {
  const inputId = `input-${name}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 text-text-muted w-[18px]"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={`w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${Icon ? "pl-[42px]" : ""} ${error ? "border-danger-text" : ""}`}
          {...rest}
        />
      </div>
      {error && (
        <p
          data-testid={`error-${name}`}
          className="text-danger-text text-xs font-body"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
