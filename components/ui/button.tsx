import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const button = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-brand text-black shadow-lg shadow-brand/30 hover:bg-white",
        outline:
          "border border-line bg-card text-ink hover:border-brand hover:text-brand",
      },
      size: { md: "h-11 px-6 text-sm", lg: "h-12 px-8 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof button> {
  asChild?: boolean;
}
export function Button({
  className,
  variant,
  size,
  asChild,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(button({ variant, size }), className)} {...props}>
      {children}
    </Comp>
  );
}
