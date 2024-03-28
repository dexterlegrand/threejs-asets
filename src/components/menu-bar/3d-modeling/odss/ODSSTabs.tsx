import React, { FunctionComponent, useEffect, useState } from "react";
import { Button, Popover, Menu, MenuItem } from "@blueprintjs/core";

type OwnProps = { selected: number; onSelect: (id: number) => any };

type Props = OwnProps;

type DropDownItem = {
  id: number;
  name: string;
  children?: DropDownItem[];
};

const ODSSTabs: FunctionComponent<Props> = (props) => {
  const { selected, onSelect } = props;

  const [popover, setPopover] = useState<string>();

  useEffect(() => {
    setPopover(undefined);
  }, [selected]);

  function checkActiv(items: DropDownItem[]) {
    return items.find((item) => item.id === selected) ? "active" : "";
  }

  function getTab(id: number, name: string, disabled?: boolean) {
    return (
      <Button
        className={`c-light ${checkActiv([{ id, name }])}`}
        text={name}
        alignText={"center"}
        outlined
        disabled={disabled}
        onClick={() => onSelect(id)}
        style={{ textAlign: "center" }}
      />
    );
  }

  function getDropDownItem(item: DropDownItem) {
    if (item.children) {
      return (
        <MenuItem key={item.name} text={item.name}>
          {item.children.map((child) => getDropDownItem(child))}
        </MenuItem>
      );
    }
    return (
      <MenuItem
        key={item.name}
        text={item.name}
        onClick={() => onSelect(item.id)}
      />
    );
  }

  function getDropDownTab(tabName: string, items: DropDownItem[]) {
    return (
      <Popover
        autoFocus={false}
        position="bottom-left"
        isOpen={popover === tabName}
        onClose={() => setPopover(undefined)}
        content={<Menu>{items.map((item) => getDropDownItem(item))}</Menu>}
        target={
          <Button
            text={tabName}
            outlined
            className={`c-light ${checkActiv(items)}`}
            onClick={() =>
              setPopover(popover !== tabName ? tabName : undefined)
            }
            style={{ textAlign: "center" }}
          />
        }
      />
    );
  }

  return (
    <div className="d-flex bg-dark always">
      {getDropDownTab("Members", [
        { id: 0, name: "Geometry" },
        { id: 1, name: "Releases" },
      ])}
      {getDropDownTab("Connections", [
        {
          id: 2,
          name: "Base Plates",
          children: [
            // { id: 34, name: "Circular" },
            { id: 3, name: "Rectangular" },
          ],
        },
        {
          id: 4,
          name: "Splice Flanges",
          children: [
            // { id: 36, name: "Circular" },
            { id: 5, name: "Rectangular" },
          ],
        },
        { id: 6, name: "Beam To Beam" },
        { id: 7, name: "Beam To Column" },
        { id: 8, name: "Horizontal Bracings" },
        { id: 9, name: "Vertical Bracings" },
        { id: 10, name: "Knee Bracings" },
      ])}
      {getTab(11, "User Def. Sec. Staad")}
    </div>
  );
};

export default ODSSTabs;
