import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { PipeRack, PipeRackBeam } from "../../../../../store/main/types";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { changeModel } from "../../../../../store/main/actions";
import { getTopOffset } from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = {
  onClose: () => any;
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  element?: PipeRackBeam;
};

const EquipmentLoads: FunctionComponent<Props> = ({ onClose }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  const currentProject = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject);
  });

  const models = useMemo(() => {
    if (currentProject) {
      return currentProject.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
    }
    return [];
  }, [currentProject]);

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      model.beams.forEach((item) => {
        if (item.equipmentLoadId) {
          lastId = Math.max(lastId, item.equipmentLoadId);
          newRows.push({
            id: item.equipmentLoadId,
            selected: false,
            pr: model,
            element: item,
          });
        }
      });
    });
    setAfterUpdate(true);
    setRows(
      [
        ...newRows,
        ...rows
          .filter((row) => !validRow(row))
          .map(
            (row) =>
              ({
                ...row,
                id: ++lastId,
              } as RowData)
          ),
      ].sort((a, b) => a.id - b.id)
    );
    setRowIndex(++lastId);
  }, [models]);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!init && !afterUpdate) {
      models.forEach((model) => {
        let newBeams: PipeRackBeam[] = model.beams.map((item) => ({
          ...item,
          equipmentLoadId: undefined,
          equipmentLoad: undefined,
        }));
        rows
          .filter((vr) => vr.pr?.name === model.name && vr.element)
          .forEach((vr) => {
            newBeams = newBeams.map((item) =>
              item.name === vr.element?.name
                ? {
                    ...vr.element,
                    equipmentLoadId: vr.id,
                  }
                : item
            );
          });
        if (!equal(model.beams, newBeams)) {
          dispatch(changeModel({ ...model, beams: newBeams } as PipeRack));
        }
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.element;
  }

  function equal(old: PipeRackBeam[], news: PipeRackBeam[]) {
    for (let i = 0; i < old.length; ++i) {
      if (old[i].equipmentLoad?.distance !== news[i].equipmentLoad?.distance) return false;
      if (old[i].equipmentLoad?.empty_Fy !== news[i].equipmentLoad?.empty_Fy) return false;
      if (old[i].equipmentLoad?.test_Fx !== news[i].equipmentLoad?.test_Fx) return false;
      if (old[i].equipmentLoad?.test_Fy !== news[i].equipmentLoad?.test_Fy) return false;
      if (old[i].equipmentLoad?.test_Fz !== news[i].equipmentLoad?.test_Fz) return false;
      if (old[i].equipmentLoad?.test_Mx !== news[i].equipmentLoad?.test_Mx) return false;
      if (old[i].equipmentLoad?.test_My !== news[i].equipmentLoad?.test_My) return false;
      if (old[i].equipmentLoad?.test_Mz !== news[i].equipmentLoad?.test_Mz) return false;
      if (old[i].equipmentLoad?.operating_Fx !== news[i].equipmentLoad?.operating_Fx) return false;
      if (old[i].equipmentLoad?.operating_Fy !== news[i].equipmentLoad?.operating_Fy) return false;
      if (old[i].equipmentLoad?.operating_Fz !== news[i].equipmentLoad?.operating_Fz) return false;
      if (old[i].equipmentLoad?.operating_Mx !== news[i].equipmentLoad?.operating_Mx) return false;
      if (old[i].equipmentLoad?.operating_My !== news[i].equipmentLoad?.operating_My) return false;
      if (old[i].equipmentLoad?.operating_Mz !== news[i].equipmentLoad?.operating_Mz) return false;
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

  function handleChangeRow(item: RowData, field: string, value: any) {
    setRows(rows.map((row) => (row.id === item.id ? { ...item, [field]: value } : row)));
  }

  function handleChangePR(item: RowData, pr?: PipeRack) {
    setRows(rows.map((row) => (row.id === item.id ? { ...item, pr, element: undefined } : row)));
  }

  function handleChangeElement(item: RowData, element?: PipeRackBeam) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          return {
            ...item,
            element: {
              ...element,
              equipmentLoadId: item.id,
              equipmentLoad: {
                distance: 0,
                empty_Fy: 0,

                test_Fx: 0,
                test_Fy: 0,
                test_Fz: 0,
                test_Mx: 0,
                test_My: 0,
                test_Mz: 0,

                operating_Fx: 0,
                operating_Fy: 0,
                operating_Fz: 0,
                operating_Mx: 0,
                operating_My: 0,
                operating_Mz: 0,
              },
            },
          } as RowData;
        } else return row;
      })
    );
  }

  function handleChangeLoad(item: RowData, field: string, value: any) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          if (item.element && item.element.equipmentLoad) {
            return {
              ...item,
              element: {
                ...item.element,
                equipmentLoad: {
                  ...item.element.equipmentLoad,
                  [field]: value,
                },
              },
            } as RowData;
          } else {
            return row;
          }
        } else {
          return row;
        }
      })
    );
  }

  function getRow(item: RowData) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={item.pr}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          onSelect={(value) => handleChangePR(item, value)}
        />
        <SelectorCell<PipeRackBeam>
          items={item.pr?.beams ?? []}
          selected={item.element}
          itemKey={(item) => `${item.parent}-${item.id}-${item.name}`}
          itemLabel={(item) => item.name}
          itemSecondLabel={(item) => item.parent}
          onSelect={(value) => handleChangeElement(item, value)}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.distance}
          className={"w-100"}
          onChange={(value) => handleChangeLoad(item, "distance", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.empty_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "empty_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_My}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.test_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "test_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_My}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.element?.equipmentLoad?.operating_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "operating_Mz", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <CustomDlg
      title={"Equipment Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="label-light bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
            <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
            <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          </div>
          <div className="hr" />
          <div className={"table-container bg-dark p-5"}>
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}>{""}</th>
                  <th rowSpan={2}>PR No.</th>
                  <th rowSpan={2}>Element No.</th>
                  <th rowSpan={2}>Dist. From Start Node (m)</th>
                  <th>Empty</th>
                  <th colSpan={6}>Test</th>
                  <th colSpan={6}>Operating</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fx (kg)</th>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fz (kg)</th>
                  <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                  <th style={{ top: offsetTop }}>My (kg.m)</th>
                  <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                  <th style={{ top: offsetTop }}>Fx (kg)</th>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fz (kg)</th>
                  <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                  <th style={{ top: offsetTop }}>My (kg.m)</th>
                  <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                </tr>
              </thead>
              <tbody>{rows.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
};

export default EquipmentLoads;
