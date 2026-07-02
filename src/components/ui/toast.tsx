import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Top center on mobile, top right on desktop — visible without covering nav actions
      "fixed left-1/2 top-0 z-[100] flex max-h-screen w-full max-w-[420px] -translate-x-1/2 flex-col gap-3 p-4 sm:left-auto sm:right-0 sm:translate-x-0",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  // Premium card: bg-card, rounded-2xl, soft layered shadow, 3px accent bar on the left (via ::before)
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 pr-12 text-card-foreground shadow-toast transition-all before:absolute before:inset-y-0 before:left-0 before:w-[3px] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out data-[swipe=end]:animate-toast-out",
  {
    variants: {
      variant: {
        default: "before:bg-primary",
        success: "success before:bg-success",
        destructive: "destructive before:bg-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/* Icon chip inferred from variant — no new required props */
const toastIconChipVariants = cva("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      destructive: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const toastIcons = {
  default: CheckCircle2,
  success: CheckCircle2,
  destructive: AlertTriangle,
} as const;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  const Icon = toastIcons[variant ?? "default"];
  return (
    <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
      <span aria-hidden="true" className={toastIconChipVariants({ variant })}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      {children}
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center self-center rounded-xl border border-border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-destructive/30 group-[.destructive]:text-destructive group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus-visible:ring-destructive",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // 44px touch target; always visible on touch, revealed on hover/focus on desktop
      "absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground/70 transition-opacity hover:bg-muted/50 hover:text-foreground focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 sm:opacity-0",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-5 tracking-tight text-foreground", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm leading-5 text-muted-foreground", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
