import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export function Popover({ children, ...props }) {
  return <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>;
}

export function PopoverTrigger({ children, ...props }) {
  return <PopoverPrimitive.Trigger {...props}>{children}</PopoverPrimitive.Trigger>;
}

export function PopoverContent({ children, ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content {...props}>
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
