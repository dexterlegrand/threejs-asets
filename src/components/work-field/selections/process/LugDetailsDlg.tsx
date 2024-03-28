import React, { useState, useRef, useEffect, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import {
  TProcessElementPoint,
  TProcessElement,
  EProcessElementType,
  TProcess,
} from "../../../../store/process/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { Vector3 } from "three";
import {
  degToRad,
  roundM,
  getTopOffset,
  roundVectorM,
  radToDeg,
  round,
  fixVectorByOrientation,
  exportToCSV,
  fixNumberToStr,
  importFromCSV,
  getNextId,
  checkImportedNumber,
  getPosByDistance,
} from "../../../3d-models/utils";
import { deg45InRad, deg90InRad } from "../../../../store/main/constants";
import { SelectorCell } from "../../../common/SelectorCell";
import { NumericCell } from "../../../common/NumericCell";

import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";

type Props = {
  item: TProcessElement;
  process?: TProcess;
  onChange: (item: TProcessElement, toRemove?: TProcessElementPoint) => any;
  onClose: () => any;
};

export function LugDetailsDlg({ item, process, onChange, onClose }: Props) {
  const [selected, setSelected] = useState<TProcessElementPoint>();
  const [offsetTop1, setOffsetTop1] = useState<number>(0);
  const [offsetTop2, setOffsetTop2] = useState<number>(0);
  const [dlg, setDlg] = useState<JSX.Element>();

  const tableRef = useRef<HTMLTableElement>(null);

  const resoures = useSelector((state: ApplicationState) => state.data);

  const isTank = useMemo(() => item.type === EProcessElementType.TANK, [item]);
  const isDrum = useMemo(() => item.type === EProcessElementType.DRUM, [item]);

  useEffect(() => {
    setOffsetTop1(getTopOffset(tableRef.current, 1));
    setOffsetTop2(getTopOffset(tableRef.current, 2));
  }, [selected]);

  function handleDelete() {
    if (!selected || selected.isFixed) return;
    let points = item.points.filter((p) => p.id !== selected.id);

    const l_2 = roundM(item.scale / 2);
    const l_3 = roundM(item.scale / 3);
    const l_4 = roundM(l_2 / 2);
    const l_5 = item.scale / 5;
    const l_6 = l_3 / 2;

    if (item.type === EProcessElementType.HEADER) {
      const l = roundM((l_3 * 2) / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        if (p.isFixed) return p;
        const pos = l_3 - l * i++;
        const newPoint = new Vector3(pos, -l_2);
        return { ...p, generalPosition: newPoint.clone() };
      });
    } else if (item.type === EProcessElementType.EXTRACTOR) {
      const l = roundM(item.scale / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        if (p.isFixed) return p;
        const pos = l_2 - l * i++;
        const newPoint = new Vector3(l_5 + l_6, pos);
        return { ...p, generalPosition: newPoint.clone() };
      });
    } else if (isTank || isDrum) {
      const lv = roundM(l_2 / (points.filter((p) => p.isVertical).length + 1));
      const lh = roundM(
        item.scale / (points.filter((p) => !p.isVertical).length + 1)
      );
      let v = 1;
      let h = 1;
      points = points.map((p) => {
        if (p.isFixed) return p;
        if (p.isVertical) {
          const pos = l_4 - lv * v++;
          const newPoint = new Vector3(l_2 + l_5, pos);
          return { ...p, generalPosition: newPoint.clone() };
        } else {
          const pos = l_2 - lh * h++;
          const newPoint = new Vector3(pos, -item.scale);
          return { ...p, generalPosition: newPoint.clone() };
        }
      });
    }

    const changed = { ...item, points };
    onChange(changed, selected);
    setSelected(undefined);
  }

  function handleClear() {
    if (!selected) return;
    const changed = {
      ...item,
      points: item.points.map((p) => {
        if (p.id !== selected.id) return p;
        return {
          ...p,
          // LugType: getLugType(item, p),
          element: undefined,
        };
      }),
    };
    onChange(changed, selected);
    setSelected(undefined);
  }

  function handleChange(row: TProcessElementPoint) {
    const changed = {
      ...item,
      points: item.points.map((p) => (row.id === p.id ? row : p)),
    };
    onChange(changed);
  }

  function handleChangeOrientation(
    row: TProcessElementPoint,
    orientation?: number
  ) {
    const changed = {
      ...item,
      points: item.points.map((p) => {
        if (row.id !== p.id) return p;
        return {
          ...p,
          generalPosition: p.generalPosition
            .applyAxisAngle(new Vector3(0, 1), degToRad(-(p.orientation ?? 0)))
            .applyAxisAngle(new Vector3(0, 1), degToRad(orientation ?? 0)),
          orientation,
        };
      }),
    };
    onChange(changed);
  }

  function handleChangePosition(
    row: TProcessElementPoint,
    isVertical?: boolean
  ) {
    let points = item.points.map((p) =>
      p.id === row.id
        ? {
            ...p,
            isVertical,
            orientation: isVertical ? p.orientation : undefined,
          }
        : p
    );

    const l_2 = item.scale / 2;
    const l_4 = l_2 / 2;
    const l_5 = item.scale / 5;

    const lv = l_2 / (points.filter((p) => p.isVertical).length + 1);
    const lh = item.scale / (points.filter((p) => !p.isVertical).length + 1);
    let v = 1;
    let h = 1;
    points = points.map((p) => {
      if (p.isFixed) return p;
      if (p.isVertical) {
        const pos = l_4 - lv * v++;
        const newPoint = roundVectorM(new Vector3(l_2 + l_5, pos));
        return { ...p, generalPosition: newPoint.clone() };
      } else {
        const pos = l_2 - lh * h++;
        const newPoint = roundVectorM(new Vector3(pos, -item.scale));
        return { ...p, generalPosition: newPoint.clone() };
      }
    });

    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function changeStartPosition(
    row: TProcessElementPoint,
    field: "x" | "y" | "z",
    value: number
  ) {
    const points = item.points.map((p) => {
      if (field === "x") {
        return p.id === row.id
          ? { ...p, startPosition: p.startPosition.clone().setX(value) }
          : p;
      } else if (field === "y") {
        return p.id === row.id
          ? { ...p, startPosition: p.startPosition.clone().setY(value) }
          : p;
      } else if (field === "z") {
        return p.id === row.id
          ? { ...p, startPosition: p.startPosition.clone().setZ(value) }
          : p;
      }
      return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function changeGeneralPosition(
    row: TProcessElementPoint,
    field: "x" | "y" | "z",
    value: number
  ) {
    const points = item.points.map((p) => {
      if (field === "x") {
        return p.id === row.id
          ? { ...p, generalPosition: p.generalPosition.clone().setX(value) }
          : p;
      } else if (field === "y") {
        return p.id === row.id
          ? { ...p, generalPosition: p.generalPosition.clone().setY(value) }
          : p;
      } else if (field === "z") {
        return p.id === row.id
          ? { ...p, generalPosition: p.generalPosition.clone().setZ(value) }
          : p;
      }
      return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function changeLength(row: TProcessElementPoint, value: number) {
    const points = item.points.map((p) => {
      if (p.id === row.id) {
        return {
          ...p,
          generalPosition: getPosByDistance(
            value,
            p.startPosition,
            p.generalPosition
          ),
        };
      } else return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function changeElevation(row: TProcessElementPoint, value: number) {
    const points = item.points.map((p) => {
      if (p.id === row.id) {
        return {
          ...p,
          startPosition: p.startPosition.clone().setY(value),
          generalPosition: p.generalPosition.clone().setY(value),
        };
      } else return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function changeTheta(row: TProcessElementPoint, old: number, value: number) {
    const points = item.points.map((p) => {
      if (p.id === row.id) {
        return {
          ...p,
          generalPosition: fixVectorByOrientation(
            p.startPosition,
            fixVectorByOrientation(p.startPosition, p.generalPosition, -old),
            value
          ),
        };
      } else return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  //add elastic (K) value to the equipment Lug point
  function addvalue(row: TProcessElementPoint, value: number) {}

  function changeInclination(
    row: TProcessElementPoint,
    old: number,
    value: number
  ) {
    const points = item.points.map((p) => {
      if (p.id === row.id) {
        const theta = getTheta(p);
        const v = fixVectorByOrientation(
          p.startPosition,
          p.generalPosition,
          -theta
        );
        v.copy(fixVectorByOrientation(p.startPosition, v, old, "z"));
        v.copy(fixVectorByOrientation(p.startPosition, v, value, "z"));
        v.copy(fixVectorByOrientation(p.startPosition, v, theta));
        return {
          ...p,
          generalPosition: v.clone(),
        };
      } else return p;
    });
    const changed = { ...item, points };
    onChange(changed, selected);
  }

  function drawRow(row: TProcessElementPoint) {
    const width = "50px";
    const length = roundM(row.startPosition.distanceTo(row.generalPosition));
    const elevation = roundM(row.startPosition.y);
    const theta = getTheta(row);
    const inclination = getInclination(row);
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.id === selected?.id}
          onChange={() =>
            row.id === selected?.id ? setSelected(undefined) : setSelected(row)
          }
        />
        <CheckBoxCell
          key={`${row.id}-fixed`}
          value={row.isFixed}
          onChange={(isFixed) => handleChange({ ...row, isFixed })}
        />
        <SelectorCell<"START" | "END">
          items={["START", "END"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.LugType}
          onSelect={(LugType) => handleChange({ ...row, LugType })}
          disabled={!!row.element || row.isFixed}
          clearable={true}
        />
        <td>{row.element}</td>
        {isTank || isDrum ? (
        <SelectorCell<number>
            items={[-270, -180, -90, 0, 90, 180, 270]}
            itemKey={(item) => item}
            itemLabel={(item) => `${item}`}
            selected={row.orientation}
            onSelect={(val) => handleChangeOrientation(row, val)}
          />
        ) : null}
        {isDrum ? (
          <SelectorCell<string>
            items={["Vertical", "Horizontal"]}
            itemKey={(item) => item}
            itemLabel={(item) => item}
            selected={row.isVertical ? "Vertical" : "Horizontal"}
            onSelect={(val) => handleChangePosition(row, val === "Vertical")}
          />
        ) : null}
        <NumericCell
          isDecimal={true}
          value={row.startPosition.x}
          onChange={(val) => changeStartPosition(row, "x", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={row.startPosition.y}
          onChange={(val) => changeStartPosition(row, "y", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={row.startPosition.z}
          onChange={(val) => changeStartPosition(row, "z", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={row.generalPosition.x}
          onChange={(val) => changeGeneralPosition(row, "x", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={row.generalPosition.y}
          onChange={(val) => changeGeneralPosition(row, "y", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={row.generalPosition.z}
          onChange={(val) => changeGeneralPosition(row, "z", val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={length}
          onChange={(val) => changeLength(row, val)}
          style={{ width }}
        />
        <NumericCell
          isDecimal={true}
          value={elevation}
          onChange={(val) => changeElevation(row, val)}
          style={{ width }}
        />
        <NumericCell
          min={-180}
          max={180}
          value={theta}
          onChange={(val) => changeTheta(row, theta, val)}
          style={{ width }}
        />
        <NumericCell
          min={-90}
          max={90}
          value={inclination}
          onChange={(val) => changeInclination(row, inclination, -val)}
          style={{ width }}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      item.points.map((p) => {
        return {
          id: p.id,
          "Is Fixed": p.isFixed ? 1 : 0,
          "Lug Type": p.LugType ?? "",
          Element: p.element ?? "",
          "Orientation (deg)": p.orientation,
          "Is Vertical": p.isVertical ? 1 : 0,
          "Start Pos X (m)": fixNumberToStr(p.startPosition.x),
          "Start Pos Y (m)": fixNumberToStr(p.startPosition.y),
          "Start Pos Z (m)": fixNumberToStr(p.startPosition.z),
          "End Pos X (m)": fixNumberToStr(p.generalPosition.x),
          "End Pos Y (m)": fixNumberToStr(p.generalPosition.y),
          "End Pos Z (m)": fixNumberToStr(p.generalPosition.z),
          "С/S Lib": p.lib ?? "",
          NPS: p.nps ?? "",
          Schedule: p.profile?.schedule ?? "",
          "Outer Diameter (mm)": fixNumberToStr(
            p.profile?.outside_diameter_global ?? p.od_MM ?? 0
          ),
          "Wall Thickness (mm)": fixNumberToStr(
            p.profile?.wall_thickness_global ?? p.wt_MM ?? 0
          ),
          Material: p.material?.material_name ?? "",
          "Flange Type": p.flangeType ?? "",
          "Flange Class": p.flangeClass ?? "",
          "Flange Material": p.flange?.material ?? "",
        };
      }),
      `Equipment Lug Points`
    );
  }

  function handleImport() {
    importFromCSV((data, isCSV) => {
      if (!isCSV) return;
      const newRows: TProcessElementPoint[] = [];
      for (const item of data) {
        if (item.id === undefined || item.id === null) break;
        const lib = item["С/S Lib"]?.trim();
        const nps = item["NPS"] !== " " ? `${item["NPS"]}` : undefined;
        const profile = resoures.pipingSS
          .filter((p) => p.outside_diameter_global && p.wall_thickness_global)
          .find(
            (p) =>
              p.country_code === lib &&
              p.nominal_pipe_size_inch === nps &&
              p.schedule === item["Schedule"]
          );
        const flangeClass = item["Flange Class"]
          ? Number.parseInt(item["Flange Class"])
          : undefined;
        const newRow: TProcessElementPoint = {
          id: getNextId(newRows),
          isFixed: new Boolean(item["Is Fixed"]).valueOf() === true,
          isVertical: new Boolean(item["Is Vertical"]).valueOf() === true,
          LugType: item["Lug Type"]?.trim() === "END" ? "END" : "START",
          element:
            item["Element"]?.trim() === "�" ? "" : item["Element"]?.trim(),
          orientation: checkImportedNumber(item["Orientation (deg)"]) ?? 0,
          startPosition: new Vector3(
            checkImportedNumber(item["Start Pos X (m)"]) ?? 0,
            checkImportedNumber(item["Start Pos Y (m)"]) ?? 0,
            checkImportedNumber(item["Start Pos Z (m)"]) ?? 0
          ),
          generalPosition: new Vector3(
            checkImportedNumber(item["End Pos X (m)"]) ?? 0,
            checkImportedNumber(item["End Pos Y (m)"]) ?? 0,
            checkImportedNumber(item["End Pos Z (m)"]) ?? 0
          ),
          lib,
          nps,
          profile,
          od_MM:
            profile?.outside_diameter_global ??
            checkImportedNumber(item["Outer Diameter (mm)"]) ??
            0,
          wt_MM:
            profile?.wall_thickness_global ??
            checkImportedNumber(item["Wall Thickness (mm)"]) ??
            0,
          material: resoures.materials.find(
            (m) => m.material_name === item["Material"]
          ),
          flangeType: item["Flange Type"]?.trim(),
          flangeClass,
          flange: getFlanges(resoures, item["Flange Type"])
            .filter((f) => f.nps === nps && f.class === flangeClass)
            .find((f) => f.material === item["Flange Material"]),
        };
        newRows.push(newRow);
      }
      onChange({ ...item, points: [...newRows] }, selected);
    });
  }

  return (
    <>
      <CustomDlg
        title={"Lug Details"}
        isMinimize={true}
        zIndex={5}
        position={"center"}
        body={
          <div className={"d-flex f-column f-grow bg-dark"}>
            <div className="hr" />
            <div className="label-light bg-dark">
              <Button
                small
                icon="trash"
                text="Delete"
                intent="warning"
                onClick={handleDelete}
                disabled={
                  !selected ||
                  selected.isFixed ||
                  item.points.length <= item.pointsConfig.min
                }
              />
              <Button
                small
                icon="cross"
                text="Clear"
                intent="warning"
                disabled={!selected}
                onClick={handleClear}
              />
              <Button
                small
                icon="export"
                text="Export to CSV"
                intent="success"
                onClick={handleExport}
              />
              <Button
                small
                icon="import"
                text="Import from CSV"
                intent="success"
                onClick={handleImport}
              />
            </div>
            <div className="hr" />
            <div className="p-5">
              <div className={"small-table-container"}>
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <th rowSpan={3} />
                      <th rowSpan={3}>Fixed</th>
                      <th rowSpan={3}>Lug Type</th>
                      <th rowSpan={3}>Connected Element</th>
                      {isTank || isDrum ? (
                        <th rowSpan={3}>Orientation</th>
                      ) : null}
                      {isDrum ? <th rowSpan={3}>Position</th> : null}
                      <th colSpan={6}>From Center of Equipment, m</th>
                      <th rowSpan={3}>Length, m</th>
                      <th rowSpan={3}>Elevation, m</th>
                      <th rowSpan={3}>Theta, deg</th>
                      <th rowSpan={3}>Inclination, deg</th>
                      <th rowSpan={3}>Nozzle Data</th>
                      <th rowSpan={3}>Flange Data</th>
                    </tr>
                    <tr>
                      <th colSpan={3} style={{ top: offsetTop1 }}>
                        Start Position
                      </th>
                      <th colSpan={3} style={{ top: offsetTop1 }}>
                        End Position
                      </th>
                    </tr>
                    <tr>
                      <th style={{ top: offsetTop2 }}>X</th>
                      <th style={{ top: offsetTop2 }}>Y</th>
                      <th style={{ top: offsetTop2 }}>Z</th>

                      <th style={{ top: offsetTop2 }}>X</th>
                      <th style={{ top: offsetTop2 }}>Y</th>
                      <th style={{ top: offsetTop2 }}>Z</th>
                    </tr>
                  </thead>
                  <tbody>{item.points.map(drawRow)}</tbody>
                </table>
              </div>
            </div>
          </div>
        }
        onClose={onClose}
      />
      {dlg}
    </>
  );
}

export function getTheta(row: TProcessElementPoint) {
  const dir = new Vector3(1);
  const end = row.generalPosition.clone().sub(row.startPosition);
  end.setY(0);
  end.normalize();
  const angle = end.angleTo(dir);
  return round(radToDeg(end.z > 0 ? -angle : angle));
}

export function getInclination(row: TProcessElementPoint) {
  const dir = new Vector3(0, -1);
  const end = row.generalPosition.clone().sub(row.startPosition);
  end.normalize();
  const angle = end.angleTo(dir) - deg90InRad;
  return round(radToDeg(angle));
}
