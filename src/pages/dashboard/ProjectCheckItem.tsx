import React, { useState } from "react";
import {
  EDashboardCheckType,
  TDashboardCheckItem,
  TDashboardCheckItemTask,
} from "../../store/main/types";
import { Button, Popover } from "@blueprintjs/core";
import { getNextId } from "../../components/3d-models/utils";
import { InputCell } from "../../components/common/InputCell";

import "./dashboard_css/ProjectCheckItem.css";
import { InputDlg } from "../../components/common/InputDlg";

type Props = {
  item: TDashboardCheckItem;
  onChange: (item: TDashboardCheckItem, field: string, val: any) => any;
  onDelete: (item: TDashboardCheckItem) => any;
};

export default function ProjectCheckItem({ item, onChange, onDelete }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  const handleAddTask = () => {
    const id = getNextId(item.tasks);
    onChange(item, "tasks", [
      ...item.tasks,
      { id, type: EDashboardCheckType.NONE, title: `New Task ${id}` },
    ]);
  };

  const handleChangeTask = (
    task: TDashboardCheckItemTask,
    field: string,
    val: any
  ) => {
    onChange(
      item,
      "tasks",
      item.tasks.map((item) =>
        item.id === task.id ? { ...task, [field]: val } : item
      )
    );
  };

  const handleDeleteTask = (task: TDashboardCheckItemTask) => {
    onChange(
      item,
      "tasks",
      item.tasks.filter((item) => item.id !== task.id)
    );
  };

  return (
    <div className={"dashboard-checklist-item-project"}>
      {dlg}
      <div className={"dashboard-checklist-item-header"}>
        <h3
          className={"no-m d-flex f-grow h-100p"}
          onClick={() =>
            setDlg(
              <InputDlg
                title="Change header"
                onClose={(val) => {
                  onChange(item, "header", val);
                  setDlg(undefined);
                }}
              />
            )
          }
        >
          {item.header}
        </h3>
        <Button
          className="white-icon"
          icon={"cross"}
          minimal
          onClick={() => onDelete(item)}
        />
      </div>
      <table className={"dashboard-table-project-check-item"}>
        <tbody>
          {item.tasks.map((task) => {
            return (
              <tr key={task.id}>
                <td>
                  <Popover
                    fill={true}
                    minimal={true}
                    position={"bottom"}
                    boundary={"viewport"}
                    popoverClassName={"p-5 bg-gray"}
                    targetClassName={"h-100p"}
                    className={"h-100p"}
                    content={
                      <>
                        <Button
                          minimal
                          className="white-icon" 
                          icon={"circle"}
                          onClick={() =>
                            handleChangeTask(
                              task,
                              "type",
                              EDashboardCheckType.NONE
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"confirm"}
                          onClick={() =>
                            handleChangeTask(
                              task,
                              "type",
                              EDashboardCheckType.FINISHED
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"delete"}
                          onClick={() =>
                            handleChangeTask(
                              task,
                              "type",
                              EDashboardCheckType.UNFINISHED
                            )
                          }
                        />
                      </>
                    }
                    target={
                      <Button
                        className="white-icon"
                        minimal
                        icon={getButtonIcon(task.type)}
                      />
                    }
                  />
                </td>
                <InputCell
                  value={task.title}
                  className={"w-100p"}
                  onChange={(val) => handleChangeTask(task, "title", val)}
                />
                
                  <Button
                    minimal
                    icon={"delete"}
                    intent={"danger"}
                    onClick={() => handleDeleteTask(task)}
                  />
                
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button
        minimal
        className="button-primary-b1l"
        icon={"plus"}
        onClick={() => handleAddTask()}
      />
    </div>
  );
}

function getButtonIcon(type: EDashboardCheckType) {
  switch (type) {
    case EDashboardCheckType.FINISHED:
      return "confirm";
    case EDashboardCheckType.UNFINISHED:
      return "delete";
    case EDashboardCheckType.NONE:
      return "circle";
  }
}
