import React, { useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import {
  exportToCSV,
  getCurrentProject,
  roundM,
} from "../../../../3d-models/utils";
import { Button } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { TAccessoryMTO } from "../../../../../store/main/pipeTypes";
import { FreePipe } from "../../../../../store/main/types";
import {
  getPipeLinesMap,
  isPrevConnector,
} from "../../../../../services/pipe-services/pipe-service";
import { TPipingFlange } from "../../../../../store/data/types";

type Props = {
  onClose: () => any;
};

export function AccessoriesSyncMTO({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const data = useMemo(() => {
    return getPipeAccessoriesSyncMTO(pipes);
  }, [pipes]);

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
                    <th>Type</th>
                    <th>Schedule / Class</th>
                    <th>Nos</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>{data.map((row, i) => drawRow(row, i))}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}

export function getPipeAccessoriesSyncMTO(pipes: FreePipe[]) {
  const map = new Map<string, TAccessoryMTO>();
  for (const pipe of pipes) {
    if (pipe.params.endConnector) {
      const { id, nps, shape, schedule, weight } = pipe.params.endConnector;
      const mapId = `${pipe.line}-${shape}-${id}`;
      const row = map.get(mapId);
      if (row) {
        map.set(mapId, {
          ...row,
          structure: row.structure
            ? row.structure + (pipe.structure ? `;${pipe.structure}` : "")
            : pipe.structure ?? "",
          type: shape,
          schedule,
          nos: (row.nos ?? 0) + 1,
          weight: row.weight + weight,
        });
      } else {
        map.set(mapId, {
          line: pipe.line + "",
          tag: pipe.tag ?? "",
          structure: pipe.structure ?? "",
          size: nps,
          type: shape,
          schedule,
          nos: 1,
          weight,
        });
      }
    }
    if (pipe.params.startFlange) {
      const { nps, shape, weight, piping_flange_id } = pipe.params.startFlange;
      const mapId = `${pipe.line}-${shape}-${piping_flange_id}`;
      const row = map.get(mapId);
      if (row) {
        map.set(mapId, {
          ...row,
          structure: row.structure
            ? row.structure + (pipe.structure ? `;${pipe.structure}` : "")
            : pipe.structure ?? "",
          type: shape,
          class: pipe.params.startFlange.class,
          nos: (row.nos ?? 0) + 1,
          weight: row.weight + (weight ?? 0),
        });
      } else {
        map.set(mapId, {
          line: pipe.line + "",
          tag: pipe.tag ?? "",
          structure: pipe.structure ?? "",
          size: nps,
          type: shape,
          class: pipe.params.startFlange.class,
          nos: 1,
          weight: weight ?? 0,
        });
      }
    }
    if (pipe.params.endFlange) {
      const { nps, shape, weight, piping_flange_id } = pipe.params.endFlange;
      const mapId = `${pipe.line}-${shape}-${piping_flange_id}`;
      const row = map.get(mapId);
      if (row) {
        map.set(mapId, {
          ...row,
          structure: row.structure
            ? row.structure + (pipe.structure ? `;${pipe.structure}` : "")
            : pipe.structure ?? "",
          type: shape,
          class: pipe.params.endFlange.class,
          nos: (row.nos ?? 0) + 1,
          weight: row.weight + (weight ?? 0),
        });
      } else {
        map.set(mapId, {
          line: pipe.line + "",
          tag: pipe.tag ?? "",
          structure: pipe.structure ?? "",
          size: nps,
          type: shape,
          class: pipe.params.endFlange.class,
          nos: 1,
          weight: weight ?? 0,
        });
      }
    }
  }
  return Array.from(map.values()).map((row) => ({
    ...row,
    weight: roundM(row.weight),
  }));
}

function drawRow(item: TAccessoryMTO, i: number) {
  return (
    <tr key={i}>
      <td>{item.tag}</td>
      <td>{item.line}</td>
      <td>{item.structure}</td>
      <td>{item.size}</td>
      <td>{item.type}</td>
      <td>{item.schedule ?? item.class}</td>
      <td>{item.nos}</td>
      <td>{item.weight}</td>
    </tr>
  );
}

function handleExport(data: TAccessoryMTO[]) {
  exportToCSV(
    data.map((row) => {
      return {
        Tag: row.tag ?? "",
        "Line No.": row.line,
        Structure: row.structure ?? "",
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
