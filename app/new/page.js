import Button from "@/components/Button";

// New-ticket form. The fields are styled but the form does not submit anywhere
// this week (no backend yet). Wiring it up comes in a later lab.
export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New ticket</h1>
        <p className="text-sm text-ink-soft">
          Log a support request on behalf of a customer.
        </p>
      </div>

      <form className="space-y-5 rounded-card border border-border bg-surface p-6">
        <Field label="Customer name" htmlFor="name">
          <input
            id="name"
            type="text"
            placeholder="e.g. Aoife Byrne"
            className="form-input"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            placeholder="customer@example.com"
            className="form-input"
          />
        </Field>

        <Field label="Subject" htmlFor="subject">
          <input
            id="subject"
            type="text"
            placeholder="Short summary of the issue"
            className="form-input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority" htmlFor="priority">
            <select id="priority" className="form-input">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </Field>
          <Field label="Channel" htmlFor="channel">
            <select id="channel" className="form-input">
              <option>Email</option>
              <option>Chat</option>
              <option>Phone</option>
              <option>Web form</option>
            </select>
          </Field>
        </div>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the problem…"
            className="form-input resize-none"
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" type="submit">
            Create ticket
          </Button>
        </div>
      </form>
    </div>
  );
}

// Small label + control wrapper so every field looks consistent.
function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
