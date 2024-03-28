import React, { useEffect, CSSProperties, useMemo, useState } from "react";
import { SimpleNumericInput } from "./SimpleNumericInput";
import { Popover } from "@blueprintjs/core";

export interface NumericCellProps {
  value?: number;
  onChange?: (value: number) => any;
  rowSpan?: number;
  colSpan?: number;
  className?: string;
  min?: number;
  max?: number;
  isDecimal?: boolean;
  noRound?: boolean;
  accuracy?: number;
  disabled?: boolean;
  style?: CSSProperties;
}

export function NumericCell(props: NumericCellProps) {
  const [isOpen, setOpen] = useState<boolean>(false);

  const disabled = useMemo(() => {
    return !(props.onChange && !props.disabled);
  }, [props.onChange, props.disabled]);

  useEffect(() => {
    if (props.min === undefined || disabled) return;
    fixByMin(props.value, props.min);
  }, [props.value, props.min, disabled]);

  useEffect(() => {
    if (props.max === undefined || disabled) return;
    fixByMax(props.value, props.max);
  }, [props.value, props.max, disabled]);

  function fixByMin(value: number | undefined, min: number) {
    if (value === undefined || value < min) {
      props.onChange && props.onChange(min);
    }
  }

  function fixByMax(value: number | undefined, max: number) {
    if (value === undefined || value > max) {
      props.onChange && props.onChange(max);
    }
  }

  function fixValue(value: number | undefined) {
    if (value === undefined || value === null || isNaN(value)) return "0";
    if (`${value}`.includes(".")) {
      const afterDot = `${value}`.length - `${value}`.indexOf(".") - 1;
      return value.toFixed(afterDot > 3 ? 3 : afterDot);
    }
    return `${value}`;
  }

  return (
    <td
      style={props.style}
      className={props.className}
      rowSpan={props.rowSpan}
      colSpan={props.colSpan}
    >
      <Popover
        fill={true}
        minimal={true}
        isOpen={isOpen}
        position={"bottom"}
        boundary={"viewport"}
        popoverClassName={"p-5 bg-gray"}
        targetProps={{
          style: { border: isOpen ? "solid 1px #c8c8c8" : "none" },
        }}
        targetClassName={"h-100p"}
        className={"h-100p"}
        disabled={disabled}
        content={
          <SimpleNumericInput
            min={props.min}
            max={props.max}
            autoFocus={true}
            value={props.value}
            onChange={(value) => {
              props.onChange && props.onChange(value);
              setOpen(false);
            }}
            isDecimal={props.isDecimal}
            noRound={props.noRound}
            accuracy={props.accuracy}
          />
        }
        target={
          <div
            className={"d-flex f-center h-100p"}
            onClick={() => !disabled && setOpen((prev) => !prev)}
          >
            {props.value !== undefined ? fixValue(props.value) : undefined}
          </div>
        }
        onClose={() => setOpen(false)}
      />
    </td>
  );
}
