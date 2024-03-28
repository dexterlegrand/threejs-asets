import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Vector3 } from "three";
import { ApplicationState } from "../../../../../store";
import { Section } from "../../../../../store/data/types";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import {
  checkRange,
  degToRad,
  exportToCSV,
  fixNumberToStr,
  fixVectorByOrientation,
  getCurrentProject,
  getSimpleDirection,
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

export default function OFSectionsSyncMTO({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models: TOpenFrame[] = useMemo(() => {
    return (
      (project?.models.filter(
        (model) => model.type === "Open Frame" || model.type === "Factory Shed"
      ) as TOpenFrame[]) ?? []
    );
  }, [project]);

  const data = useMemo(() => {
    return getOpenFramesMTO(models);
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
  nos: number;
  length: number;
  profile: Section;
};

function getModelProfiles(models: TOpenFrame[]) {
  const map = new Map<string, DataType[]>();
  for (const model of models) {
    let data: DataType[] = [];
    const elements = [
      ...model.columns,
      ...model.beams,
      ...model.cantilevers,
      ...model.kneeBracings,
      ...model.horizontalBracings,
      ...model.verticalBracings,
      ...model.staircases,
    ];
    for (const el of elements) {
      data = appendMTOData(
        data,
        el.profile,
        el.startPos.distanceTo(el.endPos),
        model.material?.material_name
      );
    }
    for (const el of model.truss ?? []) {
      const from = model.beams.find((b) => b.name === el.from);
      if (!from) continue;
      const span_2 = el.span / 2;
      const prevTV = new Vector3();
      for (let i = 0; i < el.numbers; i++) {
        const span_2_3 = span_2 / 3;
        const top = span_2 * Math.tan(degToRad(el.slope));
        const small = span_2_3 * Math.tan(degToRad(el.slope));
        const big = span_2_3 * 2 * Math.tan(degToRad(el.slope));
        const x = el.offset + el.spacing * i;

        const LT = new Vector3(x);
        const CT = new Vector3(x, 0, span_2);
        const RT = new Vector3(x, 0, el.span);

        const TV = CT.clone().setY(top);

        const SLB = new Vector3(x, 0, span_2_3);
        const SLT = SLB.clone().setY(small);

        const BLB = SLB.clone().setZ(span_2_3 * 2);
        const BLT = BLB.clone().setY(big);

        const globalLT = fixVectorByOrientation(
          from!.startPos,
          LT.clone().add(from!.startPos),
          -90
        );
        globalLT.set(
          roundM(globalLT.x),
          roundM(globalLT.y),
          roundM(globalLT.z)
        );
        const globalRT = fixVectorByOrientation(
          from!.startPos,
          RT.clone().add(from!.startPos),
          -90
        );
        globalRT.set(
          roundM(globalRT.x),
          roundM(globalRT.y),
          roundM(globalRT.z)
        );
        if (
          !model.beams.some((beam) => {
            if (beam.startPos.y !== globalLT.y || beam.endPos.y !== globalLT.y)
              return false;
            const dir = getSimpleDirection(globalLT, globalRT);
            if (dir !== getSimpleDirection(beam.startPos, beam.endPos))
              return false;
            return dir === "X"
              ? globalLT.z === beam.startPos.z &&
                  checkRange(
                    globalLT.x,
                    beam.startPos.x,
                    beam.endPos.x,
                    true,
                    true
                  )
              : globalLT.x === beam.startPos.x &&
                  checkRange(
                    globalLT.z,
                    beam.startPos.z,
                    beam.endPos.z,
                    true,
                    true
                  );
          })
        ) {
          data = appendMTOData(
            data,
            el.tie,
            el.span,
            model.material?.material_name
          );
        }

        if (i) {
          data = appendMTOData(
            data,
            el.tie,
            prevTV.distanceTo(TV),
            model.material?.material_name,
            5
          );
        }

        prevTV.copy(TV);

        data = appendMTOData(
          data,
          el.vertical,
          small,
          model.material?.material_name,
          2
        );

        data = appendMTOData(
          data,
          el.inclined,
          SLT.distanceTo(BLB),
          model.material?.material_name,
          2
        );

        data = appendMTOData(
          data,
          el.vertical,
          big,
          model.material?.material_name,
          2
        );

        data = appendMTOData(
          data,
          el.inclined,
          BLT.distanceTo(CT),
          model.material?.material_name,
          2
        );

        data = appendMTOData(
          data,
          el.rafter,
          LT.distanceTo(TV),
          model.material?.material_name,
          2
        );

        data = appendMTOData(
          data,
          el.vertical,
          top,
          model.material?.material_name
        );
      }
    }
    for (const el of model.runners ?? []) {
      if (el.globalSide === "SIDE") {
        const cf = model.columns.find((c) => c.name === el.from);
        const ct = model.columns.find((c) => c.name === el.to);
        if (!cf || !ct) continue;
        for (let i = 0; i < el.numbers; i++) {
          const start = new Vector3(
            cf.startPos.x,
            cf.startPos.y + el.offset + el.spacing * i,
            cf.startPos.z
          );
          const end = new Vector3(ct.startPos.x, start.y, ct.startPos.z);
          data = appendMTOData(
            data,
            el.profile,
            start.distanceTo(end),
            model.material?.material_name
          );
        }
      } else {
        const bf = model.beams.find((b) => b.name === el.from);
        const bt = model.beams.find((b) => b.name === el.to);
        if (!bf || !bt) continue;
        const dir = bf.direction;
        for (let i = 0; i < el.numbers; i++) {
          const start = new Vector3(
            dir === "X"
              ? bf.startPos.x + el.offset + el.spacing * i
              : bf.startPos.x,
            bf.startPos.y,
            dir === "X"
              ? bf.startPos.z
              : bf.startPos.z + el.offset + el.spacing * i
          );
          const end = new Vector3(
            dir === "X"
              ? bf.startPos.x + el.offset + el.spacing * i
              : bt.startPos.x,
            bt.startPos.y,
            dir === "X"
              ? bt.startPos.z
              : bf.startPos.z + el.offset + el.spacing * i
          );
          data = appendMTOData(
            data,
            el.profile,
            start.distanceTo(end),
            model.material?.material_name
          );
        }
      }
    }
    for (const el of model.railings ?? []) {
      const step = el.length / el.noOfSpacings;
      for (let i = 0; i <= el.noOfSpacings; i++) {
        const offset = el.distFromStartNode + step * i;
        const start = new Vector3(0, 0, offset);
        const end = new Vector3(0, el.totalHeight, offset);
        data = appendMTOData(
          data,
          el.topRail,
          start.distanceTo(end),
          model.material?.material_name
        );
      }

      const start = new Vector3(0, el.totalHeight, el.distFromStartNode);
      const end = new Vector3(
        0,
        el.totalHeight,
        el.distFromStartNode + el.length
      );
      data = appendMTOData(
        data,
        el.topRail,
        start.distanceTo(end),
        model.material?.material_name
      );

      if (el.middleHeight && el.middleRail) {
        const start = new Vector3(0, el.middleHeight, el.distFromStartNode);
        const end = new Vector3(
          0,
          el.middleHeight,
          el.distFromStartNode + el.length
        );
        data = appendMTOData(
          data,
          el.middleRail,
          start.distanceTo(end),
          model.material?.material_name
        );
      }
    }
    map.set(model.name, data);
  }
  return map;
}

function appendMTOData(
  data: DataType[],
  profile: Section,
  length: number,
  material = "",
  count = 1
) {
  const dataItem = data.find(
    (item) => item.profile.profile_section_id === profile.profile_section_id
  );
  return dataItem
    ? data.map((item) =>
        item.id === dataItem.id
          ? {
              ...dataItem,
              length: dataItem.length + length * count,
              nos: item.nos + count,
            }
          : item
      )
    : [
        ...data,
        {
          id: data.length,
          material,
          nos: count,
          length: length * count,
          profile,
        },
      ];
}

export function getOpenFramesMTO(models: TOpenFrame[]) {
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
    "Open Frame MTO"
  );
}
