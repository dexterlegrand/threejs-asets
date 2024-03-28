import React, { useState } from "react";
import { Popover } from "@blueprintjs/core";
import { SimpleInput } from "./SimpleInput";

export interface InputCellProps {
  value?: string;
  onChange?: (value: string) => any;
  className?: string;
  targetClassName?: string;
  rowSpan?: number;
  colSpan?: number;
  disabled?: boolean;
}

export function InputCell(props: InputCellProps) {
  const { value, onChange, className, targetClassName, rowSpan, colSpan, disabled } = props;

  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <td className={className} rowSpan={rowSpan} colSpan={colSpan}>
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
          <SimpleInput
            autoFocus={true}
            value={props.value}
            onChange={(v) => {
              v && onChange && value !== v && onChange(v);
              setOpen(false);
            }}
          />
        }
        target={
          <div
            className={`d-flex f-center h-100p ${targetClassName}`}
            onClick={() => !disabled && setOpen((prev) => !prev)}
          >
            {props.value ?? null}
          </div>
        }
        onClose={() => setOpen(false)}
      />
    </td>
  );
}
