import { AlertTriangle, AlertCircle } from "lucide-react";
import { LoreConflict } from "@/hooks/useLoreConflictChecker";

interface Props {
  conflicts: LoreConflict[];
}

export const LoreConflictWarnings = ({ conflicts }: Props) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            conflict.severity === "error"
              ? "bg-destructive/10 border border-destructive/20 text-destructive"
              : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          {conflict.severity === "error" ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-medium">{conflict.message}</p>
            <p className="text-xs opacity-75 mt-0.5">
              Category: {conflict.existingCategory}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
