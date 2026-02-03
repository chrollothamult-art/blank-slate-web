import { forwardRef, ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: ReactNode;
  label: string;
  showTooltip?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showTooltip = true, tooltipSide = "top", ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label={label}
        {...props}
      >
        {icon}
      </Button>
    );

    if (!showTooltip) return button;

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

IconButton.displayName = "IconButton";
