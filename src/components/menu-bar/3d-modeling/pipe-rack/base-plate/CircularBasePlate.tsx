import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  PipeRack,
  PipeRackColumn,
  DesignMethod,
  CircularBP,
} from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { concreteGrade, designMethods } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { getTopOffset } from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { InputCell } from "../../../../common/InputCell";

type Props = { models: PipeRack[] };

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  column?: PipeRackColumn;
  dMethod?: DesignMethod;
  bPlateThickness?: number;
  bPlateDiameter?: number;
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

const CircularBasePlate: FunctionComponent<Props> = (props) => {
  const { models } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const project = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject);
  });

  const dispatch = useDispatch();

  useEffect(() => {
    let lastId = 0;
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.plates.forEach((bp) => {
        if (bp.type === "Circular") {
          const plate = { ...bp } as CircularBP;
          newRows.push({
            id: plate.id,
            selected: false,
            pr: model,
            column: model.columns.find((c) => c.name === plate.column),
            dMethod: plate.designMethod,
            bPlateThickness: plate.bPlateThickness,
            bPlateDiameter: plate.bPlateDiameter,
            grade: plate.grade,
            boltDiameter: plate.boltDiameter,
            boltBCD: plate.boltBCD,
            boltNos: plate.boltNos,
            tension: plate.tension,
            shear: plate.shear,
            sPlateThickness: plate.sPlateThickness,
            sPlateHeight: plate.sPlateHeight,
            sPlateWidth: plate.sPlateWidth,
            sPlateNos: plate.sPlateNos,
          });
          if (plate.id > lastId) lastId = plate.id;
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
        const plates = vRows
          .filter((row) => row.pr!.name === model.name)
          .map((row) => {
            return {
              id: row.id,
              name: `CBP-${row.column!.name}`,
              parent: row.column!.parent,
              type: "Circular",
              column: row.column!.name,
              designMethod: row.dMethod!,
              bPlateThickness: row.bPlateThickness,
              bPlateDiameter: row.bPlateDiameter,
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
            } as CircularBP;
          });
        !equalPlates(model.plates as CircularBP[], plates) &&
          dispatch(changeModel({ ...model, plates } as PipeRack));
      });
    } else setInit(false);
  }, [rows]);

  function validRow(row: RowData) {
    return (
      row.pr &&
      row.column &&
      row.bPlateThickness &&
      row.bPlateDiameter &&
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

  function equalPlates(items: CircularBP[], newItems: CircularBP[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].column !== newItems[i].column) return false;
      if (items[i].designMethod !== newItems[i].designMethod) return false;
      if (items[i].bPlateThickness !== newItems[i].bPlateThickness) return false;
      if (items[i].bPlateDiameter !== newItems[i].bPlateDiameter) return false;
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
    setRows([...rows, { id: rowIndex, selected: false }]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, pr, column: undefined } : item)));
  }

  function handleChangeColumn(row: RowData, column?: PipeRackColumn) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, column } : item)));
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
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
              column.tier === 0 &&
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
        <span>Circular Base Plate</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
        <FormGroup className="no-m" label="Concrete Grade" inline>
          <SimpleSelector<string>
            items={concreteGrade}
            selected={project?.concreteGrade}
            onSelect={(concreteGrade) =>
              project && dispatch(changeProjectAction({ ...project, concreteGrade }))
            }
            itemLabel={(item) => item}
            className="fill-select w-150"
          />
        </FormGroup>
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
                <th rowSpan={2}>Design Method</th>
                <th colSpan={2}>Base Plate</th>
                <th colSpan={2}>Anchor Bolt Size</th>
                <th colSpan={2}>Anchor Bolt Location</th>
                <th colSpan={2}>Anchor Bolt Capacity</th>
                <th colSpan={4}>Stiffener Plate</th>
              </tr>
              <tr>
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

export default CircularBasePlate;
