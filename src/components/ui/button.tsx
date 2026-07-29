"use client";

import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type * as React from "react";
import { Children, isValidElement } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost";
type ButtonSize = "default" | "lg" | "icon";

type ButtonProps = Omit<MuiButtonProps, "variant" | "size"> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  sx,
  ...props
}: ButtonProps) {
  const materialVariant =
    variant === "secondary" ? "outlined" : variant === "ghost" ? "text" : "contained";

  const sharedProps = {
    variant: materialVariant,
    className: cn(className),
    sx: {
      ...(size === "lg" ? { minHeight: 48, px: 3, fontSize: "1rem" } : null),
      ...(size === "icon" ? { minWidth: 44, width: 44, px: 0 } : null),
      ...sx,
    },
    ...props,
  } as const;

  if (asChild) {
    const childNodes = Children.toArray(children);
    const child = childNodes.find((node) => isValidElement(node));
    if (!isValidElement<{ href?: string; target?: string; rel?: string; children?: React.ReactNode }>(child)) {
      throw new Error("Button의 asChild에는 링크 요소 하나가 필요합니다.");
    }

    return (
      <MuiButton
        component="a"
        href={child.props.href}
        target={child.props.target}
        rel={child.props.rel}
        {...sharedProps}
      >
        {child.props.children}
      </MuiButton>
    );
  }

  return <MuiButton {...sharedProps}>{children}</MuiButton>;
}

export { Button };
