import React, { useState } from "react";
import { Popover } from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import {
  convertStrToDate,
  getFullDate,
} from "../../pages/dashboard/dashboard-utils";
import { SimpleInput } from "./SimpleInput";

export interface DateTimeCellProps {
  value?: Date;
  onChange?: (value?: Date) => any;
  className?: string;
  targetClassName?: string;
  rowSpan?: number;
  colSpan?: number;
  disabled?: boolean;
}

export function DateTimeCell(props: DateTimeCellProps) {
  const {
    value,
    onChange,
    className,
    targetClassName,
    rowSpan,
    colSpan,
    disabled,
  } = props;

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
          <>
            <SimpleInput
              placeholder={"dd/mm/yyyy"}
              value={getFullDate(value)}
              onChange={(date) => {
                onChange && onChange(convertStrToDate(date));
              }}
            />
            <br />
            <DatePicker
              canClearSelection={true}
              highlightCurrentDay={true}
              showActionsBar={true}
              shortcuts={true}
              value={value}
              onChange={(date) => {
                date.setHours(0);
                date.setMinutes(0);
                onChange && onChange(date);
              }}
            />
          </>
        }
        target={
          <div
            className={`d-flex f-center h-100p ${targetClassName}`}
            onClick={() => !disabled && setOpen((prev) => !prev)}
          >
            {getFullDate(value)}
          </div>
        }
        onClose={() => setOpen(false)}
      />
    </td>
  );
}
