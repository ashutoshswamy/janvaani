import { Card, InfoBox, PageTitle } from "@/components/ui";

const SETTINGS = [
  ["Auto-cluster similar requests", true],
  ["Mask citizen phone numbers", true],
] as const;

// ponytail: visual-only settings, nothing persists in the demo.
export default function Settings() {
  return (
    <div className="fade-in max-w-2xl">
      <PageTitle title="Settings" />
      <InfoBox className="mb-4">These switches are placeholders for the pilot. Changes are not saved and have no effect yet.</InfoBox>
      <Card className="divide-y divide-slate-100">
        {SETTINGS.map(([label, on]) => (
          <label key={label} className="flex cursor-pointer items-center justify-between p-4 text-sm">
            {label}
            <input type="checkbox" defaultChecked={on} className="size-4 accent-orange-500" />
          </label>
        ))}
      </Card>
    </div>
  );
}
