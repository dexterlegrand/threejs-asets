import React, { useState, useEffect } from "react";
import { InputGroup } from "@blueprintjs/core";

interface Props {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => any;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SimpleInput(props: Props) {
  const {
    value,
    placeholder,
    onChange,
    autoFocus,
    disabled,
    className,
  } = props;

  const [insideValue, setInsideValue] = useState<string>("");

  useEffect(() => {
    setInsideValue(value ?? "");
  }, [value]);

  return (
    <InputGroup
      fill
      small
      autoFocus={autoFocus}
      value={insideValue}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        setInsideValue(event.currentTarget.value)
      }
      onBlur={() => {
        value !== insideValue && onChange && onChange(insideValue);
      }}
      onKeyDown={(event) => {
        if (event.keyCode === 13) {
          value !== insideValue && onChange && onChange(insideValue);
        }
      }}
    />
  );
}
