import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getPipePoints } from "../../../../../services/pipe-services/pipe-service";
import { ApplicationState } from "../../../../../store";
import { TPipeMTO } from "../../../../../store/main/pipeTypes";
import { FreePipe } from "../../../../../store/main/types";
import { getStartOffsetFromConnector } from "../../../../3d-models/pipes/pipesUtils";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  getPosByDistance,
  roundM,
} from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";


type Props = {
  onClose: () => any;
};

export function LinesSyncMTO({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const data = useMemo(() => {
    return getPipesSyncMTO(pipes);
  }, [pipes]);

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

export function getPipesSyncMTO(pipes: FreePipe[]) {
  const map = new Map<string, TPipeMTO>();
  for (const pipe of pipes) {
    if (!pipe.params.profile) continue;
    const prev = pipes.find((p) => p.pipe === pipe.preceding);

    const { start, end } = getPipePoints(pipe);

    const startOffset = prev
      ? getStartOffsetFromConnector(
          pipe,
          Math.abs(pipe.vDir) === 90 || Math.abs(pipe.hDir) === 90
        )
      : 0;

    const endOffset = getStartOffsetFromConnector(pipe);

    startOffset && start.copy(getPosByDistance(startOffset, start, end));
    endOffset && end.copy(getPosByDistance(endOffset, end, start));

    const length = start.distanceTo(end);
    const material = pipe.params.material?.material_name ?? "";
    const profile = pipe.params.profile;
    const id = `${pipe.line}-${profile.piping_details_id}`;
    const row = map.get(id);
    if (row) {
      map.set(id, {
        ...row,
        structure: row.structure
          ? row.structure + (pipe.structure ? `;${pipe.structure}` : "")
          : pipe.structure ?? "",
        length: row.length + length,
        material: row.material
          ? row.material + (material ? `;${material}` : "")
          : material,
        weight: row.weight + profile.weight_global * length,
      });
    } else {
      map.set(id, {
        line: pipe.line + "",
        tag: pipe.tag ?? "",
        structure: pipe.structure ?? "",
        size: profile.nominal_pipe_size_inch,
        length: length,
        material,
        weight: profile.weight_global * length,
      });
    }
  }
  return Array.from(map.values()).map((row) => ({
    ...row,
    length: roundM(row.length),
    weight: roundM(row.weight),
    material: Array.from(new Set(row.material.split(";"))).join(", "),
    structure: Array.from(new Set(row.structure.split(";"))).join(", "),
  }));
}

function drawRow(item: TPipeMTO, i: number) {
  return (
    <tr key={i}>
      <td>{item.tag}</td>
      <td>{item.line}</td>
      <td>{item.structure}</td>
      <td>{item.size}</td>
      <td>{item.material}</td>
      <td>{item.length}</td>
      <td>{item.weight}</td>
    </tr>
  );
}

function handleExport(data: TPipeMTO[]) {
  exportToCSV(
    data.map((row) => {
      return {
        Tag: row.tag ?? "",
        "Line No.": row.line,
        Structure: row.structure ?? "",
        Size: row.size,
        Material: row.material,
        "Length (m)": fixNumberToStr(row.length),
        "Weight (kg)": fixNumberToStr(row.weight),
      };
    }),
    "Pipe MTO"
  );
}
