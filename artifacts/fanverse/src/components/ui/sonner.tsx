import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    position="top-right"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl",
        description: "group-[.toast]:text-muted-foreground",
        actionButton:
          "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-heading uppercase tracking-wide text-xs",
        cancelButton:
          "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        title: "group-[.toast]:font-semibold",
      },
    }}
    {...props}
  />
);

export { Toaster };
