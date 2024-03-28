import React, { useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import {
  exportToCSV,
  getCurrentProject,
  getCurrentUI,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { Button, ProgressBar } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { TAccessoryMTO } from "../../../../../store/main/pipeTypes";

type Props = {
  onClose: () => any;
};

export function AccessoryMTO({ onClose }: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const rows = useMemo(() => {
    let newRows: TAccessoryMTO[] = [];
    for (const line of lines) {
      const checks = ui?.analysisUI[line]?.accessoryMTO ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [ui, lines]);

  const progress = useMemo(() => ui?.requests?.reports || ui?.requests?.weight, [ui]);

  function drawRow(item: TAccessoryMTO, i: number) {
    return (
      <tr key={i}>
        <td>{item.line}</td>
        <td>{item.size}</td>
        <td>{item.type}</td>
        <td>{item.schedule ?? item.class}</td>
        <td>{item.nos}</td>
        <td>{item.weight}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.line,
          Size: row.size,
          Type: row.type,
          "Schedule / Class": row.schedule,
          Nos: row.nos,
          "Weight (kg)": row.weight,
        };
      }),
      "Accessory MTO"
    );
  }

  return (
    <CustomDlg
      title={"Accessory MTO"}
      isMinimize={true}
      onClose={onClose}
      body={
        <div className="d-flex f-column f-grow">
          <div className="d-flex f-ai-center bg-dark label-light">
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
          </div>
          <div className="hr" />
          {progress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className={"p-5 bg-dark"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Line No.</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Schedule / Class</th>
                    <th>Nos</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>{rows.map((row, i) => drawRow(row, i))}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
