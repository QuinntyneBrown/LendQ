import { Calendar } from "lucide-react";

interface DatePickerProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  min?: string;
  max?: string;
}

export function DatePicker({
  label,
  name,
  value,
  onChange,
  error,
  min,
  max,
}: DatePickerProps) {
  const inputId = `datepicker-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <Calendar
          size={18}
          className="absolute left-3 text-text-muted"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          className={`w-full rounded-input border border-border-strong pl-10 pr-4 py-3 font-body text-[15px] text-text-primary outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${error ? "border-danger-text" : ""}`}
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

export default DatePicker;
