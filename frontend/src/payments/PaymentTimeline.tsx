import { PaymentScheduleView } from "./PaymentScheduleView";

interface PaymentTimelineProps {
  loanId: string;
  userRole?: string;
}

export function PaymentTimeline({ loanId, userRole }: PaymentTimelineProps) {
  return (
    <div data-testid="payment-timeline">
      <PaymentScheduleView loanId={loanId} userRole={userRole} />
    </div>
  );
}

export default PaymentTimeline;
