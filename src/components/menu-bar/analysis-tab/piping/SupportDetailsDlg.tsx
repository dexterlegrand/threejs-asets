import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { TSupportDetail, FreePipe } from "../../../../store/main/types";
import { CustomDlg } from "../../../common/CustomDlg";
import { NumericCell } from "../../../common/NumericCell";
import { SelectorCell } from "../../../common/SelectorCell";
import {
  fixNumberToStr,
  exportToCSV,
  importFromCSV,
  strFilter,
  getTopOffset,
  getNextId,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { SupportValuesDetails } from "./SupportValuesDetails";
import { getFullReleases } from "../../../3d-models/pipes/pipesUtils";

type Props = {
  pipe: FreePipe;
  pipes: FreePipe[];
  onClose: () => any;
  onSave: (elements: TSupportDetail[]) => any;
};

const types = ["Anchor", "Sliding", "Custom", "Custom+", "Custom-", "Slave Node", "Hanger"];

const directions = ["X", "Y", "Z", "RX", "RY", "RZ"];

const valueTypes = ["K", "δ allow.", "δ appl."];

const R = "Released";

export function SupportDetailsDlg(props: Props) {
  const { pipe, pipes, onClose, onSave } = props;

  const [dialog, setDialog] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [rows, setRows] = useState<TSupportDetail[]>([]);

  const invalid = useMemo(() => {
    return rows.some((r) => !types.some((val) => val === r.type));
  }, [rows]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [rows.length]);

  useEffect(() => {
    setRows((pipe.params.supportDetails ?? []).map((el) => ({ ...el, selected: false })));
  }, [pipe]);

  function handleChange(item: TSupportDetail, field: string, value: any) {
    let changed = { ...item, [field]: value };
    if (field === "type" || field === "direction" || field === "valueType") {
      changed = getFullReleases(changed);
    }
    if (field === "direction" || field === "distance") {
      const byDir = rows.find(
        (s) => s.distance === changed.distance && s.direction === changed.direction
      );
      changed = { ...changed, Mu: byDir?.Mu ?? changed.Mu };
    }
    if (field === "Mu") {
      setRows(
        rows.map((row) => {
          return row.id === item.id
            ? changed
            : row.distance === changed.distance && row.direction === changed.direction
            ? { ...row, Mu: value }
            : row;
        })
      );
    } else {
      setRows(
        rows.map((row) => {
          return row.id === item.id ? changed : row;
        })
      );
    }
  }

  function getRow(row: TSupportDetail) {
    const isK = row.valueType === "K";
    const isSlave = row.type === "Slave Node";
    const isSliding = row.type === "Sliding";
    const isHanger = row.type === "Hanger";
    const masterNodePipe =
      isSlave && row.masterNodePipe ? pipes.find((p) => p.pipe === row.masterNodePipe) : undefined;
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={(row as any).selected}
          onChange={(val) => handleChange(row, "selected", val)}
        />
        <td>{row.id}</td>
        <SelectorCell<string>
          items={types}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.type}
          validator={(value) => types.some((val) => val === value)}
          validationPrompt={`Not found!`}
          onSelect={(value) => handleChange(row, "type", value)}
          className={"w-100"}
        />
        <SelectorCell<string>
          items={directions.filter((d) => !d.includes(R))}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.direction}
          validator={(value) => directions.includes(value)}
          validationPrompt={`Not found!`}
          disabled={row.type === "Anchor" || row.type === "Slave Node"}
          onSelect={(value) => handleChange(row, "direction", value)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          min={0}
          max={pipe.length}
          value={row.distance}
          onChange={(value) => handleChange(row, "distance", value)}
          className={"w-100"}
        />
        <SelectorCell<string>
          items={valueTypes}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.valueType}
          validator={(value) => valueTypes.includes(value)}
          validationPrompt={`Not found!`}
          disabled={!row.type.includes("Custom")}
          onSelect={(value) => handleChange(row, "valueType", value)}
          className={"w-100"}
        />
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            disabled={isHanger}
            onClick={() => {
              setDialog(
                <SupportValuesDetails
                  supp={row}
                  onClose={() => setDialog(undefined)}
                  onSave={(changed) => {
                    setRows(rows.map((r) => (r.id === changed.id ? changed : r)));
                    setDialog(undefined);
                  }}
                />
              );
            }}
          />
        </td>
        <NumericCell
          min={isK && !isSliding ? 0 : undefined}
          max={isK && !isSliding ? 0 : undefined}
          value={row.Mu}
          isDecimal={true}
          disabled={isK && !isSliding}
          onChange={(val) => handleChange(row, "Mu", val)}
          className={"w-100"}
        />
        <SelectorCell<string>
          items={pipes.filter((p) => p.line === pipe.line && p.id !== pipe.id).map((p) => p.pipe)}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={row.masterNodePipe}
          disabled={!isSlave}
          onSelect={(val) => handleChange(row, "masterNodePipe", val)}
          filter={strFilter}
        />
        <NumericCell
          min={0}
          max={masterNodePipe?.length}
          value={row.masterNodeDist}
          isDecimal={true}
          disabled={!isSlave}
          onChange={(val) => handleChange(row, "masterNodeDist", val)}
          className={"w-100"}
        />
      </tr>
    );
  }

  function handleDelete() {
    setRows((prev) => prev.filter((el) => !(el as any).selected));
  }

  function handleAdd() {
    setRows((prev) => [
      ...prev,
      {
        id: getNextId(prev),
        type: "Anchor",
        selected: false,
        distance: 0,
        valueType: "K",
        Mu: 0,
      },
    ]);
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          id: row.id,
          Type: row.type,
          Direction: row.direction,
          "Distance from Pipe start": fixNumberToStr(row.distance),
          "Values Type": row.valueType,
          x: row?.x ? (row.x === R ? R : fixNumberToStr(row.x)) : "",
          y: row?.y ? (row.y === R ? R : fixNumberToStr(row.y)) : "",
          z: row?.z ? (row.z === R ? R : fixNumberToStr(row.z)) : "",
          Rx: row?.Rx ? (row.Rx === R ? R : fixNumberToStr(row.Rx)) : "",
          Ry: row?.Ry ? (row.Ry === R ? R : fixNumberToStr(row.Ry)) : "",
          Rz: row?.Rz ? (row.Rz === R ? R : fixNumberToStr(row.Rz)) : "",
          Mu: fixNumberToStr(row.Mu),
          "Master Node at Pipe": row.masterNodePipe ?? "",
          "Master Node at Dist from start (m)": fixNumberToStr(row.masterNodeDist),
        };
      }),
      "Pipe Support Details"
    );
  }

  function getRelease(type: string, value: any, dir?: "X" | "Y" | "Z") {
    if (type.includes("Custom")) {
      return value ? (value === R ? R : `${Number(value) || 0}`) : undefined;
    } else if (type === "Sliding" && dir === "X") {
      return R;
    } else if (type === "Sliding" && dir === "Y") {
      return R;
    } else if (type === "Sliding" && dir === "Z") {
      return R;
    }
    return undefined;
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const supportDetails: TSupportDetail[] = [];
      for (const item of imported) {
        if (item.id === undefined || item.id === null) continue;
        supportDetails.push({
          id: supportDetails.length + 1,
          type: item.Type,
          direction: item.Direction,
          distance: checkImportedNumber(item["Distance from Pipe start"], false) ?? 0,
          valueType: item["Values Type"],
          x: getRelease(item.Type, item.x, "X"),
          y: getRelease(item.Type, item.y, "Y"),
          z: getRelease(item.Type, item.z, "Z"),
          Rx: getRelease(item.Type, item.Rx),
          Ry: getRelease(item.Type, item.Ry),
          Rz: getRelease(item.Type, item.Rz),
          Mu: item.Mu ?? 0,
          masterNodePipe: item["Master Node at Pipe"],
          masterNodeDist: checkImportedNumber(item["Master Node at Dist from start (m)"], false),
        });
      }
      setRows(supportDetails);
    });
  }

  return (
    <>
      <CustomDlg
        title={`Support Details of Pipe "${pipe.pipe}"`}
        zIndex={11}
        onClose={onClose}
        body={
          <div className="d-flex f-column">
            <div className="hr" />
            <div className="label-light bg-dark" style={{ paddingRight: 10 }}>
              <Button
                small
                icon={"trash"}
                text={"Delete"}
                intent={"warning"}
                onClick={handleDelete}
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
              <Button small icon={"plus"} text={"Add"} intent={"danger"} onClick={handleAdd} />
            </div>
            <div className="hr" />
            <div className="p-5 bg-dark">
              <div className={"small-table-container"}>
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <GeneralCheckBoxCell rowSpan={2} data={rows} onChange={setRows} />
                      <th rowSpan={2}>No.</th>
                      <th rowSpan={2}>Type</th>
                      <th rowSpan={2}>Direction</th>
                      <th rowSpan={2}>Distance from Pipe start (m)</th>
                      <th rowSpan={2}>K / δ</th>
                      <th rowSpan={2}>K / δ details</th>
                      <th rowSpan={2}>µ</th>
                      <th colSpan={2}>Master Node at</th>
                    </tr>
                    <tr>
                      <th style={{ top: offsetTop }}>Pipe</th>
                      <th style={{ top: offsetTop }}>Dist. from start (m)</th>
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
              text="Save"
              disabled={invalid}
              onClick={() => onSave(rows)}
              intent={"primary"}
            />
          </>
        }
      />
      {dialog}
    </>
  );
}
