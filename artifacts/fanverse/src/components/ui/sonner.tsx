import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    position="bottom-right"
    gap={8}
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl",
        description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
        actionButton:
          "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-heading uppercase tracking-wide text-xs",
        cancelButton:
          "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
        closeButton:
          "group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-muted-foreground",
      },
    }}
    {...props}
  />
);

export { Toaster };
