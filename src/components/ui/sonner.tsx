import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:p-4 group-[.toaster]:text-card-foreground group-[.toaster]:shadow-toast",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:tracking-tight",
          description: "group-[.toast]:text-sm group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-xl group-[.toast]:bg-primary group-[.toast]:font-medium group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-xl group-[.toast]:bg-muted group-[.toast]:font-medium group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-card group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-destructive",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
