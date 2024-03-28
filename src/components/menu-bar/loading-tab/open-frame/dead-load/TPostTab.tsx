import React, { useState, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { AccessoriesTPLoad, DeadLoadsUI } from "../../../../../store/ui/types";
import {
  convertToNamesArray,
  getNextId,
  getElementByName,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = {
  data: DeadLoadsUI;
  models: TOpenFrame[];
  onChange: (field: string, value: any) => any;
  onImportError: (loads: string, msg: string) => any;
};

export function TPostTabOF({ data, models, onChange, onImportError }: Props) {
  const [display, setDisplay] = useState<boolean>(true);

  const loads = useMemo(() => {
    return data.accessoriesTPLoads;
  }, [data]);

  function handleAddRow() {
    onChange("accessoriesTPLoads", [
      ...loads,
      {
        id: getNextId(loads),
        selected: false,
        top: 0,
      } as AccessoriesTPLoad,
    ]);
  }

  function handleDeleteRows() {
    onChange(
      "accessoriesTPLoads",
      loads.filter((item) => !item.selected)
    );
  }

  function handleChangeRow(item: AccessoriesTPLoad, field: string, value: any) {
    onChange(
      "accessoriesTPLoads",
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

  function getRow(item: AccessoriesTPLoad) {
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
        />
        <SelectorCell<string>
          items={getGroups(models, item.model)}
          selected={item.group}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "group", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.top}
          className={"w-200"}
          onChange={(value) => handleChangeRow(item, "top", value)}
        />
      </tr>
    );
  }

  function getGroups(models: TOpenFrame[], model?: string) {
    let groups: string[] = [];
    getElementByName(models, model)?.accessories.forEach((ag) => {
      if (ag.type === "TP") groups = [...groups, ag.name];
    });
    return groups;
  }

  function handleExport() {
    exportToCSV(loads, "T-Post Dead Loads");
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: AccessoriesTPLoad[] = [...loads];
      for (const item of imported) {
        let newLoad: AccessoriesTPLoad = {
          id: getNextId(loads),
          selected: false,
          top: 0,
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
                  "T-Post",
                  `(id: ${item.id}) - a accessory group "${item.group}" not found!`
                );
              }
            }
          } else {
            onImportError("T-Post", `(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        newLoad = {
          ...newLoad,
          top:
            checkImportedNumber(
              item.top,
              onImportError(
                "T-Post",
                `(id: ${item.id}) - a value of "Load intensity (kg/m)" "${item.top}" is not a number!`
              )
            ) ?? 0,
        };
        newLoads.push(newLoad);
      }
      onChange("accessoriesTPLoads", newLoads);
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
        <span>T-Post</span>
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
                  <GeneralCheckBoxCell
                    data={loads}
                    onChange={(loads) => onChange("accessoriesTPLoads", loads)}
                  />
                  <th>OF No.</th>
                  <th>T-Post Group No.</th>
                  <th>
                    Load intensity (<sup>kg</sup>/<sub>m</sub>)
                  </th>
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
