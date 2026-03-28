import { useState } from "react";
import { Toggle } from "@/ui";
import { apiPut } from "@/api/client";

interface Preferences {
  payment_due: boolean;
  payment_overdue: boolean;
  payment_received: boolean;
  schedule_changes: boolean;
  loan_modified: boolean;
}

const defaultPreferences: Preferences = {
  payment_due: true,
  payment_overdue: true,
  payment_received: true,
  schedule_changes: true,
  loan_modified: true,
};

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);

  function handleChange(key: keyof Preferences, checked: boolean) {
    const updated = { ...prefs, [key]: checked };
    setPrefs(updated);
    apiPut("/notifications/preferences", updated);
  }

  return (
    <div data-testid="notification-preferences" className="space-y-4">
      <Toggle
        label="Payment Due"
        description="Get notified when a payment is coming due"
        checked={prefs.payment_due}
        onChange={(checked) => handleChange("payment_due", checked)}
      />
      <Toggle
        label="Payment Overdue"
        description="Get notified when a payment is overdue"
        checked={prefs.payment_overdue}
        onChange={(checked) => handleChange("payment_overdue", checked)}
      />
      <Toggle
        label="Payment Received"
        description="Get notified when a payment is received"
        checked={prefs.payment_received}
        onChange={(checked) => handleChange("payment_received", checked)}
      />
      <Toggle
        label="Schedule Changes"
        description="Get notified when a payment schedule changes"
        checked={prefs.schedule_changes}
        onChange={(checked) => handleChange("schedule_changes", checked)}
      />
      <Toggle
        label="Loan Modified"
        description="Get notified when loan details are modified"
        checked={prefs.loan_modified}
        onChange={(checked) => handleChange("loan_modified", checked)}
      />
    </div>
  );
}
