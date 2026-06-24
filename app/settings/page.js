import Button from "@/components/Button";

// Settings page. Controls are visual only this week. The "Appearance" section
// is a handy place to talk about where theme tokens live (globals.css).
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-ink-soft">
          Manage your workspace preferences.
        </p>
      </div>

      <Section
        title="Appearance"
        description="The brand colour comes from the design tokens in app/globals.css. Change it there to re-theme the whole app (Exercise 1)."
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">Brand colour</span>
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-5 w-5 rounded-full bg-brand" />
            Indigo
          </span>
        </div>
      </Section>

      <Section
        title="Notifications"
        description="Choose what you get pinged about."
      >
        <Toggle label="Email me when a ticket is assigned to me" defaultChecked />
        <Toggle label="Email me on customer replies" defaultChecked />
        <Toggle label="Weekly summary report" />
      </Section>

      <Section
        title="Profile"
        description="How you appear to teammates."
      >
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Name</span>
          <span className="font-medium">Agent Demo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Email</span>
          <span className="font-medium">agent@hd-helpdesk.test</span>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button variant="primary">Save changes</Button>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-ink-soft">{description}</p>
      ) : null}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

// A simple styled checkbox row. Functional toggling needs state (a later week).
function Toggle({ label, defaultChecked }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border accent-brand"
      />
      {label}
    </label>
  );
}
