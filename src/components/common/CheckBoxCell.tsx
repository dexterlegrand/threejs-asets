import React from "react";
import { Checkbox } from "@blueprintjs/core";

export interface CheckBoxCellProps {
  title?: string;
  cellType?: "th" | "td";
  indeterminate?: boolean;
  value?: boolean;
  onChange?: (value: boolean) => any;
  rowSpan?: number;
  colSpan?: number;
  disabled?: boolean;
}

export function CheckBoxCell({
  title,
  cellType,
  value,
  indeterminate,
  onChange,
  rowSpan,
  colSpan,
  disabled,
}: CheckBoxCellProps) {
  function getCell() {
    const classes = title ? "" : "w-50";
    switch (cellType) {
      case "th":
        return (
          <th className={classes} rowSpan={rowSpan} colSpan={colSpan}>
            {getBody()}
          </th>
        );
      case "td":
      default:
        return (
          <td className={classes} rowSpan={rowSpan} colSpan={colSpan}>
            {getBody()}
          </td>
        );
    }
  }

  function getBody() {
    return (
      <Checkbox
        label={title}
        disabled={disabled}
        checked={value}
        indeterminate={indeterminate}
        className="no-m"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange && onChange(event.currentTarget.checked)
        }
      />
    );
  }

  return getCell();
}
