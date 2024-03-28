import { Button } from "@blueprintjs/core";
import React from "react";

type Props = {
  selected: number;
  onSelect: (id: number) => any;
};

export default function FlareHeader({ selected, onSelect }: Props) {
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

  return <div className="d-flex bg-dark always">{getTab(0, "General")}</div>;
}
