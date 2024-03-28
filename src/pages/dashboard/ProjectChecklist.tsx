import { Button } from "@blueprintjs/core";
import React from "react";
import { getNextId } from "../../components/3d-models/utils";
import { TDashboardCheckItem } from "../../store/main/types";
import ProjectCheckItem from "./ProjectCheckItem";
import "./dashboard_css/ProjectChecklist.css";

type Props = {
  list: TDashboardCheckItem[];
  onChange: (list: TDashboardCheckItem[]) => any;
};

export default function ProjectChecklist({ list, onChange }: Props) {
  const handleAddItem = () => {
    const id = getNextId(list);
    onChange([...list, { id, header: `New Item ${id}`, tasks: [] }]);
  };

  const handleChangeItem = (
    item: TDashboardCheckItem,
    field: string,
    val: any
  ) => {
    onChange(
      list.map((l) => (l.id === item.id ? { ...item, [field]: val } : l))
    );
  };

  const handleDelete = (item: TDashboardCheckItem) => {
    onChange(list.filter((l) => l.id !== item.id));
  };

  return (
    <div className={"dashboard-checklist"}>
      {list.map((item) => (
        <ProjectCheckItem
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
