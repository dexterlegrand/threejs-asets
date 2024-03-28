import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Vector3 } from "three";
import { ApplicationState } from "../../../../../store";
import { Section } from "../../../../../store/data/types";
import {
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
} from "../../../../../store/main/types";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  getNextId,
  roundM,
} from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = {
  onClose: () => any;
};

type TSectionMTO = {
  model: string;
  designation: string;
  material: string;
  nos: number;
  length: number;
  weight: number;
};

export default function PRSectionsSyncMTO({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models: PipeRack[] = useMemo(() => {
    return (
      (project?.models.filter(
        (model) => model.type === "Pipe Rack"
      ) as PipeRack[]) ?? []
    );
  }, [project]);

  const data = useMemo(() => {
    return getPipeRacksMTO(models);
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
                    <th>Designtion</th>
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

type DataType = {
  id: number;
  material: string;
  length: number;
  nos: number;
  profile: Section;
};

function getModelProfiles(models: PipeRack[]) {
  const map = new Map<string, DataType[]>();
  for (const model of models) {
    let data: DataType[] = [];
    for (const el of model.columns) {
      const dataItem = data.find(
        (item) =>
          item.profile.profile_section_id === el.profile.profile_section_id
      );
      const length = el.startPos.distanceTo(el.endPos);
      if (dataItem) {
        data = data.map((item) =>
          item.id === dataItem.id
            ? {
                ...dataItem,
                length: dataItem.length + length,
                nos: item.nos + 1,
              }
            : item
        );
      } else {
        data.push({
          id: data.length,
          material: model.material?.material_name ?? "",
          nos: 1,
          length,
          profile: el.profile,
        });
      }
    }
    for (const el of model.beams) {
      const dataItem = data.find(
        (item) =>
          item.profile.profile_section_id === el.profile.profile_section_id
      );
      const length = el.startPos.distanceTo(el.endPos);
      if (dataItem) {
        data = data.map((item) =>
          item.id === dataItem.id
            ? {
                ...dataItem,
                length: dataItem.length + length,
                nos: item.nos + 1,
              }
            : item
        );
      } else {
        data.push({
          id: data.length,
          material: model.material?.material_name ?? "",
          nos: 1,
          length,
          profile: el.profile,
        });
      }
    }
    for (const el of model.cantilevers) {
      const dataItem = data.find(
        (item) =>
          item.profile.profile_section_id === el.profile.profile_section_id
      );
      const length = el.startPos.distanceTo(el.endPos);
      if (dataItem) {
        data = data.map((item) =>
          item.id === dataItem.id
            ? {
                ...dataItem,
                length: dataItem.length + length,
                nos: item.nos + 1,
              }
            : item
        );
      } else {
        data.push({
          id: data.length,
          material: model.material?.material_name ?? "",
          nos: 1,
          length,
          profile: el.profile,
        });
      }
    }
    for (const el of model.vBracings) {
      const dataItem = data.find(
        (item) =>
          item.profile.profile_section_id === el.profile.profile_section_id
      );
      const length = el.startPos.distanceTo(el.endPos);
      if (dataItem) {
        data = data.map((item) =>
          item.id === dataItem.id
            ? {
                ...dataItem,
                length: dataItem.length + length,
                nos: item.nos + 1,
              }
            : item
        );
      } else {
        data.push({
          id: data.length,
          material: model.material?.material_name ?? "",
          nos: 1,
          length,
          profile: el.profile,
        });
      }
    }
    const beams = [...model.beams, ...model.cantilevers];
    for (const el of model.hBracings) {
      const dataItem = data.find(
        (item) =>
          item.profile.profile_section_id === el.profile.profile_section_id
      );
      const startB = beams.find((beam) => beam.name === el.start);
      const endB = beams.find((beam) => beam.name === el.end);
      const startPos = new Vector3();
      const endPos = new Vector3();
      if (startB && endB) {
        startPos.copy(startB.startPos);
        endPos.copy(endB.startPos);
        if (
          (startB as PipeRackBeam).direction === "X" ||
          (startB as PipeRackCantilever).position === "Front" ||
          (startB as PipeRackCantilever).position === "Back"
        ) {
          (startB as PipeRackCantilever).position === "Front"
            ? startPos.setX(startPos.x - el.startOffset)
            : startPos.setX(startPos.x + el.startOffset);
        } else {
          (startB as PipeRackCantilever).position === "Right"
            ? startPos.setZ(startPos.z + el.startOffset)
            : startPos.setZ(startPos.z - el.startOffset);
        }
        if (
          (endB as PipeRackBeam).direction === "X" ||
          (endB as PipeRackCantilever).position === "Front" ||
          (endB as PipeRackCantilever).position === "Back"
        ) {
          (endB as PipeRackCantilever).position === "Front"
            ? endPos.setX(endPos.x - el.endOffset)
            : endPos.setX(endPos.x + el.endOffset);
        } else {
          (endB as PipeRackCantilever).position === "Right"
            ? endPos.setZ(endPos.z + el.endOffset)
            : endPos.setZ(endPos.z - el.endOffset);
        }
      }
      const length = startPos.distanceTo(endPos);
      if (dataItem) {
        data = data.map((item) =>
          item.id === dataItem.id
            ? {
                ...dataItem,
                length: dataItem.length + length,
                nos: item.nos + 1,
              }
            : item
        );
      } else {
        data.push({
          id: data.length,
          material: model.material?.material_name ?? "",
          nos: 1,
          length,
          profile: el.profile,
        });
      }
    }
    map.set(model.name, data);
  }
  return map;
}

export function getPipeRacksMTO(models: PipeRack[]) {
  const rows: TSectionMTO[] = [];
  const map = getModelProfiles(models);
  for (const [key, data] of Array.from(map.entries())) {
    for (const item of data) {
      rows.push(getModelData(key, item));
    }
  }
  return rows;
}

function getModelData(model: string, item: DataType) {
  const row: TSectionMTO = {
    model: model + "",
    length: roundM(item.length),
    designation: item.profile.designation,
    material: item.material,
    nos: item.nos,
    weight: roundM(
      ((item.profile.ax_global ?? 0) / Math.pow(10, 6)) * item.length * 7850
    ),
  };
  return row;
}

function drawRow(item: TSectionMTO, i: number) {
  return (
    <tr key={i}>
      <td>{item.model}</td>
      <td>{item.designation}</td>
      <td>{item.material}</td>
      <td>{item.length}</td>
      <td>{item.weight}</td>
    </tr>
  );
}

function handleExport(data: TSectionMTO[]) {
  exportToCSV(
    data.map((row) => {
      return {
        Model: row.model,
        Designation: row.designation,
        Material: row.material,
        Nos: row.nos,
        "Length (m)": fixNumberToStr(row.length),
        "Weight (kg)": fixNumberToStr(row.weight),
      };
    }),
    "Pipe Rack MTO"
  );
}
