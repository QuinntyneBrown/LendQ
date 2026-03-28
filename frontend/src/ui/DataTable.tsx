import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  sortColumn,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                data-sortable={col.sortable || undefined}
                className={`px-4 py-3 text-left text-[13px] font-medium font-body text-text-secondary ${col.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortColumn === col.key ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={14} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={14} aria-hidden="true" />
                    )
                  ) : col.sortable ? (
                    <ArrowUpDown size={14} className="text-text-muted" aria-hidden="true" />
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
