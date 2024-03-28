import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { LoadType } from "../../../../store/main/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { NumericCell } from "../../../common/NumericCell";
import { loadTypes } from "../../../../store/main/constants";
import {
  getTopOffset,
  getElementByName,
  convertToNamesArray,
  getNextId,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import { DeadLoadsUI, AdditionalLoadUI, LiveLoadsUI, WindLoadUI } from "../../../../store/ui/types";

type Props = {
  data: DeadLoadsUI | LiveLoadsUI | WindLoadUI;
  models: TOpenFrame[];
  load: "deadLoadUI" | "liveLoadUI" | "windLoadUI";
  onChange: (field: string, value: any) => any;
  onImportError: (msg: string) => any;
};

const initLoad = {
  id: 0,
  selected: false,
  distance: 0,
  type: "Point Load" as LoadType,
  lengthOfUDL: 0,
  Fx: 0,
  Fy: 0,
  Fz: 0,
  Mx: 0,
  My: 0,
  Mz: 0,
};

export function AdditionalLoadsFS({ data, models, load, onChange, onImportError }: Props) {
  const [display, setDisplay] = useState<boolean>(true);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const tableRef = useRef<HTMLTableElement>(null);

  const loads = useMemo(() => {
    return data.loads;
  }, [data]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleAddRow() {
    onChange("loads", [
      ...loads,
      {
        ...initLoad,
        id: getNextId(loads),
      },
    ]);
  }

  function handleDeleteRows() {
    onChange(
      "loads",
      loads.filter((item) => !item.selected)
    );
  }

  function handleChangeModel(item: AdditionalLoadUI, model?: string) {
    onChange(
      "loads",
      loads.map((loadItem) => {
        if (loadItem.id === item.id) {
          return {
            ...loadItem,
            model,
            element: undefined,
          };
        }
        return loadItem;
      })
    );
  }

  function handleChangeLoad(item: AdditionalLoadUI, field: string, value: any) {
    onChange(
      "loads",
      loads.map((loadItem) => {
        if (loadItem.id === item.id) {
          return {
            ...loadItem,
            [field]: value,
          };
        }
        return loadItem;
      })
    );
  }

  function getElements(model?: TOpenFrame) {
    return model ? [...model.columns, ...model.beams, ...model.cantilevers] : [];
  }

  function getRow(item: AdditionalLoadUI) {
    const model = getElementByName(models, item.model);
    const elements = getElements(model);
    const element = getElementByName(elements, item.element);
    const maxDistance = element ? element.startPos.distanceTo(element.endPos) : 0;
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeLoad(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          selected={item.model}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeModel(item, value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(elements)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeLoad(item, "element", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<LoadType>
          disabled={!item.element}
          items={loadTypes}
          selected={item.type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeLoad(item, "type", value)}
          filterable={false}
        />
        <NumericCell
          min={0}
          max={maxDistance}
          isDecimal={true}
          disabled={!item.element}
          value={item.distance}
          className={"w-100"}
          onChange={(value) => handleChangeLoad(item, "distance", value)}
        />
        <NumericCell
          min={0}
          max={maxDistance - item.distance}
          isDecimal={true}
          disabled={!item.element || item.type === "Point Load"}
          value={item.lengthOfUDL}
          className={"w-100"}
          onChange={(value) => handleChangeLoad(item, "lengthOfUDL", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.Fx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.Fz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.Mx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.My}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element}
          value={item.Mz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mz", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    const loadName = load === "deadLoadUI" ? "Dead" : load === "liveLoadUI" ? "Live" : "Wind";
    exportToCSV(loads, `Additional ${loadName} loads`);
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: AdditionalLoadUI[] = [...loads];
      for (const item of imported) {
        let newLoad: AdditionalLoadUI = {
          ...initLoad,
          id: getNextId(newLoads),
        };
        if (item.model) {
          const model = getElementByName(models, item.model);
          if (model) {
            newLoad = { ...newLoad, model: model.name };
            if (item.element) {
              const element = getElementByName(getElements(model), item.element);
              if (element) {
                newLoad = { ...newLoad, element: element.name };
              } else {
                onImportError(`(id: ${item.id}) - an element "${item.element}" not found!`);
              }
            }
          } else {
            onImportError(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        if (item.type) {
          if (loadTypes.includes(item.type)) {
            newLoad = { ...newLoad, type: item.type };
          } else {
            onImportError(`(id: ${item.id}) - Incorrect load type "${item.type}"!`);
          }
        }
        newLoad = {
          ...newLoad,
          distance: checkImportedNumber(item.distance, false) ?? 0,
          lengthOfUDL: checkImportedNumber(item.lengthOfUDL, false) ?? 0,
          Fx: checkImportedNumber(item.Fx) ?? 0,
          Fy: checkImportedNumber(item.Fy) ?? 0,
          Fz: checkImportedNumber(item.Fz) ?? 0,
          Mx: checkImportedNumber(item.Mx) ?? 0,
          My: checkImportedNumber(item.My) ?? 0,
          Mz: checkImportedNumber(item.Mz) ?? 0,
        };
        newLoads.push(newLoad);
      }
      onChange("loads", newLoads);
    });
  }

  return (
    <div className="d-flex f-grow f-column">
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
        />
        {load === "windLoadUI" && models.some((model) => model.structuralNaturalFrequency) ? (
          <>
            <Button
              small
              minimal
              className={"c-light"}
              text={"Natural Freq"}
              onClick={() => onChange("tab", "NF")}
            />
            <span>|</span>
          </>
        ) : null}
        <Button
          small
          minimal
          className={"c-light"}
          text={"Additional Loads"}
          onClick={() => onChange("tab", "AL")}
        />
        {(data as WindLoadUI).tab !== "NF" && (
          <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        )}
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        {(data as WindLoadUI).tab !== "NF" && (
          <>
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImport}
            />
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          </>
        )}
      </div>
      {display && (
        <>
          <div className="hr" />
          <div className={"small-table-container bg-dark p-5"}>
            {load === "windLoadUI" && (data as WindLoadUI).tab === "NF" ? (
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th>OF No.</th>
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
                    <th rowSpan={2}>FS No.</th>
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
                <tbody>{loads.map((item) => getRow(item))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
