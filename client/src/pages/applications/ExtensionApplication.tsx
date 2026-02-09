import { ApplicationShell } from "./ApplicationShell";

export default function ExtensionApplication() {
  return (
    <ApplicationShell
      title="Extension Application"
      description="Request an extension for your Ph.D. duration."
    >
      <div className="text-center text-muted-foreground">
        Form content will be added here.
      </div>
    </ApplicationShell>
  );
}
