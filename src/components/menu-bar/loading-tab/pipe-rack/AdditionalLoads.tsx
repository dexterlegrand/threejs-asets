import React, { useEffect, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import {
  LoadType,
  PipeRack,
  PipeRackColumn,
  PipeRackBeam,
  AdditionalLoad,
  PipeRackCantilever,
  Accessory,
} from "../../../../store/main/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../store/main/actions";
import { SelectorCell } from "../../../common/SelectorCell";
import { NumericCell } from "../../../common/NumericCell";
import { loadTypes } from "../../../../store/main/constants";
import { getTopOffset } from "../../../3d-models/utils";

type Props = {
  models: PipeRack[];
  load: "deadLoad" | "liveLoad" | "windLoad";
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  element?: PipeRackColumn | PipeRackBeam | PipeRackCantilever | any;
};

export function AdditionalLoads({ models, load }: Props) {
  const [blockUpdate, setBlockUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const [tab, setTab] = useState<"NF" | "AL">("AL");
  const [nfExisting, setNfExisting] = useState<boolean>(false);

  const [display, setDisplay] = useState<boolean>(true);

  const dispatch = useDispatch();

  function getAccessoryElements(accessory: Accessory[]) {
    let elements: any[] = [];
    accessory.forEach((ag) => {
      ag.elements.forEach((el) => {
        elements = [...elements, ...el.colItems, ...el.beamItems];
      });
    });
    return elements;
  }

  useEffect(() => {
    setTab(nfExisting && load === "windLoad" ? "NF" : "AL");
  }, [nfExisting]);

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      if (!nfExisting && model.structuralNaturalFrequency) setNfExisting(true);
      [
        ...model.columns,
        ...model.beams,
        ...model.cantilevers,
        ...getAccessoryElements(model.accessories),
      ].forEach((item) => {
        if (item[load]) {
          newRows.push({
            id: lastId++,
            selected: false,
            pr: model,
            element: item,
          });
        }
      });
    });
    setBlockUpdate(true);
    setRows(
      [
        ...newRows,
        ...rows.filter((row) => !validRow(row)).map((row) => ({ ...row, id: lastId++ })),
      ].sort((a, b) => a.id - b.id)
    );
    setRowIndex(lastId);
  }, [models]);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!blockUpdate) {
      models.forEach((model) => {
        let newColumns: PipeRackColumn[] = model.columns.map((item) => ({
          ...item,
          [`${load}Id`]: undefined,
          [load]: undefined,
        }));
        let newBeams: PipeRackBeam[] = model.beams.map((item) => ({
          ...item,
          [`${load}Id`]: undefined,
          [load]: undefined,
        }));
        let newCnts: PipeRackCantilever[] = model.cantilevers.map((item) => ({
          ...item,
          [`${load}Id`]: undefined,
          [load]: undefined,
        }));
        let newAccessories: Accessory[] = model.accessories.map((ag) => ({
          ...ag,
          elements: ag.elements.map((el) => ({
            ...el,
            colItems: el.colItems.map((col) => ({
              ...col,
              [`${load}Id`]: undefined,
              [load]: undefined,
            })),
            beamItems: el.beamItems.map((beam) => ({
              ...beam,
              [`${load}Id`]: undefined,
              [load]: undefined,
            })),
          })),
        }));

        rows
          .filter((vr) => vr.pr?.name === model.name && vr.element)
          .forEach((vr) => {
            if (vr.element!.type === "PipeRackColumn") {
              const newElement = { ...vr.element } as PipeRackColumn;
              newColumns = newColumns.map((item) =>
                item.name === newElement.name && item.parent === newElement.parent
                  ? { ...newElement, [`${load}Id`]: vr.id }
                  : item
              );
            } else if (vr.element!.type === "PipeRackBeam") {
              const newElement = { ...vr.element } as PipeRackBeam;
              newBeams = newBeams.map((item) =>
                item.name === newElement.name && item.parent === newElement.parent
                  ? { ...newElement, [`${load}Id`]: vr.id }
                  : item
              );
            } else if (vr.element!.type === "PipeRackCantilever") {
              const newElement = { ...vr.element } as PipeRackCantilever;
              newCnts = newCnts.map((item) =>
                item.name === newElement.name && item.parent === newElement.parent
                  ? { ...newElement, [`${load}Id`]: vr.id }
                  : item
              );
            } else if (vr.element!.type === "AccessoryColumn") {
              newAccessories = newAccessories.map((agItem) =>
                vr.element!.parentGroup === agItem.name
                  ? {
                      ...agItem,
                      elements: agItem.elements.map((elItem) =>
                        vr.element!.parent === elItem.name
                          ? {
                              ...elItem,
                              colItems: elItem.colItems.map((item) =>
                                item.name === vr.element!.name
                                  ? { ...vr.element!, [`${load}Id`]: vr.id }
                                  : item
                              ),
                            }
                          : elItem
                      ),
                    }
                  : agItem
              );
            } else if (vr.element!.type === "AccessoryBeam") {
              newAccessories = newAccessories.map((agItem) =>
                vr.element!.parentGroup === agItem.name
                  ? {
                      ...agItem,
                      elements: agItem.elements.map((elItem) =>
                        vr.element!.parent === elItem.name
                          ? {
                              ...elItem,
                              beamItems: elItem.beamItems.map((item) =>
                                item.name === vr.element!.name
                                  ? { ...vr.element!, [`${load}Id`]: vr.id }
                                  : item
                              ),
                            }
                          : elItem
                      ),
                    }
                  : agItem
              );
            }
          });
        if (
          !equal(model.columns, newColumns) ||
          !equal(model.beams, newBeams) ||
          !equal(model.cantilevers, newCnts) ||
          !equalAccessories(model.accessories, newAccessories)
        ) {
          dispatch(
            changeModel({
              ...model,
              columns: newColumns,
              beams: newBeams,
              cantilevers: newCnts,
              accessories: newAccessories,
            } as PipeRack)
          );
        }
      });
    } else {
      setBlockUpdate(false);
    }
  }, [rows]);

  function validRow(row: RowData) {
    return row.element;
  }

  function equal(
    old: (PipeRackColumn | PipeRackBeam | PipeRackCantilever | any)[],
    news: (PipeRackColumn | PipeRackBeam | PipeRackCantilever | any)[]
  ) {
    for (let i = 0, len = old.length; i < len; ++i) {
      if (old[i][load]?.type !== news[i][load]?.type) return false;
      if (old[i][load]?.distance !== news[i][load]?.distance) return false;
      if (old[i][load]?.lengthOfUDL !== news[i][load]?.lengthOfUDL) return false;
      if (old[i][load]?.Fx !== news[i][load]?.Fx) return false;
      if (old[i][load]?.Fy !== news[i][load]?.Fy) return false;
      if (old[i][load]?.Fz !== news[i][load]?.Fz) return false;
      if (old[i][load]?.Mx !== news[i][load]?.Mx) return false;
      if (old[i][load]?.My !== news[i][load]?.My) return false;
      if (old[i][load]?.Mz !== news[i][load]?.Mz) return false;
    }
    return true;
  }

  function equalAccessories(oldAccessories: Accessory[], newAccessories: Accessory[]) {
    return equal(getAccessoryElements(oldAccessories), getAccessoryElements(newAccessories));
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

  function handleChangeElement(item: RowData, element: PipeRackColumn | PipeRackBeam) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          return {
            ...item,
            element: {
              ...element,
              [`${load}Id`]: item.id,
              [load]: {
                type: "Point Load",
                distance: 0,
                lengthOfUDL: 0,
                Fx: 0,
                Fy: 0,
                Fz: 0,
                Mx: 0,
                My: 0,
                Mz: 0,
              },
            },
          } as RowData;
        } else {
          return row;
        }
      })
    );
  }

  function handleChangeLoad(item: RowData, field: string, value: any) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          if (item.element && item.element[load]) {
            return {
              ...item,
              element: {
                ...item.element,
                [load]: { ...item.element[load], [field]: value },
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

  function getLoadField(
    element: PipeRackColumn | PipeRackBeam | undefined
  ): AdditionalLoad | undefined {
    if (!element) return undefined;
    return element[load];
  }

  function getElements(model?: PipeRack) {
    return model
      ? [
          ...model.columns,
          ...model.beams,
          ...model.cantilevers,
          ...getAccessoryElements(model.accessories),
        ]
      : [];
  }

  function getRow(item: RowData) {
    const elements = getElements(item.pr);
    let Fx = false;
    let Fy = false;
    let Fz = false;
    let Mx = false;
    let My = false;
    let Mz = false;
    if (load === "windLoad") {
      const loads = getLoadField(item.element);
      Fx = !!(!loads?.Fx && (loads?.Fz || loads?.Mx));
      Fy = !loads?.Fx && !loads?.Fz && !loads?.Mx && !loads?.Mz;
      Fz = !!(!loads?.Fz && (loads?.Fx || loads?.Mz));
      Mx = !!(!loads?.Mx && (loads?.Fx || loads?.Mz));
      My = !loads?.Fx && !loads?.Fz && !loads?.Mx && !loads?.Mz;
      Mz = !!(!loads?.Mz && (loads?.Fz || loads?.Mx));
    }
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
        <SelectorCell<PipeRackColumn | PipeRackBeam | PipeRackCantilever | any>
          items={elements}
          selected={elements.find((el) => el.name === item.element?.name)}
          itemKey={(item) => `${item.parent}-${item.id}-${item.name}`}
          itemLabel={(item) => item.name}
          itemSecondLabel={(item) => item.parent}
          onSelect={(value) => handleChangeElement(item, value)}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<LoadType>
          disabled={!item.element}
          items={loadTypes}
          selected={getLoadField(item.element)?.type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeLoad(item, "type", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={getLoadField(item.element)?.distance}
          className={"w-100"}
          onChange={(value) => handleChangeLoad(item, "distance", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={getLoadField(item.element)?.lengthOfUDL}
          className={"w-100"}
          onChange={(value) => handleChangeLoad(item, "lengthOfUDL", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fx}
          value={getLoadField(item.element)?.Fx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fy}
          value={getLoadField(item.element)?.Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fz}
          value={getLoadField(item.element)?.Fz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mx}
          value={getLoadField(item.element)?.Mx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || My}
          value={getLoadField(item.element)?.My}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mz}
          value={getLoadField(item.element)?.Mz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mz", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div className="d-flex f-grow f-column">
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
        />
        {load === "windLoad" && models.some((model) => model.structuralNaturalFrequency) ? (
          <>
            <Button
              small
              minimal
              className={"c-light"}
              text={"Natural Freq"}
              onClick={() => setTab("NF")}
            />
            <span>|</span>
          </>
        ) : null}
        <Button
          small
          minimal
          className={"c-light"}
          text={"Additional Loads"}
          onClick={() => setTab("AL")}
        />
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      {display && (
        <>
          <div className="hr" />
          <div className={"small-table-container bg-dark p-5"}>
            {tab === "NF" && load === "windLoad" ? (
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th>PR No.</th>
                    <th>Natural Freq</th>
                  </tr>
                </thead>
                <tbody>
                  {models
                    .filter((model) => model.structuralNaturalFrequency)
                    .map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.structuralNaturalFrequency}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th rowSpan={2}></th>
                    <th rowSpan={2}>PR No.</th>
                    <th rowSpan={2}>Element No.</th>
                    <th rowSpan={2}>Load Type</th>
                    <th rowSpan={2}>Dist. From Start Node (m)</th>
                    <th rowSpan={2}>Length of UDL (m)</th>
                    <th colSpan={6}>Load Values (kg & m)</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop }}>Fx</th>
                    <th style={{ top: offsetTop }}>Fy</th>
                    <th style={{ top: offsetTop }}>Fz</th>
                    <th style={{ top: offsetTop }}>Mx</th>
                    <th style={{ top: offsetTop }}>My</th>
                    <th style={{ top: offsetTop }}>Mz</th>
                  </tr>
                </thead>
                <tbody>{rows.map((item) => getRow(item))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
