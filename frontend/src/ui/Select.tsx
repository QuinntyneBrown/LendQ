import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label: string;
  name: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({
  label,
  name,
  options,
  error,
  placeholder,
  value,
  onChange,
  disabled,
  ...rest
}: SelectProps) {
  const selectId = `select-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white ${error ? "border-danger-text" : ""}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 text-text-muted pointer-events-none"
          aria-hidden="true"
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
}

export default Select;
