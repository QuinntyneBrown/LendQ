import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import type { LoanStatus } from "@/api/types";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { Button } from "@/ui/Button";
import { SearchInput } from "@/ui/SearchInput";
import { Select } from "@/ui/Select";
import { Pagination } from "@/ui/Pagination";
import { EmptyState } from "@/ui/EmptyState";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { LoanTable } from "./LoanTable";
import { LoanCardList } from "./LoanCardList";
import { CreateEditLoanModal } from "./CreateEditLoanModal";
import { useLoans } from "./hooks";

const statusFilterOptions = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID_OFF", label: "Paid Off" },
];

export function LoanListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();

  const view = (searchParams.get("view") as "creditor" | "borrower") || "creditor";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useLoans(view, page, search, statusFilter);

  const handleTabChange = (newView: "creditor" | "borrower") => {
    setSearchParams({ view: newView });
    setPage(1);
  };

  const handleRowClick = (loan: { id: string }) => {
    navigate(`/loans/${loan.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          {view === "creditor" ? "Loans" : "Borrowings"}
        </h1>
        {view === "creditor" && (
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Create New Loan
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          role="tab"
          aria-selected={view === "creditor"}
          onClick={() => handleTabChange("creditor")}
          className={`px-4 py-2.5 font-body text-sm font-medium transition-colors border-b-2 ${
            view === "creditor"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          My Loans
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "borrower"}
          onClick={() => handleTabChange("borrower")}
          className={`px-4 py-2.5 font-body text-sm font-medium transition-colors border-b-2 ${
            view === "borrower"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Borrowings
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search loans..."
          />
        </div>
        <div className="w-full sm:w-48" data-testid="status-filter">
          <Select
            label=""
            name="status-filter"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LoanStatus | "");
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={5} className="h-16" />
      ) : !data?.items?.length ? (
        <EmptyState
          icon={FileText}
          title="No loans found"
          description={
            search || statusFilter
              ? "Try adjusting your search or filters."
              : view === "creditor"
                ? "Create your first loan to get started."
                : "You don't have any borrowings yet."
          }
        />
      ) : (
        <>
          {isMobile ? (
            <LoanCardList
              loans={data.items}
              viewMode={view}
              onCardClick={handleRowClick}
            />
          ) : (
            <LoanTable
              loans={data.items}
              viewMode={view}
              onRowClick={handleRowClick}
            />
          )}

          <div className="flex justify-center">
            <Pagination
              page={data.page}
              totalPages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <CreateEditLoanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default LoanListPage;
