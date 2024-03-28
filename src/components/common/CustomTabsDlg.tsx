import React, { useEffect, useState } from "react";
import { Button, Popover, Menu, MenuItem } from "@blueprintjs/core";
import { TDropDownItem } from "../../store/ui/types";

type Props = {
  tabs: TDropDownItem[];
  selected: number;
  onSelect: (id: number) => any;
};

export function CustomTabsDlg(props: Props) {
  const { tabs, selected, onSelect } = props;

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
        key={`${name}-${id}`}
        id={`${name}-${id}`}
        outlined
        text={name}
        alignText={"center"}
        onClick={() => onSelect(id)}
        className={`c-light ${checkActiv([id])}`}
        style={{ textAlign: "center" }}
      />
    );
  }

  function getDropDownItem(item: TDropDownItem) {
    if (item.children) {
      return (
        <MenuItem key={item.name} text={item.name}>
          {item.children.map((child) => getDropDownItem(child))}
        </MenuItem>
      );
    }
    return <MenuItem key={item.name} text={item.name} onClick={() => onSelect(item.id)} />;
  }

  function getDropDownTab(tabName: string, ids: number[], items: TDropDownItem[]) {
    return (
      <Popover
        key={`Popover-${tabName}`}
        autoFocus={false}
        position="bottom-left"
        isOpen={popover === tabName}
        onClose={() => setPopover(undefined)}
        content={<Menu>{items.map((item) => getDropDownItem(item))}</Menu>}
        target={
          <Button
            key={tabName}
            text={tabName}
            outlined
            className={`c-light ${checkActiv(ids)}`}
            onClick={() => setPopover(popover !== tabName ? tabName : undefined)}
            style={{ textAlign: "center" }}
          />
        }
      />
    );
  }

  function getTabs(tabs: TDropDownItem[]) {
    return tabs.map((tab) => {
      if (tab.children) {
        return getDropDownTab(
          tab.name,
          tab.children.map((child) => child.id),
          tab.children
        );
      } else return getTab(tab.id, tab.name);
    });
  }

  return <div className="d-flex bg-dark always">{getTabs(tabs)}</div>;
}
