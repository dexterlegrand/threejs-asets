import React, { useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../common/CheckBoxCell";
import { CustomDlg } from "../../common/CustomDlg";
import { Project } from "../../../store/main/types";
import { useDispatch } from "react-redux";
import { TProcess } from "../../../store/process/types";
import { getNextId } from "../../3d-models/utils";

type Props = {
  project?: Project;
  projects: Project[];
  processes: { id: number; locked: boolean; name: string; process: TProcess }[];
  onClose: () => any;
  onSave: (projects: string[], locked: string[]) => any;
};

type Element = {
  id: number;
  selected: boolean;
  locked: boolean;
  name: string;
  type: string | undefined;
};

export function CloseNEProjectsDlg(props: Props) {
  const { project, projects, processes, onClose, onSave } = props;

  const [rows, setRows] = useState<Element[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: Element[] = [];
    for (const process of processes) {
      newRows.push({
        id: process.id,
        selected: false,
        locked: !!process.locked,
        name: process.name,
        type: "Process",
      });
    }
    for (const project of projects) {
      newRows.push({
        id: getNextId(newRows),
        selected: false,
        locked: !!project.locked,
        name: project.name,
        type: project.modelType || (project.freePipes?.length && "Pipes") || "undefined",
      });
    }
    setRows(newRows);
  }, [projects, processes]);

  function handleChange(item: Element, selected: boolean) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          return { ...row, selected };
        }
        return row;
      })
    );
  }

  function handleLock(item: Element, locked: boolean) {
    if (!project) return;
    if (item.type === "Process") {
      setRows(
        rows.map((row) => {
          if (row.id === item.id) {
            return { ...row, locked };
          }
          return row;
        })
      );
      // dispatch(
      //   changeProjectAction({
      //     ...project,
      //     notEditableProcesses: processes.map((p) => (p.id === item.id ? { ...p, locked } : p)),
      //   })
      // );
    } else {
      setRows(
        rows.map((row) => {
          if (row.id === item.id) {
            return { ...row, locked };
          }
          return row;
        })
      );
      // dispatch(
      //   changeProjectAction({
      //     ...project,
      //     notEditableProjects: projects.map((p) => (p.name === item.name ? { ...p, locked } : p)),
      //   })
      // );
    }
  }

  function getRow(row: Element) {
    return (
      <tr key={row.name}>
        <CheckBoxCell
          key={row.name}
          value={row.selected}
          onChange={(value) => handleChange(row, value)}
        />
        <CheckBoxCell
          key={`lock-${row.name}`}
          value={row.locked}
          onChange={(value) => handleLock(row, value)}
        />
        <td>{row.name}</td>
        <td>{row.type}</td>
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Opened Projects"}
      zIndex={3}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="label-light bg-dark">Projects</div>
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th></th>
                    <th>Locked</th>
                    <th className={"w-200"}>Project</th>
                    <th className={"w-200"}>Type</th>
                  </tr>
                </thead>
                <tbody>{rows.map((item) => getRow(item))}</tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Apply"
            onClick={() =>
              onSave(
                rows.filter((row) => row.selected).map((row) => row.name),
                rows.filter((row) => row.locked).map((row) => row.name)
              )
            }
            intent={"primary"}
          />
        </>
      }
    />
  );
}
