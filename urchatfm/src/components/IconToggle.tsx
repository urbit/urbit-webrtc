import classNames from 'classnames';
import React, { PropsWithChildren, useState } from 'react';
import * as RadixToggle from '@radix-ui/react-toggle';
import type * as Polymorphic from '@radix-ui/react-polymorphic';

type ToggleComponent = Polymorphic.ForwardRefComponent<
  Polymorphic.IntrinsicElement<typeof RadixToggle.Root>,
  Polymorphic.OwnProps<typeof RadixToggle.Root> & PropsWithChildren<{
    //toggleClass?: string;
  }>
>;

export const IconToggle = React.forwardRef(
  (
    { defaultPressed, pressed, onPressedChange, disabled, children, className },
    ref
  ) => {
    const [on, setOn] = useState(defaultPressed);
    const isControlled = !!onPressedChange;
    const proxyPressed = isControlled ? pressed : on;
    const proxyOnPressedChange = isControlled ? onPressedChange : setOn;

    return (
      <RadixToggle.Root
        className={classNames(
          'flex items-center justify-center default-ring rounded-full',
          disabled && proxyPressed && 'text-gray-400 bg-gray-700',
          !proxyPressed && 'text-gray-200 bg-gray-400',
          proxyPressed && 'text-pink-900 bg-pink-500',
          className
        )}
        pressed={proxyPressed}
        onPressedChange={proxyOnPressedChange}
        disabled={disabled}
        ref={ref}
      >
        { children }
      </RadixToggle.Root>
    );
  }
) as ToggleComponent;