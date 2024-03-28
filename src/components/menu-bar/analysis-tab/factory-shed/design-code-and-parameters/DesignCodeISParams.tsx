import React, { useMemo, useState } from "react";
import { NumericCell } from "../../../../common/NumericCell";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { ApplicationState } from "../../../../../store";
import { getFSModels } from "../../../../3d-models/openFrame";
import {
  getElementByName,
  getNextId,
  convertToNamesArray,
  exportToCSV,
  checkImportedNumber,
  importFromCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { changeUIAction, addEventAction } from "../../../../../store/ui/actions";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { IndianEffectiveLengthUI, TDeflectionLengthOF } from "../../../../../store/ui/types";
import { getFSEffectiveLengths, getFSDeflectionLengths, getElements } from "./designCodeUtils";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

export function DesignCodeISParams() {
  const [tab, setTab] = useState<"EL" | "DL">("EL");

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  const params = useMemo(() => ui?.designCodeAndParametersUI.indianDesignCode, [ui]);

  function handleChangeParams(field: string, value: any) {
    if (!ui || !params) return;
    dispatch(
      changeUIAction({
        ...ui,
        designCodeAndParametersUI: {
          ...ui.designCodeAndParametersUI,
          indianDesignCode: { ...params, [field]: value },
        },
      })
    );
  }

  function handleDeleteRows() {
    if (!params) return;
    if (tab === "EL") {
      handleChangeParams(
        "effectiveLengths",
        params.effectiveLengths.filter((item) => !item.selected)
      );
    } else {
      handleChangeParams(
        "deflectionLengths",
        params.deflectionLengths?.filter((item) => !item.selected)
      );
    }
  }

  function handleChangeRow(id: number, field: string, value: any) {
    if (!params) return;
    if (tab === "EL") {
      handleChangeParams(
        "effectiveLengths",
        params.effectiveLengths.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    } else {
      handleChangeParams(
        "deflectionLengths",
        params.deflectionLengths?.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    }
  }

  function drawRow(item: IndianEffectiveLengthUI) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item.id, "selected", value)}
        />
        <td>{item.model}</td>
        <td>{item.element}</td>
        <NumericCell
          isDecimal={true}
          value={item.Ky}
          onChange={(value) => handleChangeRow(item.id, "Ky", value)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.Kz}
          onChange={(value) => handleChangeRow(item.id, "Kz", value)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.Ly}
          onChange={(value) => handleChangeRow(item.id, "Ly", value)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.Lz}
          onChange={(value) => handleChangeRow(item.id, "Lz", value)}
          className={"w-50"}
        />
      </tr>
    );
  }

  function drawDLRow(item: TDeflectionLengthOF) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item.id, "selected", value)}
        />
        <td>{item.model}</td>
        <td>{item.element}</td>
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.dl}
          onChange={(value) => handleChangeRow(item.id, "dl", value)}
          className={"w-50"}
        />
      </tr>
    );
  }

  function handleExport() {
    if (!params) return;
    exportToCSV(params.effectiveLengths, "IS Design Code and Parameters");
  }

  function handleGenerate() {
    if (!params || !ui) return;
    dispatch(
      changeUIAction({
        ...ui,
        designCodeAndParametersUI: {
          ...ui.designCodeAndParametersUI,
          indianDesignCode: {
            ...params,
            effectiveLengths: getFSEffectiveLengths(models, ui.openFrameUI.loadingsUI),
            deflectionLengths: getFSDeflectionLengths(models, ui.openFrameUI.loadingsUI),
          },
        },
      })
    );
  }

  return (
    <>
      <div className={"hr"} />
      <div className={"d-flex f-grow bg-dark p-5"}>
        <div className="d-flex f-grow f-column bg-gray">
          <table className={"simple-table"}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Ref.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cmx</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.cmx}
                  disabled={!params}
                  onChange={(cmx) => handleChangeParams("cmx", cmx)}
                  className={"w-50"}
                />
                <td>Sec. 9.3.2.2</td>
              </tr>
              <tr>
                <td>Cmy</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.cmy}
                  disabled={!params}
                  onChange={(cmy) => handleChangeParams("cmy", cmy)}
                  className={"w-50"}
                />
                <td>Sec. 9.3.2.2</td>
              </tr>
              <tr>
                <td>Cmz</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.cmz}
                  disabled={!params}
                  onChange={(cmz) => handleChangeParams("cmz", cmz)}
                  className={"w-50"}
                />
                <td>Sec. 9.3.2.2</td>
              </tr>
              <tr>
                <td>Deflection Ratio</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.deflectionRatio}
                  disabled={!params}
                  onChange={(deflectionRatio) =>
                    handleChangeParams("deflectionRatio", deflectionRatio)
                  }
                  className={"w-50"}
                />
                <td>Sec. 5.6.1</td>
              </tr>
              <tr>
                <td>KL/r max Columns</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.klrMaxColumns}
                  disabled={!params}
                  onChange={(klrMaxColumns) => handleChangeParams("klrMaxColumns", klrMaxColumns)}
                  className={"w-50 center"}
                />
                <td>Sec. 3.8 Table 3, i</td>
              </tr>
              <tr>
                <td>KL/r max Bracings</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.klrMaxBracings}
                  disabled={!params}
                  onChange={(klrMaxBracings) =>
                    handleChangeParams("klrMaxBracings", klrMaxBracings)
                  }
                  className={"w-50"}
                />
                <td>Sec. 3.8 Table 3, ii</td>
              </tr>
              <tr>
                <td>KL/r max Beams</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.klrMaxBeams}
                  disabled={!params}
                  onChange={(klrMaxBeams) => handleChangeParams("klrMaxBeams", klrMaxBeams)}
                  className={"w-50"}
                />
                <td>Sec. 3.8 Table 3, iii</td>
              </tr>
              <tr>
                <td>Act. / Allow. Stress Ratio</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.stressRation}
                  disabled={!params}
                  onChange={(stressRation) => handleChangeParams("stressRation", stressRation)}
                  className={"w-50"}
                />
                <td>For all elements</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={"hr"} />
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          className={"c-light"}
          text={"Effective length"}
          onClick={() => setTab("EL")}
        />
        <span>|</span>
        <Button
          small
          minimal
          className={"c-light"}
          text={"Deflection length"}
          onClick={() => setTab("DL")}
        />
      </div>
      <div className="label-light bg-dark">
        {tab === "EL" ? (
          <span>Table for Effective length of comp. Memb. (Sec. 7.2)</span>
        ) : (
          <span>Deflection length &quot;dl&quot; (Sec. 5.6.1)</span>
        )}
        <Button small text="Generate" intent="danger" onClick={handleGenerate} />
      </div>
      <div className="label-light bg-dark">
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
      </div>
      <div className="hr" />
      <div className={"bg-dark p-5"}>
        <div className={"small-table-container"}>
          {tab === "EL" ? (
            <table className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    data={params?.effectiveLengths ?? []}
                    onChange={(effectiveLengths) => {
                      handleChangeParams("effectiveLengths", effectiveLengths);
                    }}
                  />
                  <th>Factory Shed No.</th>
                  <th>Element No.</th>
                  <th>Ky</th>
                  <th>Kz</th>
                  <th>Ly (m)</th>
                  <th>Lz (m)</th>
                </tr>
              </thead>
              <tbody>{params ? params.effectiveLengths.map((item) => drawRow(item)) : null}</tbody>
            </table>
          ) : (
            <table className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    data={params?.deflectionLengths ?? []}
                    onChange={(deflectionLengths) => {
                      handleChangeParams("deflectionLengths", deflectionLengths);
                    }}
                  />
                  <th>Factory Shed No.</th>
                  <th>Element No.</th>
                  <th>dl</th>
                </tr>
              </thead>
              <tbody>
                {params ? params.deflectionLengths?.map((item) => drawDLRow(item)) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
