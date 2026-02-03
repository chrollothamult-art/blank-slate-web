import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info } from "lucide-react";

type DialogVariant = "danger" | "warning" | "info";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    confirmClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    confirmClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  info: {
    icon: Info,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    confirmClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
};

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.iconBg}`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-muted/50 hover:bg-muted border-border/50
                       transition-all duration-200"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 sm:flex-none transition-all duration-200 ${config.confirmClass}`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
