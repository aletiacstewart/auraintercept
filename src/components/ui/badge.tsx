import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        pending: "bg-warning/10 text-warning border-warning/30",
        accepted: "bg-secondary/10 text-secondary border-secondary/30",
        "in-progress": "bg-accent/10 text-accent border-accent/30",
        completed: "bg-secondary/10 text-secondary border-secondary/30",
        cancelled: "bg-destructive/10 text-destructive border-destructive/30",
        scheduled: "bg-primary/10 text-primary border-primary/30",
        // Channel variants  
        voice: "bg-channel-voice/10 text-channel-voice border-channel-voice/30",
        sms: "bg-channel-sms/10 text-channel-sms border-channel-sms/30",
        email: "bg-channel-email/10 text-channel-email border-channel-email/30",
        chat: "bg-channel-chat/10 text-channel-chat border-channel-chat/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
