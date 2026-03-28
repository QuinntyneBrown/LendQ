import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  name: string;
  error?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function Textarea({
  label,
  name,
  error,
  placeholder,
  rows = 3,
  value,
  onChange,
  disabled,
  ...rest
}: TextareaProps) {
  const textareaId = `textarea-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={textareaId}
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-vertical ${error ? "border-danger-text" : ""}`}
        {...rest}
      />
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

export default Textarea;
