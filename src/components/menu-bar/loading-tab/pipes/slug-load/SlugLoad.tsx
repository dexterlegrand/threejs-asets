import React, { useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../../common/CustomDlg";
import { ApplicationState } from "../../../../../store";
import {
  getElementByName,
  getNextId,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { loadTypes } from "../../../../../store/main/constants";
import { changeProjectAction } from "../../../../../store/main/actions";
import { TPipeSlugLoad } from "../../../../../store/main/pipeTypes";

type Props = { onClose: () => any };

const initLoad: TPipeSlugLoad = {
  id: 0,
  selected: false,
  location: "End",
  velocity: 0,
  DLF: 2,
};

export function SlugLoadPP({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const loads = useMemo(() => {
    return project?.pipeLoadings.slugLoads ?? [];
  }, [project]);

  function handleChangeData(slugLoads: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: { ...project.pipeLoadings, slugLoads },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([...loads, { ...initLoad, id: getNextId(loads) }]);
  }

  function handleDeleteRows() {
    handleChangeData(loads.filter((item) => !item.selected));
  }

  function handleChange(item: TPipeSlugLoad, field: string, value: any) {
    handleChangeData(
      loads.map((load) => {
        if (load.id === item.id) {
          return { ...load, [field]: value };
        }
        return load;
      })
    );
  }

  function getRow(item: TPipeSlugLoad) {
    const pipe = pipes.find((p) => p.pipe === item.element);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={pipes
            .filter((p) => {
              const res =
                p.params.endConnector &&
                (p.params.endConnectorType === "Elbow" || p.params.endConnectorType === "Return");
              if (res) return true;
              if (p.params.endConnector && p.params.endConnectorType === "Tee") {
                const nexts = pipes.filter((r) => r.preceding === p.pipe);
                const anglesH: number[] = [];
                const anglesV: number[] = [];
                for (const next of nexts) {
                  if (!anglesH.includes(next.hDir)) anglesH.push(next.hDir);
                  if (!anglesV.includes(next.vDir)) anglesV.push(next.vDir);
                }
                if (
                  (anglesH.includes(90) && anglesH.includes(-90)) ||
                  (anglesV.includes(90) && anglesV.includes(-90))
                ) {
                  return true;
                }
              }
              const preceding = pipes.find((p1) => p1.pipe === p.preceding);
              if (preceding && preceding.params.endConnectorType === "Tee") {
                const next = pipes.find(
                  (r) =>
                    r.pipe !== p.pipe &&
                    r.preceding === preceding.pipe &&
                    Math.abs(r.hDir) !== 90 &&
                    Math.abs(r.vDir) !== 90
                );
                return !!next;
              }
              return false;
            })
            .map((p) => p.pipe)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChange(item, "element", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={["End"]}
          selected={item.location}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChange(item, "location", value)}
        />
        <td>{pipe?.params.fluidDensity ?? ""}</td>
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.velocity}
          className={"w-100"}
          onChange={(value) => handleChange(item, "velocity", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.DLF}
          className={"w-50"}
          onChange={(value) => handleChange(item, "DLF", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      loads.map((load) => ({
        ...load,
        id: load.id,
        "Pipe No.": load.element ?? "",
        Location: load.location,
        "Fluid Velocity (m/s)": load.velocity,
        DLF: load.DLF,
      })),
      `Pipes Additional Dead loads`
    );
  }

  function showImportErrorMsg(msg: string) {
    dispatch(addEventAction(`Slug Load: ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: TPipeSlugLoad[] = [];
      for (const item of imported) {
        let newLoad: TPipeSlugLoad = { ...initLoad, id: getNextId(newLoads) };
        const itemElement = item["Pipe No."];
        const itemD = item["Fluid Density (kg/m^3)"];
        const itemV = item["Length of UDL (m)"];
        if (itemElement) {
          const pipe = pipes.find((p) => p.pipe === itemElement);
          if (pipe) {
            newLoad = { ...newLoad, element: pipe.pipe };
          } else showImportErrorMsg(`(id: ${item.id}) - a pipe "${itemElement}" not found!`);
        }
        if (item.Location) {
          if (loadTypes.includes(item.Location)) {
            newLoad = { ...newLoad, location: item.Location };
          } else showImportErrorMsg(`(id: ${item.id}) - Incorrect location "${item.Location}"!`);
        }
        newLoad = {
          ...newLoad,
          velocity: checkImportedNumber(itemV, false) ?? 0,
          DLF: checkImportedNumber(item.DLF) ?? 0,
        };
        newLoads.push(newLoad);
      }
      handleChangeData(newLoads);
    });
  }

  return (
    <CustomDlg
      title={"Slug Load"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
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
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          </div>
          <div className="hr" />
          <div className={"table-container bg-dark p-5"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th></th>
                  <th>Pipe No.</th>
                  <th>Location</th>
                  <th>
                    Fluid Density (kg/m<sup>3</sup>)
                  </th>
                  <th>Fluid Velocity (m/s)</th>
                  <th>DLF</th>
                </tr>
              </thead>
              <tbody>{loads.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
