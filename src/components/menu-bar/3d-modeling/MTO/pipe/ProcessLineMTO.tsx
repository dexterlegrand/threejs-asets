import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getPipePoints } from "../../../../../services/pipe-services/pipe-service";
import { ApplicationState } from "../../../../../store";
import { TProcessMTO } from "../../../../../store/main/pipeTypes";
import { TProcessLine } from "../../../../../store/process/types";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProcess,
  roundM,
} from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";
import { forEachChild } from "typescript";

type Props = {
    onClose: () => any;
  };

  export function ProcessSyncMTO({onClose} : Props) {
    const process = useSelector((state: ApplicationState) => 
        getCurrentProcess(state)
    );

    const processlines = useMemo(() => {
        return process?.lines ?? [];
      }, [process]);

    
      const data = useMemo(() => {
        return getProcessSyncMTO(processlines);
      }, [processlines]);
    
      return (
        <CustomDlg
          title={"Lines MTO"}
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
                  onClick={() => handleExport(data)}
                />
              </div>
              <div className="hr" />
              <div className={"p-5 bg-dark"}>
                <div className={"table-container"}>
                  <table className="table bg-gray">
                    <thead>
                      <tr>
                        <th>Tag</th>
                        <th>Line No.</th>
                        <th>Supporting Structures</th>
                        <th>Size</th>
                        <th>Material</th>
                        <th>Length (m)</th>
                        <th>Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => drawRow(row, i))}
                      <tr>
                        <td>
                          <strong>Total</strong>
                        </td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>
                          {roundM(data.reduce((acc, row) => acc + row.length, 0))}
                        </td>
                        <td>
                          {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
                        </td>
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

export function getProcessSyncMTO(processLines: TProcessLine[]): TProcessMTO[] {
  const map = new Map<string, TProcessMTO>();
  processLines.forEach((processLine) => {
    if (processLine.segments) {
      processLine.segments.forEach((segment) => {
        const start = segment.start;
        const end = segment.end;
        const length = start.distanceTo(end);
        const size = segment.parameters?.nps ?? "";
        const material = processLine.parameters?.material?.material_name ?? "";
        const id = `${processLine.id}-${segment.id}`;
        const existingEntry = map.get(id);
        if (existingEntry) {
          map.set(id, {
            ...existingEntry,
            length: existingEntry.length + length, 
            weight: existingEntry.weight + (segment.parameters?.profile?.weight_global ?? 0) * length,
          });
        } else {
          map.set(id, {
            line: `${processLine.processLineNo}`,
            size,
            material,
            length,
            weight: (segment.parameters?.profile?.weight_global ?? 0) * length, 
          });
        }
      });
    }
  });
  return Array.from(map.values()).map((row) => ({
    ...row,
    length: roundM(row.length),
    weight: roundM(row.weight),
    material: Array.from(new Set(row.material.split(";"))).join(", "),
  }));
}


  function drawRow(item: TProcessMTO, i: number) {
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
  
  function handleExport(data: TProcessMTO[]) {
    exportToCSV(
      data.map((existingEntry) => {
        return {
          "Line No.": existingEntry.line,
          Size: existingEntry.size,
          Material: existingEntry.material,
          "Length (m)": fixNumberToStr(existingEntry.length),
          "Weight (kg)": fixNumberToStr(existingEntry.weight),
        };
      }),
      "Process MTO"
    );
  }
