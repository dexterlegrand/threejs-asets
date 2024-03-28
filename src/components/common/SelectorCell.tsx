import React, { useState } from "react";
import { SimpleSelector } from "./SimpleSelector";
import { ValueValidator } from "./ValueValidator";
import { Popover } from "@blueprintjs/core";

export interface SelectorCellProps<T> {
  items: T[];
  itemKey?: (item: T) => string | number;
  itemLabel: (item: T) => string;
  itemSecondLabel?: (item: T) => string;
  selected: T | undefined;
  onSelect: (item?: T) => any;
  onCreate?: (item: string) => any;
  validator?: (value: any) => boolean;
  validationPrompt?: string;
  filterable?: boolean;
  filter?: (query: string, item: T) => boolean;
  className?: string;
  contentClassName?: string;
  rowSpan?: number;
  colSpan?: number;
  disabled?: boolean;
  clearable?: boolean;
}

export function SelectorCell<T>({
  items,
  selected,
  itemLabel,
  itemSecondLabel,
  onSelect,
  onCreate,
  validator,
  validationPrompt,
  filter,
  className,
  contentClassName,
  rowSpan,
  colSpan,
  disabled,
  clearable,
}: SelectorCellProps<T>) {
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <td className={className} rowSpan={rowSpan} colSpan={colSpan}>
      <Popover
        fill={true}
        minimal={true}
        isOpen={isOpen}
        position={"bottom"}
        boundary={"viewport"}
        popoverClassName={"p-5 bg-gray w-mc"}
        targetProps={{
          style: { border: isOpen ? "solid 1px #c8c8c8" : "none" },
        }}
        targetClassName={"h-100p"}
        className={"h-100p"}
        disabled={disabled}
        content={
          <SimpleSelector<T>
            items={items}
            selected={selected}
            onSelect={(value) => {
              onSelect(value);
              setOpen(false);
            }}
            onCreate={onCreate}
            autoFocus={true}
            itemLabel={itemLabel}
            itemSecondLabel={itemSecondLabel}
            className={`${contentClassName} w-220`}
            clearable={clearable}
            filter={filter}
          />
        }
        target={
          <ValueValidator
            value={selected}
            valueFormater={itemLabel}
            validator={validator}
            validationPrompt={validationPrompt}
            onClick={() => !disabled && setOpen((prev) => !prev)}
          />
        }
        onClose={() => setOpen(false)}
      />
    </td>
  );
}
