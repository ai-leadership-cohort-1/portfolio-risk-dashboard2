import { RiskCategory } from "@/lib/types";

const STYLES: Record<RiskCategory, string> = {
  Green: "text-[var(--risk-green)] bg-[var(--risk-green-bg)]",
  Amber: "text-[var(--risk-amber)] bg-[var(--risk-amber-bg)]",
  Red: "text-[var(--risk-red)] bg-[var(--risk-red-bg)]",
};

const LABELS: Record<RiskCategory, string> = {
  Green: "Green · Low Risk",
  Amber: "Amber · Medium Risk",
  Red: "Red · High Risk",
};

export default function RiskBadge({ category }: { category: RiskCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[category]}`}
    >
      {LABELS[category]}
    </span>
  );
}
