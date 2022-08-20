import classNames from "classnames";
import React, { PropsWithChildren, useState } from "react";
import * as RadixToggle from "@radix-ui/react-toggle";
import type * as Polymorphic from "@radix-ui/react-polymorphic";

type ToggleComponent = Polymorphic.ForwardRefComponent<
  Polymorphic.IntrinsicElement<typeof RadixToggle.Root>,
  Polymorphic.OwnProps<typeof RadixToggle.Root> &
    PropsWithChildren<{
      toggleClass?: string;
    }>
>;

export const IconToggle = React.forwardRef(
  (
    {
      defaultPressed,
      pressed,
      onPressedChange,
      disabled,
      children,
      className,
      toggleClass,
    },
    ref
  ) => {
    const [on, setOn] = useState(defaultPressed);
    const isControlled = !!onPressedChange;
    const proxyPressed = isControlled ? pressed : on;
    const proxyOnPressedChange = isControlled ? onPressedChange : setOn;
    const depressedColor = toggleClass ?? "text-white bg-pink-500";

    return (
      <RadixToggle.Root
        className={classNames(
          "flex items-center justify-center default-ring rounded-full",
          // disabled && proxyPressed && "text-gray-300 bg-gray-50",
          disabled
            ? "text-gray-300 bg-gray-50"
            : proxyPressed && "text-gray-600 bg-gray-100",
          !proxyPressed && depressedColor,
          className
        )}
        pressed={proxyPressed}
        onPressedChange={proxyOnPressedChange}
        disabled={disabled}
        ref={ref}
      >
        {children}
      </RadixToggle.Root>
    );
  }
) as ToggleComponent;
