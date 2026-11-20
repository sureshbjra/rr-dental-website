import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "font-ui inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full transition-[background-color,border-color,color,box-shadow] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The one loud element on any screen.
        default:
          "bg-cyan text-navy shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_30px_-10px_rgb(56_189_248/0.65)] hover:bg-mist",
        // Quiet companion on dark.
        outline: "border border-mist/25 text-mist hover:border-mist/70 hover:bg-mist/[0.06]",
        // For the light (Mist) chapter.
        inverse: "bg-navy text-mist shadow-[0_12px_30px_-14px_rgb(7_27_53/0.7)] hover:bg-ocean",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        ghost: "hover:bg-mist/[0.08]",
        link: "link-draw rounded-none px-0 py-2 text-current",
      },
      size: {
        default: "h-12 px-6 text-[0.9375rem]",
        sm: "h-10 px-5 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "size-11",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

/** Label that rolls up on hover / focus (pure CSS, see `.roll` in globals.css). */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span data-label={children}>{children}</span>
    </span>
  );
}

export { Button, Roll, buttonVariants };
