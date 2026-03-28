import { NotificationPreferences } from "@/notifications/NotificationPreferences";

export function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-text-primary">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Notification Preferences</h2>
        <div className="bg-surface rounded-card border border-border p-6">
          <NotificationPreferences />
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
