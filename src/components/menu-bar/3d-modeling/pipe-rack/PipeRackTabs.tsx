import React, { FunctionComponent, useEffect, useState } from "react";
import { Button, Popover, Menu, MenuItem } from "@blueprintjs/core";

type Props = { selected: number; onSelect: (name: number) => any };

type DropDownItem = {
  id: number;
  name: string;
  children?: DropDownItem[];
};

const PipeRackTabs: FunctionComponent<Props> = (props) => {
  const { selected, onSelect } = props;

  const [popover, setPopover] = useState<string>();

  useEffect(() => {
    setPopover(undefined);
  }, [selected]);

  function checkActiv(ids: number[]) {
    return ids.find((id) => id === selected) !== undefined ? "active" : "";
  }

  function getTab(id: number, name: string) {
    return (
      <Button
        className={`c-light ${checkActiv([id])}`}
        text={name}
        alignText={"center"}
        outlined
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
    return <MenuItem key={item.name} text={item.name} onClick={() => onSelect(item.id)} />;
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
            className={`c-light ${checkActiv(items.map((item) => item.id))}`}
            onClick={() => setPopover(popover !== tabName ? tabName : undefined)}
            style={{ textAlign: "center" }}
          />
        }
      />
    );
  }

  return (
    <div className="d-flex bg-dark always">
      {getTab(0, "Portals")}
      {getTab(21, "Tier Elevations")}
      {getDropDownTab("Additional Elements", [
        { id: 1, name: "Beams" },
        { id: 22, name: "Columns" },
        { id: 23, name: "Portal Bracings" },
        { id: 2, name: "Plan Bracings" },
      ])}
      {getDropDownTab("Accessories", [
        { id: 3, name: "Accessories" },
        { id: 4, name: "T-Post" },
        { id: 5, name: "F-Post" },
        { id: 6, name: "Christmas Tree" },
      ])}
      {getDropDownTab("Members", [
        {
          id: 7,
          name: "Geometry",
          children: [
            { id: 8, name: "Beams" },
            { id: 9, name: "Columns" },
          ],
        },
        { id: 10, name: "Release" },
      ])}
      {getDropDownTab("Pipes", [
        { id: 11, name: "Pipe Modeling" },
        { id: 24, name: "FEED" },
        { id: 12, name: "Support Modeling" },
      ])}
      {getTab(13, "Platforms")}
      {getTab(14, "Ladders")}
      {getDropDownTab("Base Plate", [
        { id: 15, name: "Circular" },
        { id: 16, name: "Rectangular" },
      ])}
      {getDropDownTab("Splice Flange", [
        { id: 17, name: "Circular" },
        { id: 18, name: "Rectangular" },
      ])}
      {getDropDownTab("User Defined Sections", [
        { id: 19, name: "Fabricated Section" },
        { id: 20, name: "Rolled Section with Plates" },
        { id: 25, name: "Combined Sections" },
      ])}
    </div>
  );
};

export default PipeRackTabs;
