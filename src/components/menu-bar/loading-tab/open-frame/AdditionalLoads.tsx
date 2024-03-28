import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@blueprintjs/core";
import { LoadType, Project } from "../../../../store/main/types";
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
  fixNumberToStr,
  roundM,
} from "../../../3d-models/utils";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import {
  DeadLoadsUI,
  AdditionalLoadUI,
  LiveLoadsUI,
  WindLoadUI,
  OpenFrameUI,
  ProjectUI,
  TProfilePressure,
} from "../../../../store/ui/types";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { secondServerAPI } from "../../../../pages/utils/agent";
import {
  addEventAction,
  changeProjectRequestProgressAction,
} from "../../../../store/ui/actions";
import { getJSONForDesignCodesAndParametersOF } from "../../../3d-models/designCodeAndParametersOF";
import { Scene } from "three";
import Axios from "axios";
import { jsonOptions } from "../../../../store/main/actions";

type Props = {
  scene?: Scene;
  ui?: ProjectUI;
  openFrameUI?: OpenFrameUI;
  project?: Project;
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

export function AdditionalLoadsOF({
  scene,
  ui,
  openFrameUI,
  project,
  data,
  models,
  load,
  onChange,
  onImportError,
}: Props) {
  const [display, setDisplay] = useState<boolean>(true);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const loads = useMemo(() => {
    return data.loads;
  }, [data.loads]);

  const profilesPressure = useMemo(() => {
    return (data as WindLoadUI).profilePressure;
  }, [(data as WindLoadUI).profilePressure]);

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
    return model
      ? [
          ...model.columns,
          ...model.beams,
          ...model.cantilevers,
          ...model.verticalBracings,
          ...model.horizontalBracings,
          ...model.kneeBracings,
        ]
      : [];
  }

  function getRow(item: AdditionalLoadUI) {
    const model = getElementByName(models, item.model);
    const elements = getElements(model);
    const element = getElementByName(elements, item.element);
    const maxDistance = element
      ? roundM(element.startPos.distanceTo(element.endPos))
      : 0;
    let Fx = false;
    let Fy = false;
    let Fz = false;
    let Mx = false;
    let My = false;
    let Mz = false;
    if (load === "windLoadUI") {
      Fx = !!(!item.Fx && (item.Fz || item.Mx));
      Fy = !item.Fx && !item.Fz && !item.Mx && !item.Mz;
      Fz = !!(!item.Fz && (item.Fx || item.Mz));
      Mx = !!(!item.Mx && (item.Fx || item.Mz));
      My = !item.Fx && !item.Fz && !item.Mx && !item.Mz;
      Mz = !!(!item.Mz && (item.Fz || item.Mx));
    }
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
        />
        <SelectorCell<string>
          items={convertToNamesArray(elements)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeLoad(item, "element", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <SelectorCell<LoadType>
          disabled={!item.element}
          items={loadTypes}
          selected={item.type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeLoad(item, "type", value)}
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
          disabled={!item.element || Fx}
          value={item.Fx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fy}
          value={item.Fy}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fz}
          value={item.Fz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mx}
          value={item.Mx}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || My}
          value={item.My}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mz}
          value={item.Mz}
          className={"w-50"}
          onChange={(value) => handleChangeLoad(item, "Mz", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    if (load === "windLoadUI" && (data as WindLoadUI).tab === "PP") {
      exportToCSV(
        (data as WindLoadUI).profilePressure?.map((item) => {
          return {
            "Height (m)": fixNumberToStr(item.height),
            "Pressure (N/m2)": fixNumberToStr(item.pressure),
          };
        }) ?? [],
        `Profile pressure calculation`
      );
    } else {
      const loadName =
        load === "deadLoadUI"
          ? "Dead"
          : load === "liveLoadUI"
          ? "Live"
          : "Wind";
      exportToCSV(loads, `Additional ${loadName} loads`);
    }
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
              const element = getElementByName(
                getElements(model),
                item.element
              );
              if (element) {
                newLoad = { ...newLoad, element: element.name };
              } else {
                onImportError(
                  `(id: ${item.id}) - an element "${item.element}" not found!`
                );
              }
            }
          } else {
            onImportError(
              `(id: ${item.id}) - a model "${item.model}" not found!`
            );
          }
        }
        if (item.type) {
          if (loadTypes.includes(item.type)) {
            newLoad = { ...newLoad, type: item.type };
          } else {
            onImportError(
              `(id: ${item.id}) - Incorrect load type "${item.type}"!`
            );
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

  async function handleGetProfilePressure() {
    if (!models.length) return;
    if (!ui || !openFrameUI || !data || !project || !scene) return;
    dispatch(
      changeProjectRequestProgressAction(project.name, "profilePressure")
    );
    const items: TProfilePressure[] = [];
    for (const model of models) {
      const json = getJSONForDesignCodesAndParametersOF(
        openFrameUI,
        ui.designCodeAndParametersUI,
        scene,
        project,
        model,
        models
      );
      try {
        const res = await Axios.post(
          `${secondServerAPI}/windload/US_Code/ASCE710/simplified_30.7/profilepress`,
          JSON.stringify(json),
          jsonOptions
        );
        for (let i = 0; i < res.data.height.length; i++) {
          items.push({
            id: getNextId(items),
            height: res.data.height[i] ?? 0,
            pressure: res.data.pressure[i] ?? 0,
          });
        }
      } catch (err) {
        console.error(err);
        dispatch(
          addEventAction(
            // @ts-ignore
            `Profile Pressure (${model.name}): ${err.message}`,
            "danger"
          )
        );
      }
    }
    onChange("profilePressure", items);
    dispatch(
      changeProjectRequestProgressAction(project.name, "profilePressure", false)
    );
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
        {load === "windLoadUI" &&
        models.some((model) => model.structuralNaturalFrequency) ? (
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
        {load === "windLoadUI" &&
          (data as WindLoadUI).windLoadingAsPerCode === "US Code" && (
            <>
              <span>|</span>
              <Button
                small
                minimal
                className={"c-light"}
                text={"Profile pressure"}
                onClick={() => onChange("tab", "PP")}
              />
            </>
          )}
        {(data as WindLoadUI).tab !== "NF" &&
          (data as WindLoadUI).tab !== "PP" && (
            <Button
              small
              icon="trash"
              text="Delete"
              intent="warning"
              onClick={handleDeleteRows}
            />
          )}
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={handleExport}
        />
        {(data as WindLoadUI).tab !== "NF" &&
          (data as WindLoadUI).tab !== "PP" && (
            <>
              <Button
                small
                icon="import"
                text="Import from CSV"
                intent="success"
                onClick={handleImport}
              />
              <Button
                small
                icon="plus"
                text="Add Row"
                intent="primary"
                onClick={handleAddRow}
              />
            </>
          )}
        {(data as WindLoadUI).tab === "PP" && (
          <Button
            small
            text="Calculate"
            intent="danger"
            onClick={handleGetProfilePressure}
          />
        )}
      </div>
      {display && (
        <>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              {load === "windLoadUI" && (data as WindLoadUI).tab === "NF" && (
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
              )}
              {load === "windLoadUI" && (data as WindLoadUI).tab === "PP" && (
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <th>Height (m)</th>
                      <th>Pressure (N/m2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(profilesPressure ?? []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.height}</td>
                        <td>{item.pressure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(load !== "windLoadUI" || (data as WindLoadUI).tab === "AL") && (
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <GeneralCheckBoxCell
                        rowSpan={2}
                        data={loads}
                        onChange={(loads) => onChange("loads", loads)}
                      />
                      <th rowSpan={2}>OF No.</th>
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
          </div>
        </>
      )}
    </div>
  );
}
