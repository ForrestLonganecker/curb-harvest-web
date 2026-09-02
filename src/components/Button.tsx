import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]",
  secondary:
    "rounded-full border border-solid border-black/[.08] px-5 py-2.5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]",
};

function variantClassName(variant: Variant, className?: string) {
  return [VARIANT_STYLES[variant], className].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={variantClassName(variant, className)} {...props} />;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
}

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <a className={variantClassName(variant, className)} {...props} />;
}
