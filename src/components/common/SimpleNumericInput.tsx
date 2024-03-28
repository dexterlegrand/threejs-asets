import React, { useState, useEffect } from "react";
import { InputGroup } from "@blueprintjs/core";

interface Props {
  min?: number;
  max?: number;
  value?: number;
  autoFocus?: boolean;
  className?: string;
  onChange?: (value: number) => any;
  onBlur?: () => any;
  isDecimal?: boolean;
  noRound?: boolean;
  accuracy?: number;
  disabled?: boolean;
}

export function SimpleNumericInput(props: Props) {
  const {
    min,
    max,
    value,
    autoFocus,
    className,
    onChange,
    onBlur,
    isDecimal,
    noRound,
    accuracy,
    disabled,
  } = props;
  const [insideValue, setInsideValue] = useState<any>();

  useEffect(() => {
    setInsideValue(value);
  }, [value]);

  useEffect(() => {
    if (disabled || !onChange) return;
    if (min !== undefined && (value === undefined || (value !== undefined && value < min)))
      onChange(min);
  }, [value, min, disabled]);

  useEffect(() => {
    if (disabled || !onChange) return;
    if (max !== undefined && (value === undefined || (value !== undefined && value > max)))
      onChange(max);
  }, [value, max, disabled]);

  function handleValueChange(
    event: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>,
    onChange: (value: number) => any
  ) {
    const valueAsString = event.currentTarget.value;
    let result;
    if (isDecimal) {
      result = parseFloat(
        noRound ? valueAsString : parseFloat(valueAsString).toFixed(accuracy ?? 3)
      );
    } else result = parseInt(valueAsString);
    if (result !== undefined && result !== null && !isNaN(result)) {
      if (min !== undefined && result < min) result = min;
      if (max !== undefined && result > max) result = max;
      if (result === value) {
        setInsideValue(result);
      } else {
        onChange(result);
      }
    } else {
      result = value ?? 0;
      setInsideValue(result);
      onChange(result);
    }
  }

  return (
    <InputGroup
      fill
      small
      disabled={disabled}
      autoFocus={autoFocus}
      className={className}
      value={insideValue}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        setInsideValue(event.target.value);
      }}
      onBlur={(event) => {
        onChange && handleValueChange(event, onChange);
        onBlur && onBlur();
      }}
      onKeyDown={(event) => {
        if (event.keyCode === 13) {
          onChange && handleValueChange(event, onChange);
          onBlur && onBlur();
        }
      }}
    />
  );
}
