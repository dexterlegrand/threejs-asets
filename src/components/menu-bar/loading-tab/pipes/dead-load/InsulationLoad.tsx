import React, { useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import {
  getNextId,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { Project, FreePipe } from "../../../../../store/main/types";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { changeProjectAction } from "../../../../../store/main/actions";
import { TPipeInsulationLoad, TPipeDeadLoad } from "../../../../../store/main/pipeTypes";

type Props = { project?: Project; pipes: FreePipe[]; dl?: TPipeDeadLoad };

const initLoad: TPipeInsulationLoad = {
  id: 0,
  selected: false,
  thickness: 0,
  density: 0,
  type: "",
};

export function PipeInsulationLoads({ project, pipes, dl }: Props) {
  const [visible, setVisible] = useState<boolean>(true);

  const dispatch = useDispatch();

  const loads = useMemo(() => {
    return dl?.insulations ?? [];
  }, [dl]);

  function handleChangeData(insulations: TPipeInsulationLoad[]) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: {
          ...project.pipeLoadings,
          deadLoad: { ...dl!, insulations },
        },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([...loads, { ...initLoad, id: getNextId(loads) }]);
  }

  function handleDeleteRows() {
    handleChangeData(loads.filter((item) => !item.selected));
  }

  function handleChange(item: TPipeInsulationLoad, field: string, value: any) {
    handleChangeData(
      loads.map((load) => {
        if (load.id === item.id) {
          return { ...load, [field]: value };
        }
        return load;
      })
    );
  }

  function getRow(item: TPipeInsulationLoad) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={pipes.map((p) => p.pipe)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChange(item, "element", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.thickness}
          className={"w-100"}
          onChange={(value) => handleChange(item, "thickness", value)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.density}
          className={"w-100"}
          onChange={(value) => handleChange(item, "density", value)}
        />
        <SelectorCell<string>
          items={getUnicuesArray(loads.map((p) => p.type))}
          selected={item.type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeType(item, value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
          onCreate={(value) => value}
        />
      </tr>
    );
  }

  function handleChangeType(item: TPipeInsulationLoad, type?: string) {
    const fl = loads.find((l) => l.type === type);
    handleChangeData(
      loads.map((load) => {
        if (load.id === item.id) {
          return { ...load, type: type ?? "", density: fl?.density ?? load.density };
        }
        return load;
      })
    );
  }

  function handleExport() {
    if (!loads.length) return;
    exportToCSV(
      loads.map((load) => ({
        ...load,
        id: load.id,
        "Pipe No.": load.element ?? "",
        "Thickness (mm)": load.thickness,
        "Density (kg/m^3)": load.density,
      })),
      `Pipes Additional Insulation loads`
    );
  }

  function showImportErrorMsg(msg: string) {
    dispatch(addEventAction(`Insulation Load: ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: TPipeInsulationLoad[] = [];
      for (const item of imported) {
        let newLoad: TPipeInsulationLoad = { ...initLoad, id: getNextId(newLoads) };
        const itemElement = item["Pipe No."];
        const itemThickness = item["Thickness (mm)"];
        const itemDensity = item["Density (kg/m^3)"];
        if (itemElement) {
          const pipe = pipes.find((p) => p.pipe === itemElement);
          if (pipe) {
            newLoad = { ...newLoad, element: pipe.pipe };
          } else showImportErrorMsg(`(id: ${item.id}) - a pipe "${itemElement}" not found!`);
        }
        newLoad = {
          ...newLoad,
          thickness: checkImportedNumber(itemThickness, false) ?? 0,
          density: checkImportedNumber(itemDensity, false) ?? 0,
        };
        newLoads.push(newLoad);
      }
      handleChangeData(newLoads);
    });
  }

  return (
    <div className="d-flex f-grow f-column">
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={visible ? "caret-down" : "caret-right"}
          onClick={() => setVisible(!visible)}
        />
        <span>Insulation Loads</span>
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
      {visible ? (
        <>
          <div className="hr" />
          <div className={"small-table-container bg-dark p-5"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th></th>
                  <th>Pipe No.</th>
                  <th>Thickness (mm)</th>
                  <th>
                    Density (kg/m<sup>3</sup>)
                  </th>
                  <th>Name / Type</th>
                </tr>
              </thead>
              <tbody>{loads.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
