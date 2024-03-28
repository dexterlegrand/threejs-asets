import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  PipeRack,
  PipeRackColumn,
  DesignMethod,
  CircularSF,
} from "../../../../../store/main/types";
import { changeModel } from "../../../../../store/main/actions";
import { useDispatch } from "react-redux";
import { designMethods } from "../../../../../store/main/constants";
import { getElementByName, getTopOffset, MMtoM } from "../../../../3d-models/utils";
import { InputCell } from "../../../../common/InputCell";
import {
  splitColumnsBySpliceFlanges,
  concatColumns,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[] };

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  column?: PipeRackColumn;
  elevation: number;
  dMethod?: DesignMethod;
  bPlateThickness?: number;
  bPlateDiameter?: number;
  bBottomPlateThickness?: number;
  bBottomPlateDiameter?: number;
  grade?: string;
  boltDiameter?: number;
  boltBCD?: number;
  boltNos?: number;
  tension?: number;
  shear?: number;
  sPlateThickness?: number;
  sPlateHeight?: number;
  sPlateWidth?: number;
  sPlateNos?: number;
};

const Circular: FunctionComponent<Props> = (props) => {
  const { models } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    let lastId = 0;
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.flanges.forEach((bp) => {
        if (bp.type === "Circular") {
          const flange = { ...bp } as CircularSF;
          newRows.push({
            id: flange.id,
            selected: false,
            pr: model,
            column: model.columns.find((c) => c.name === flange.column),
            elevation: flange.elevation,
            dMethod: flange.designMethod,
            bPlateThickness: flange.bPlateThickness,
            bPlateDiameter: flange.bPlateDiameter,
            bBottomPlateThickness: flange.bBottomPlateThickness,
            bBottomPlateDiameter: flange.bBottomPlateDiameter,
            grade: flange.grade,
            boltDiameter: flange.boltDiameter,
            boltBCD: flange.boltBCD,
            boltNos: flange.boltNos,
            tension: flange.tension,
            shear: flange.shear,
            sPlateThickness: flange.sPlateThickness,
            sPlateHeight: flange.sPlateHeight,
            sPlateWidth: flange.sPlateWidth,
            sPlateNos: flange.sPlateNos,
          });
          if (flange.id > lastId) lastId = flange.id;
        }
      })
    );
    setRows([...rows.filter((row) => !validRow(row)), ...newRows].sort((a, b) => a.id - b.id));
    setRowIndex(++lastId);
  }, [models]);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!init) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const flanges = vRows
          .filter((row) => row.pr!.name === model.name)
          .map((row) => {
            return {
              id: row.id,
              name: `CSF-${row.column!.name}`,
              parent: row.column!.parent,
              type: "Circular",
              column: row.column!.name,
              elevation: row.elevation,
              designMethod: row.dMethod!,
              bPlateThickness: row.bPlateThickness,
              bPlateDiameter: row.bPlateDiameter,
              bBottomPlateThickness: row.bBottomPlateThickness,
              bBottomPlateDiameter: row.bBottomPlateDiameter,
              grade: row.grade,
              boltDiameter: row.boltDiameter,
              boltBCD: row.boltBCD,
              boltNos: row.boltNos,
              tension: row.tension,
              shear: row.shear,
              sPlateThickness: row.sPlateThickness,
              sPlateHeight: row.sPlateHeight,
              sPlateWidth: row.sPlateWidth,
              sPlateNos: row.sPlateNos,
            } as CircularSF;
          });
        !equalPlates(model.flanges as CircularSF[], flanges) &&
          dispatch(
            changeModel({
              ...model,
              columns: splitColumnsBySpliceFlanges(concatColumns(model.columns), flanges),
              flanges,
            } as PipeRack)
          );
      });
    } else setInit(false);
  }, [rows]);

  function validRow(row: RowData) {
    return (
      row.pr &&
      row.column &&
      row.bPlateThickness &&
      row.bPlateDiameter &&
      row.bBottomPlateThickness &&
      row.bBottomPlateDiameter &&
      row.boltDiameter &&
      row.boltBCD &&
      row.boltNos &&
      row.tension &&
      row.shear &&
      row.sPlateThickness &&
      row.sPlateHeight &&
      row.sPlateWidth &&
      row.sPlateNos
    );
  }

  function equalPlates(items: CircularSF[], newItems: CircularSF[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].column !== newItems[i].column) return false;
      if (items[i].designMethod !== newItems[i].designMethod) return false;
      if (items[i].bPlateThickness !== newItems[i].bPlateThickness) return false;
      if (items[i].bPlateDiameter !== newItems[i].bPlateDiameter) return false;
      if (items[i].bPlateDiameter !== newItems[i].bPlateDiameter) return false;
      if (items[i].bBottomPlateThickness !== newItems[i].bBottomPlateThickness) return false;
      if (items[i].bBottomPlateDiameter !== newItems[i].bBottomPlateDiameter) return false;
      if (items[i].grade !== newItems[i].grade) return false;
      if (items[i].boltDiameter !== newItems[i].boltDiameter) return false;
      if (items[i].boltBCD !== newItems[i].boltBCD) return false;
      if (items[i].boltNos !== newItems[i].boltNos) return false;
      if (items[i].tension !== newItems[i].tension) return false;
      if (items[i].shear !== newItems[i].shear) return false;
      if (items[i].sPlateThickness !== newItems[i].sPlateThickness) return false;
      if (items[i].sPlateHeight !== newItems[i].sPlateHeight) return false;
      if (items[i].sPlateWidth !== newItems[i].sPlateWidth) return false;
      if (items[i].sPlateNos !== newItems[i].sPlateNos) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false, elevation: 0 }]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, pr, column: undefined } : item)));
  }

  function handleChangeColumn(row: RowData, column?: PipeRackColumn) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              column,
              elevation: column ? (column.startPos.y + column.endPos.y) / 2 : 0,
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getFirstColumnY(row: RowData) {
    if (!row.column) return undefined;
    return row.column.startPos.y + 0.1 + MMtoM(row.bBottomPlateThickness ?? 0);
  }

  function getLastColumnY(row: RowData) {
    if (!row.pr || !row.column) return undefined;
    let result = row.column;
    while (result.next) {
      const next = getElementByName(row.pr.columns, result.next);
      if (next) {
        result = next;
      } else break;
    }
    return result.endPos.y - 0.1 - MMtoM(row.bPlateThickness ?? 0);
  }

  function getRow(row: RowData, i: number, arr: RowData[]) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={row.pr}
          onSelect={(value) => handleChangePR(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackColumn>
          items={(row.pr?.columns ?? []).filter((column) => {
            const shape = column.profile.shape?.trim().toUpperCase();
            return (
              (shape === "O" ||
                shape === "PIPE" ||
                shape === "OC PIPES" ||
                shape === "HSS ROUND" ||
                shape === "TUBE" ||
                shape === "CIRCULAR HOLLOW" ||
                shape === "SOLID ROUND") &&
              !arr.some(
                (r) => r.pr?.name === row.pr!.name && r.column && r.column.name === column.name
              )
            );
          })}
          selected={row.column}
          onSelect={(value) => handleChangeColumn(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <td>{row.column?.profile?.designation}</td>
        <NumericCell
          className="w-80"
          min={getFirstColumnY(row)}
          max={getLastColumnY(row)}
          isDecimal={true}
          value={row.elevation}
          onChange={(value) => handleChangeRow(row, "elevation", value)}
        />
        <SelectorCell<DesignMethod>
          items={designMethods}
          selected={row.dMethod}
          onSelect={(value) => handleChangeRow(row, "dMethod", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          className="w-80"
          value={row.bPlateThickness}
          onChange={(value) => handleChangeRow(row, "bPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bPlateDiameter}
          onChange={(value) => handleChangeRow(row, "bPlateDiameter", value)}
        />
        <NumericCell
          className="w-80"
          value={row.bBottomPlateThickness}
          onChange={(value) => handleChangeRow(row, "bBottomPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bBottomPlateDiameter}
          onChange={(value) => handleChangeRow(row, "bBottomPlateDiameter", value)}
        />
        <InputCell
          className="w-60"
          value={row.grade}
          onChange={(value) => handleChangeRow(row, "grade", value)}
        />
        <NumericCell
          className="w-60"
          value={row.boltDiameter}
          onChange={(value) => handleChangeRow(row, "boltDiameter", value)}
        />
        <NumericCell
          className="w-60"
          value={row.boltBCD}
          onChange={(value) => handleChangeRow(row, "boltBCD", value)}
        />
        <NumericCell
          className="w-50"
          value={row.boltNos}
          onChange={(value) => handleChangeRow(row, "boltNos", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.tension}
          onChange={(value) => handleChangeRow(row, "tension", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.shear}
          onChange={(value) => handleChangeRow(row, "shear", value)}
        />
        <NumericCell
          className="w-80"
          value={row.sPlateThickness}
          onChange={(value) => handleChangeRow(row, "sPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.sPlateHeight}
          onChange={(value) => handleChangeRow(row, "sPlateHeight", value)}
        />
        <NumericCell
          className="w-60"
          value={row.sPlateWidth}
          onChange={(value) => handleChangeRow(row, "sPlateWidth", value)}
        />
        <NumericCell
          className="w-50"
          value={row.sPlateNos}
          onChange={(value) => handleChangeRow(row, "sPlateNos", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="d-flex f-ai-center label-light bg-dark">
        <span>Circular</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}>{""}</th>
                <th rowSpan={2}>PR No.</th>
                <th rowSpan={2}>Column No.</th>
                <th rowSpan={2}>Column Profile</th>
                <th rowSpan={2}>Elevation (m)</th>
                <th rowSpan={2}>Design Method</th>
                <th colSpan={2}>Top Splice Plate</th>
                <th colSpan={2}>Bottom Splice Plate</th>
                <th colSpan={2}>Splice Bolt Size</th>
                <th colSpan={2}>Splice Bolt Location</th>
                <th colSpan={2}>Splice Bolt Capacity</th>
                <th colSpan={4}>Stiffener Plate</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Grade</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>BCD (mm)</th>
                <th style={{ top: offsetTop }}>Nos</th>
                <th style={{ top: offsetTop }}>Tension (kN)</th>
                <th style={{ top: offsetTop }}>Shear (kN)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Height (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Nos</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Circular;
