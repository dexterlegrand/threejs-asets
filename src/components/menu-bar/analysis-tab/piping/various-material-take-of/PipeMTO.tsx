import React, { useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  getCurrentUI,
  roundM,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { Button, ProgressBar } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { TPipeMTO } from "../../../../../store/main/pipeTypes";

type Props = {
  onClose: () => any;
};

export function PipeMTO({ onClose }: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const rows = useMemo(() => {
    let newRows: TPipeMTO[] = [];
    for (const line of lines) {
      const checks = ui?.analysisUI[line]?.pipeMTO ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [ui, lines]);

  const progress = useMemo(() => ui?.requests?.reports || ui?.requests?.weight, [ui]);

  function drawRow(item: TPipeMTO, i: number) {
    return (
      <tr key={i}>
        <td>{item.line}</td>
        <td>{item.size}</td>
        <td>{item.material}</td>
        <td>{item.length}</td>
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
          Material: row.material,
          "Length (m)": fixNumberToStr(row.length),
          "Weight (kg)": fixNumberToStr(row.weight),
        };
      }),
      "Pipe MTO"
    );
  }

  return (
    <CustomDlg
      title={"Pipe MTO"}
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
                    <th>Material</th>
                    <th>Length (m)</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => drawRow(row, i))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>{roundM(rows.reduce((acc, row) => acc + row.length, 0))}</td>
                    <td>{roundM(rows.reduce((acc, row) => acc + row.weight, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
