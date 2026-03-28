import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiGet } from "@/api/client";
import type { User } from "@/api/types";

interface BorrowerSelectProps {
  value: string;
  onChange: (userId: string, userName: string) => void;
  error?: string;
}

export function BorrowerSelect({ value, onChange, error }: BorrowerSelectProps) {
  const [search, setSearch] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await apiGet<{ items: User[] }>(
          `/users/borrowers?search=${encodeURIComponent(search)}`,
        );
        setResults(data.items ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onChange(user.id, user.name);
    setDisplayName(user.name);
    setSearch("");
    setOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onChange("", "");
    setDisplayName("");
    setSearch("");
    setResults([]);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label
        htmlFor="borrower-select"
        className="text-text-secondary text-[13px] font-medium font-body"
      >
        Borrower
      </label>

      {value && displayName ? (
        <div
          data-testid="selected-borrower"
          className="flex items-center justify-between rounded-input border border-border-strong px-4 py-3 bg-background"
        >
          <span className="font-body text-[15px] text-text-primary">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear borrower"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id="borrower-select"
            type="text"
            value={search}
            onChange={(e) => {
              const newSearch = e.target.value;
              setSearch(newSearch);
              if (!newSearch.trim()) {
                setResults([]);
              }
            }}
            placeholder="Select a family member"
            className={`w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${error ? "border-danger-text" : ""}`}
          />
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-card shadow-modal max-h-48 overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  data-testid="borrower-option"
                  onClick={() => handleSelect(user)}
                  className="w-full text-left px-4 py-2.5 font-body text-sm text-text-primary hover:bg-background transition-colors"
                >
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          data-testid="error-borrower_id"
          className="text-danger-text text-xs font-body"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default BorrowerSelect;
