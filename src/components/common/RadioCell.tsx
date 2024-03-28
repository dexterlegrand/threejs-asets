import React from "react";
import { Radio } from "@blueprintjs/core";

export interface RadioCellProps {
  title?: string;
  cellType?: "th" | "td";
  value?: boolean;
  onChange?: (value: boolean) => any;
  rowSpan?: number;
  colSpan?: number;
  disabled?: boolean;
}

export function RadioCell({
  title,
  cellType,
  value,
  onChange,
  rowSpan,
  colSpan,
  disabled,
}: RadioCellProps) {
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
      <Radio
        label={title}
        disabled={disabled}
        checked={value}
        className="no-m"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange && onChange(event.currentTarget.checked)
        }
      />
    );
  }

  return getCell();
}
