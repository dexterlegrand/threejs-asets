import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { TFlare } from "../../../../../store/main/types/flare";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  MMtoM,
  roundM,
} from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = {
  onClose: () => any;
};

type TSegmentMTO = {
  flare: string;
  material: string;
  weight: number;
};

export default function FlareMTO({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models: TFlare[] = useMemo(() => {
    return project?.flares ?? [];
  }, [project]);

  const data = useMemo(() => {
    return getFlaresMTO(models);
  }, [models]);

  return (
    <CustomDlg
      title={"Sections MTO"}
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
                    <th>Model</th>
                    <th>Material</th>
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

function drawRow(item: TSegmentMTO, i: number) {
  return (
    <tr key={i}>
      <td>{item.flare}</td>
      <td>{item.material}</td>
      <td>{item.weight}</td>
    </tr>
  );
}

function handleExport(data: TSegmentMTO[]) {
  exportToCSV(
    data.map((row) => {
      return {
        Flare: row.flare,
        Material: row.material,
        "Weight (kg)": fixNumberToStr(row.weight),
      };
    }),
    "Flare MTO"
  );
}

export function getFlaresMTO(models: TFlare[]) {
  const rows: TSegmentMTO[] = [];
  for (const model of models) {
    const materials: string[] = [];
    let weight = 0;
    for (const segment of model.segments) {
      if (segment.material) materials.push(segment.material.material_name);
      const height = segment.topElevation_M - segment.bottomElevation_M;
      const thickness = MMtoM(segment.thickness_MM);

      const topInnerRadius = segment.topInternalDiameter_M / 2;
      const bottomInnerRadius = segment.bottomInternalDiameter_M / 2;

      const topOuterRadius = topInnerRadius + thickness;
      const bottomOuterRadius = bottomInnerRadius + thickness;
      weight +=
        Math.PI *
        ((topOuterRadius + bottomOuterRadius) / 2) *
        thickness *
        height *
        7850;
    }
    rows.push({
      flare: model.name,
      material: materials.join(", "),
      weight: roundM(weight),
    });
  }
  return rows;
}
