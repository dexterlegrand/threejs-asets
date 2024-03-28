import React, { useState, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { AccessoriesCTLoad, DeadLoadsUI } from "../../../../../store/ui/types";
import {
  convertToNamesArray,
  getNextId,
  checkImportedNumber,
  getElementByName,
  importFromCSV,
  exportToCSV,
} from "../../../../3d-models/utils";

type Props = {
  data: DeadLoadsUI;
  models: TOpenFrame[];
  onChange: (field: string, value: any) => any;
  onImportError: (loads: string, msg: string) => any;
};

export function CTTabFS({ data, models, onChange, onImportError }: Props) {
  const [display, setDisplay] = useState<boolean>(true);

  const loads = useMemo(() => {
    return data.accessoriesCTLoads;
  }, [data]);

  function handleAddRow() {
    onChange("accessoriesCTLoads", [
      ...loads,
      {
        id: getNextId(loads),
        selected: false,
        top: 0,
        l1: 0,
        l2: 0,
        l3: 0,
        l4: 0,
      } as AccessoriesCTLoad,
    ]);
  }

  function handleDeleteRows() {
    onChange(
      "accessoriesCTLoads",
      loads.filter((item) => !item.selected)
    );
  }

  function handleChangeRow(item: AccessoriesCTLoad, field: string, value: any) {
    onChange(
      "accessoriesCTLoads",
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

  function getRow(item: AccessoriesCTLoad) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          selected={item.model}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={getGroups(models, item.model)}
          selected={item.group}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "group", value)}
          filterable={false}
        />
        <NumericCell
          value={item.l1}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "l1", value)}
        />
        <NumericCell
          value={item.l2}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "l2", value)}
        />
        <NumericCell
          value={item.l3}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "l3", value)}
        />
        <NumericCell
          value={item.l4}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "l4", value)}
        />
        <NumericCell
          value={item.top}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "top", value)}
        />
      </tr>
    );
  }

  function getGroups(models: TOpenFrame[], model?: string) {
    let groups: string[] = [];
    getElementByName(models, model)?.accessories.forEach((ag) => {
      if (ag.type === "CT") groups = [...groups, ag.name];
    });
    return groups;
  }

  function handleExport() {
    exportToCSV(loads, "Christmas Tree Dead Loads");
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: AccessoriesCTLoad[] = [...loads];
      for (const item of imported) {
        let newLoad: AccessoriesCTLoad = {
          id: getNextId(loads),
          selected: false,
          top: 0,
          l1: 0,
          l2: 0,
          l3: 0,
          l4: 0,
        };
        if (item.model) {
          const model = getElementByName(models, item.model);
          if (model) {
            newLoad = { ...newLoad, model: model.name };
            if (item.group) {
              const group = getElementByName(model.accessories, item.group);
              if (group) {
                newLoad = { ...newLoad, group: group.name };
              } else {
                onImportError(
                  "Christmas Tree",
                  `(id: ${item.id}) - a accessory group "${item.group}" not found!`
                );
              }
            }
          } else {
            onImportError(
              "Christmas Tree",
              `(id: ${item.id}) - a model "${item.model}" not found!`
            );
          }
        }
        newLoad = {
          ...newLoad,
          top:
            checkImportedNumber(
              item.top,
              onImportError(
                "Christmas Tree",
                `(id: ${item.id}) - a value of "Top Load intensity (kg/m)" "${item.top}" is not a number!`
              )
            ) ?? 0,
          l1:
            checkImportedNumber(
              item.l1,
              onImportError(
                "Christmas Tree",
                `(id: ${item.id}) - a value of "L1 Load intensity (kg/m)" "${item.l1}" is not a number!`
              )
            ) ?? 0,
          l2:
            checkImportedNumber(
              item.l2,
              onImportError(
                "Christmas Tree",
                `(id: ${item.id}) - a value of "L2 Load intensity (kg/m)" "${item.l2}" is not a number!`
              )
            ) ?? 0,
          l3:
            checkImportedNumber(
              item.top,
              onImportError(
                "Christmas Tree",
                `(id: ${item.id}) - a value of "L3 Load intensity (kg/m)" "${item.l3}" is not a number!`
              )
            ) ?? 0,
          l4:
            checkImportedNumber(
              item.top,
              onImportError(
                "Christmas Tree",
                `(id: ${item.id}) - a value of "Top Load intensity (kg/m)" "${item.l4}" is not a number!`
              )
            ) ?? 0,
        };
        newLoads.push(newLoad);
      }
      onChange("accessoriesCTLoads", newLoads);
    });
  }

  return (
    <div className="d-flex f-grow f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
        />
        <span>Christmas Tree</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      {display && (
        <>
          <div className="hr" />
          <div className={"small-table-container bg-dark p-5"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}></th>
                  <th rowSpan={2}>FS No.</th>
                  <th rowSpan={2}>CTS Group No.</th>
                  <th colSpan={5}>
                    Load intensity (<sup>kg</sup>/<sub>m</sub>)
                  </th>
                </tr>
                <tr>
                  <th>L1</th>
                  <th>L2</th>
                  <th>L3</th>
                  <th>L4</th>
                  <th>Top</th>
                </tr>
              </thead>
              <tbody>{loads.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
