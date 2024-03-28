import React, { FunctionComponent, useEffect, useState } from "react";
import { Button, Popover, Menu, MenuItem } from "@blueprintjs/core";

type OwnProps = { selected: number; onSelect: (id: number) => any };

type Props = OwnProps;

type DropDownItem = {
  id: number;
  name: string;
  children?: DropDownItem[];
};

const FactoryShedTabs: FunctionComponent<Props> = (props) => {
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
            className={`c-light ${checkActiv(items)}`}
            onClick={() => setPopover(popover !== tabName ? tabName : undefined)}
            style={{ textAlign: "center" }}
          />
        }
      />
    );
  }

  return (
    <div className="d-flex bg-dark always">
      {getTab(0, "Frames")}
      {getTab(20, "Elements Elevations")}
      {getDropDownTab("Additional Elements", [
        { id: 1, name: "Cantilever" },
        { id: 2, name: "Column To Column" },
        { id: 21, name: "Column To Beam" },
        { id: 4, name: "Beam To Beam" },
        { id: 3, name: "Columns" },
        { id: 5, name: "Knee Bracings" },
        { id: 6, name: "Vertical Bracings" },
        { id: 7, name: "Plan Bracings" },
      ])}
      {getDropDownTab("Accessories", [
        { id: 24, name: "Accessories" },
        { id: 25, name: "T-Post" },
        { id: 26, name: "F-Post" },
        { id: 27, name: "Christmas Tree" },
      ])}
      {getDropDownTab("Members", [
        {
          id: 8,
          name: "Geometry",
          children: [
            { id: 9, name: "Beams" },
            { id: 10, name: "Columns" },
          ],
        },
        { id: 11, name: "Release" },
      ])}
      {getDropDownTab("Pipes", [
        {
          id: 22,
          name: "Pipe Modeling",
        },
        {
          id: 28,
          name: "FEED",
        },
        {
          id: 23,
          name: "Support Modeling",
        },
      ])}
      {getTab(12, "Platforms")}
      {getDropDownTab("Roof/Cladding", [
        { id: 31, name: "Truss" },
        { id: 32, name: "Runners" },
        { id: 33, name: "Cladding-Metal" },
        { id: 34, name: "Cladding-Masonry" },
      ])}
      {getTab(29, "Stairs")}
      {getDropDownTab("Base Plate", [
        { id: 14, name: "Circular" },
        { id: 15, name: "Rectangular" },
      ])}
      {getDropDownTab("Splice Flange", [
        { id: 16, name: "Circular" },
        { id: 17, name: "Rectangular" },
      ])}
      {getDropDownTab("User Defined Sections", [
        { id: 18, name: "Fabricated Section" },
        { id: 19, name: "Rolled Section with Plates" },
        { id: 30, name: "Combined Sections" },
      ])}
    </div>
  );
};

export default FactoryShedTabs;
