import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  PipeRack,
  DesignMethod,
  PipeRackColumn,
  RectangularSF,
} from "../../../../../store/main/types";
import { changeModel } from "../../../../../store/main/actions";
import { useDispatch } from "react-redux";
import { designMethods, stiffenerCounts, boltCounts } from "../../../../../store/main/constants";
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
  bPlateLength?: number;
  bPlateWidth?: number;
  bBottomPlateThickness?: number;
  bBottomPlateLength?: number;
  bBottomPlateWidth?: number;
  grade?: string;
  boltDiameter?: number;
  alongLength?: number;
  alongWidth?: number;
  firstRow_L?: number;
  RtoR_L?: number;
  firstRow_W?: number;
  RtoR_W?: number;
  tension?: number;
  shear?: number;
  sPlateThickness?: number;
  sPlateHeight?: number;
  alongWeb?: number;
  alongFlange?: number;
};

const Rectangular: FunctionComponent<Props> = (props) => {
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
        if (bp.type === "Rectangular") {
          const flange = { ...bp } as RectangularSF;
          newRows.push({
            id: flange.id,
            selected: false,
            pr: model,
            column: model.columns.find((c) => c.name === flange.column),
            elevation: flange.elevation,
            dMethod: flange.designMethod,
            bPlateThickness: flange.bPlateThickness,
            bPlateLength: flange.bPlateLength,
            bPlateWidth: flange.bPlateWidth,
            bBottomPlateThickness: flange.bBottomPlateThickness,
            bBottomPlateLength: flange.bBottomPlateLength,
            bBottomPlateWidth: flange.bBottomPlateWidth,
            grade: flange.grade,
            boltDiameter: flange.boltDiameter,
            alongLength: flange.alongLength,
            alongWidth: flange.alongWidth,
            firstRow_L: flange.firstRow_L,
            RtoR_L: flange.RtoR_L,
            firstRow_W: flange.firstRow_W,
            RtoR_W: flange.RtoR_W,
            tension: flange.tension,
            shear: flange.shear,
            sPlateThickness: flange.sPlateThickness,
            sPlateHeight: flange.sPlateHeight,
            alongFlange: flange.alongFlange,
            alongWeb: flange.alongWeb,
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
              name: `RBP-${row.column!.name}`,
              parent: row.column!.parent,
              type: "Rectangular",
              column: row.column!.name,
              elevation: row.elevation,
              designMethod: row.dMethod!,
              bPlateThickness: row.bPlateThickness,
              bPlateLength: row.bPlateLength,
              bPlateWidth: row.bPlateWidth,
              bBottomPlateThickness: row.bBottomPlateThickness,
              bBottomPlateLength: row.bBottomPlateLength,
              bBottomPlateWidth: row.bBottomPlateWidth,
              grade: row.grade,
              boltDiameter: row.boltDiameter,
              alongLength: row.alongLength,
              alongWidth: row.alongWidth,
              firstRow_L: row.firstRow_L,
              RtoR_L: row.RtoR_L,
              firstRow_W: row.firstRow_W,
              RtoR_W: row.RtoR_W,
              tension: row.tension,
              shear: row.shear,
              sPlateThickness: row.sPlateThickness,
              sPlateHeight: row.sPlateHeight,
              alongFlange: row.alongFlange,
              alongWeb: row.alongWeb,
            } as RectangularSF;
          });
        !equalPlates(model.flanges as RectangularSF[], flanges) &&
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
      row.bPlateLength &&
      row.bPlateWidth &&
      row.bBottomPlateThickness &&
      row.bBottomPlateLength &&
      row.bBottomPlateWidth &&
      row.grade &&
      row.boltDiameter &&
      row.alongLength &&
      row.alongWidth &&
      row.firstRow_L &&
      row.RtoR_L &&
      row.firstRow_W &&
      row.RtoR_W &&
      row.tension &&
      row.shear &&
      row.sPlateThickness &&
      row.sPlateHeight &&
      row.alongWeb &&
      row.alongFlange
    );
  }

  function equalPlates(items: RectangularSF[], newItems: RectangularSF[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].column !== newItems[i].column) return false;
      if (items[i].designMethod !== newItems[i].designMethod) return false;
      if (items[i].elevation !== newItems[i].elevation) return false;
      if (items[i].bPlateThickness !== newItems[i].bPlateThickness) return false;
      if (items[i].bPlateLength !== newItems[i].bPlateLength) return false;
      if (items[i].bPlateWidth !== newItems[i].bPlateWidth) return false;
      if (items[i].bBottomPlateThickness !== newItems[i].bBottomPlateThickness) return false;
      if (items[i].bBottomPlateLength !== newItems[i].bBottomPlateLength) return false;
      if (items[i].bBottomPlateWidth !== newItems[i].bBottomPlateWidth) return false;
      if (items[i].grade !== newItems[i].grade) return false;
      if (items[i].boltDiameter !== newItems[i].boltDiameter) return false;
      if (items[i].tension !== newItems[i].tension) return false;
      if (items[i].shear !== newItems[i].shear) return false;
      if (items[i].alongLength !== newItems[i].alongLength) return false;
      if (items[i].alongWidth !== newItems[i].alongWidth) return false;
      if (items[i].firstRow_L !== newItems[i].firstRow_L) return false;
      if (items[i].RtoR_L !== newItems[i].RtoR_L) return false;
      if (items[i].firstRow_W !== newItems[i].firstRow_W) return false;
      if (items[i].RtoR_W !== newItems[i].RtoR_W) return false;
      if (items[i].sPlateThickness !== newItems[i].sPlateThickness) return false;
      if (items[i].sPlateHeight !== newItems[i].sPlateHeight) return false;
      if (items[i].alongWeb !== newItems[i].alongWeb) return false;
      if (items[i].alongFlange !== newItems[i].alongFlange) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        id: rowIndex,
        selected: false,
        dMethod: "Method 1",
        elevation: 0,
        bPlateThickness: 20,
        bPlateLength: 500,
        bPlateWidth: 500,
        bBottomPlateThickness: 20,
        bBottomPlateLength: 500,
        bBottomPlateWidth: 500,
        grade: "1",
        boltDiameter: 20,
        alongLength: 4,
        alongWidth: 4,
        firstRow_L: 50,
        RtoR_L: 100,
        firstRow_W: 50,
        RtoR_W: 100,
        tension: 1,
        shear: 1,
        sPlateThickness: 20,
        sPlateHeight: 200,
        alongWeb: 3,
        alongFlange: 3,
      },
    ]);
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
      rows.map((item) => {
        if (item.id === row.id) {
          let secondColumn = item.pr?.columns.find((c) => c.name === column?.next);
          if (column && !secondColumn) {
            secondColumn = item.pr?.columns.find(
              (c) =>
                c.tier === column.tier + 1 &&
                c.startPos.x === column.startPos.x &&
                c.startPos.z === column.startPos.z
            );
          }
          const length = Math.max(
            secondColumn?.profile.d_global ?? 0,
            column?.profile.d_global ?? 0
          );
          const width = Math.max(
            secondColumn?.profile.bf_global ?? 0,
            column?.profile.bf_global ?? 0
          );
          return {
            ...row,
            column,
            elevation: column ? (column.startPos.y + column.endPos.y) / 2 : 0,
            bPlateLength: length + 100,
            bPlateWidth: width + 100,
            bBottomPlateLength: length + 100,
            bBottomPlateWidth: width + 100,
          };
        } else return item;
      })
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
          items={models.filter((model) => model.portalColProfile.shape === "I")}
          selected={row.pr}
          onSelect={(value) => handleChangePR(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackColumn>
          items={(row.pr?.columns ?? []).filter((column) => {
            return (
              column.profile.shape === "I" &&
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
        <td>{row.column?.profile.designation}</td>
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
          value={row.bPlateLength}
          onChange={(value) => handleChangeRow(row, "bPlateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bPlateWidth}
          onChange={(value) => handleChangeRow(row, "bPlateWidth", value)}
        />
        <NumericCell
          className="w-80"
          value={row.bBottomPlateThickness}
          onChange={(value) => handleChangeRow(row, "bBottomPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bBottomPlateLength}
          onChange={(value) => handleChangeRow(row, "bBottomPlateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bBottomPlateWidth}
          onChange={(value) => handleChangeRow(row, "bBottomPlateWidth", value)}
        />
        <InputCell
          className="w-60"
          value={row.grade}
          onChange={(value) => handleChangeRow(row, "grade", value)}
        />
        <NumericCell
          className="w-50"
          value={row.boltDiameter}
          onChange={(value) => handleChangeRow(row, "boltDiameter", value)}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={row.alongLength}
          onSelect={(value) => handleChangeRow(row, "alongLength", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={row.alongWidth}
          onSelect={(value) => handleChangeRow(row, "alongWidth", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          className="w-60"
          value={row.firstRow_L}
          onChange={(value) => handleChangeRow(row, "firstRow_L", value)}
        />
        <NumericCell
          className="w-100"
          value={row.RtoR_L}
          onChange={(value) => handleChangeRow(row, "RtoR_L", value)}
        />
        <NumericCell
          className="w-60"
          value={row.firstRow_W}
          onChange={(value) => handleChangeRow(row, "firstRow_W", value)}
        />
        <NumericCell
          className="w-100"
          value={row.RtoR_W}
          onChange={(value) => handleChangeRow(row, "RtoR_W", value)}
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
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={row.alongWeb}
          onSelect={(value) => handleChangeRow(row, "alongWeb", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={row.alongFlange}
          onSelect={(value) => handleChangeRow(row, "alongFlange", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="d-flex f-ai-center label-light bg-dark">
        <span>Rectangular</span>
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
                <th colSpan={3}>Top Splice Plate</th>
                <th colSpan={3}>Bottom Splice Plate</th>
                <th colSpan={2}>Splice Bolt Size</th>
                <th colSpan={2}>No of bolts</th>
                <th colSpan={2}>Spacing along Length (mm)</th>
                <th colSpan={2}>Spacing along Width (mm)</th>
                <th colSpan={2}>Splice Bolt Capacity</th>
                <th colSpan={2}>Stiffener Plate Size</th>
                <th colSpan={2}>Stiffener Plate Nos</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Length (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Length (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Grade</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Along Length</th>
                <th style={{ top: offsetTop }}>Along Width</th>
                <th style={{ top: offsetTop }}>1st Row from Center</th>
                <th style={{ top: offsetTop }}>Row to Row</th>
                <th style={{ top: offsetTop }}>1st Row from Center</th>
                <th style={{ top: offsetTop }}>Row to Row</th>
                <th style={{ top: offsetTop }}>Tension (kN)</th>
                <th style={{ top: offsetTop }}>Shear (kN)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Height (mm)</th>
                <th style={{ top: offsetTop }}>Along Web</th>
                <th style={{ top: offsetTop }}>Along Flange</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rectangular;
