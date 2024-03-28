import React, { useState } from "react";
import { MultiSelector } from "./MultiSelector";
import { Popover } from "@blueprintjs/core";

interface Props<T> {
  items: T[];
  itemKey: (item: T) => string | number;
  itemLabel: (item: T) => string;
  selected: T[];
  onSelect: (items: T[]) => any;
  className?: string;
  contentClassName?: string;
  rowSpan?: number;
  colSpan?: number;
}

export function MultiSelectorCell<T>({
  items,
  selected,
  itemLabel,
  onSelect,
  className,
  contentClassName,
  rowSpan,
  colSpan,
}: Props<T>) {
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
          style: { border: isOpen ? "solid 5px #c8c8c8" : "none" },
        }}
        targetClassName={"h-100p"}
        className={"h-100p"}
        content={
          <MultiSelector<T>
            items={items}
            selected={selected}
            onSelect={(value) => {
              onSelect && onSelect(value);
              setOpen(false);
            }}
            autoFocus={true}
            itemLabel={itemLabel}
            className={`${contentClassName} w-220`}
          />
        }
        target={
          <div className={"d-flex f-center h-100p"} onClick={() => setOpen((prev) => !prev)}>
            {selected
              .map((item) => itemLabel(item))
              .sort((a, b) => a.localeCompare(b))
              .join(", ")}
          </div>
        }
        onClose={() => setOpen(false)}
      />
    </td>
  );
}
