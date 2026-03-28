import { DollarSign } from "lucide-react";

interface CurrencyInputProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  label,
  name,
  value,
  onChange,
  error,
  disabled,
}: CurrencyInputProps) {
  const inputId = `currency-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <DollarSign
          size={18}
          className="absolute left-3 text-text-muted"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder="0.00"
          className={`w-full rounded-input border border-border-strong pl-10 pr-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${error ? "border-danger-text" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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

export default CurrencyInput;
