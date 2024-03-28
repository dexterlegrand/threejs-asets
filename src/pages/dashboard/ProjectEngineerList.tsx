import { Button } from "@blueprintjs/core";
import React from "react";
import { getNextId } from "../../components/3d-models/utils";
import {
  EDashboardCheckType,
  TDashboardEngineerGroup,
} from "../../store/main/types";
import "./Dashboard.css";
import ProjectEngineer from "./ProjectEngineer";

type Props = {
  list: TDashboardEngineerGroup[];
  onChange: (list: TDashboardEngineerGroup[]) => any;
};

export default function ProjectEngineerList({ list, onChange }: Props) {
  const handleAddItem = () => {
    const id = getNextId(list);
    onChange([
      ...list,
      {
        id,
        header: `New Engineers Group ${id}`,
        engineers: [],
      },
    ]);
  };

  const handleChangeItem = (
    item: TDashboardEngineerGroup,
    field: string,
    val: any
  ) => {
    onChange(
      list.map((l) => (l.id === item.id ? { ...item, [field]: val } : l))
    );
  };

  const handleDelete = (item: TDashboardEngineerGroup) => {
    onChange(list.filter((l) => l.id !== item.id));
  };

  return (
    <div className={"dashboard-checklist"}>
      {list.map((item) => (
        <ProjectEngineer
          key={item.id}
          item={item}
          onChange={handleChangeItem}
          onDelete={handleDelete}
        />
      ))}
      <Button
        outlined
        className="button-primary-b1l"
        icon={"plus"}
        onClick={handleAddItem}
        style={{ width: "20vw", marginBottom: 10, backgroundColor: "#4b4b4b" }}
      />
    </div>
  );
}
