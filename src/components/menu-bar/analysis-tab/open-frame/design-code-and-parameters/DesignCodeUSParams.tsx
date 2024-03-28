import React, { useMemo, useState } from "react";
import { NumericCell } from "../../../../common/NumericCell";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { ApplicationState } from "../../../../../store";
import {
  getElementByName,
  getNextId,
  checkImportedNumber,
  exportToCSV,
  importFromCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { getOFModels } from "../../../../3d-models/openFrame";
import { changeUIAction } from "../../../../../store/ui/actions";
import {
  AmericanEffectiveLengthUI,
  TDeflectionLengthOF,
} from "../../../../../store/ui/types";
import {
  getOFEffectiveLengths,
  getOFDeflectionLengths,
} from "./designCodeUtils";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

export default React.memo(function DesignCodeUSParams() {
  const [tab, setTab] = useState<"EL" | "DL">("EL");

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const scene = useSelector((state: ApplicationState) => state.main.scene);

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const params = useMemo(
    () => ui?.designCodeAndParametersUI.americanDesignCode,
    [ui]
  );

  function handleChangeParams(field: string, value: any) {
    if (!ui || !params) return;
    dispatch(
      changeUIAction({
        ...ui,
        designCodeAndParametersUI: {
          ...ui.designCodeAndParametersUI,
          americanDesignCode: {
            ...params,
            [field]: value,
          },
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
        params.effectiveLengths.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
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

  function drawRow(item: AmericanEffectiveLengthUI) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item.id, "selected", value)}
        />
        <td>{item.model}</td>
        <td>{item.element}</td>
        <td>{item.elementNo}</td>
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
        <NumericCell
          isDecimal={true}
          value={item.UNLB}
          onChange={(value) => handleChangeRow(item.id, "UNLB", value)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.UNLT}
          onChange={(value) => handleChangeRow(item.id, "UNLT", value)}
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
    exportToCSV(params.effectiveLengths, "US Design Code and Parameters");
  }

  function handleImport() {
    if (!params) return;
    importFromCSV((data, isCSV) => {
      if (!isCSV) return;
      const newParams: AmericanEffectiveLengthUI[] = [];
      for (const item of data) {
        if (item.id === undefined || item.id === null) break;
        const newItem: AmericanEffectiveLengthUI = {
          id: getNextId(newParams),
          Ky: checkImportedNumber(item.Ky) ?? 0,
          Kz: checkImportedNumber(item.Kz) ?? 0,
          Ly: checkImportedNumber(item.Ly) ?? 0,
          Lz: checkImportedNumber(item.Lz) ?? 0,
          selected: false,
          UNLB: checkImportedNumber(item.UNLB) ?? 0,
          UNLT: checkImportedNumber(item.UNLT) ?? 0,
          model: item.model,
          element: item.element,
          elementNo: item.elementNo,
        };
        newParams.push(newItem);
      }
      handleChangeParams("effectiveLengths", newParams);
    });
  }

  function handleGenerate() {
    if (!params || !ui) return;
    dispatch(
      changeUIAction({
        ...ui,
        designCodeAndParametersUI: {
          ...ui.designCodeAndParametersUI,
          americanDesignCode: {
            ...params,
            effectiveLengths: project
              ? getOFEffectiveLengths(
                  ui.openFrameUI,
                  ui.designCodeAndParametersUI,
                  models,
                  project,
                  scene
                ).map((item) => ({
                  ...item,
                  UNLB: 0,
                  UNLT: 0,
                }))
              : [],
            deflectionLengths: getOFDeflectionLengths(
              models,
              ui.openFrameUI.loadingsUI
            ),
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
                <td>Cb</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.cb}
                  disabled={!params}
                  onChange={(cb) => handleChangeParams("cb", cb)}
                  className={"w-50"}
                />
                <td>Chapter F</td>
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
                <td></td>
              </tr>
              <tr>
                <td>KL/r max Columns</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.klrMaxColumns}
                  disabled={!params}
                  onChange={(klrMaxColumns) =>
                    handleChangeParams("klrMaxColumns", klrMaxColumns)
                  }
                  className={"w-50 center"}
                />
                <td></td>
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
                <td></td>
              </tr>
              <tr>
                <td>KL/r max Beams</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.klrMaxBeams}
                  disabled={!params}
                  onChange={(klrMaxBeams) =>
                    handleChangeParams("klrMaxBeams", klrMaxBeams)
                  }
                  className={"w-50"}
                />
                <td></td>
              </tr>
              <tr>
                <td>Act. / Allow. Stress Ratio</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.stressRation}
                  disabled={!params}
                  onChange={(stressRation) =>
                    handleChangeParams("stressRation", stressRation)
                  }
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
          <span>Table for Effective length of comp. Memb.</span>
        ) : (
          <span>Deflection length &quot;dl&quot; </span>
        )}
        <Button
          small
          text="Generate"
          intent="danger"
          onClick={handleGenerate}
        />
      </div>
      <div className="label-light bg-dark">
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={handleDeleteRows}
        />
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={handleExport}
        />
        {tab === "EL" ? (
          <Button
            small
            icon="import"
            text="Import from CSV"
            intent="success"
            onClick={handleImport}
          />
        ) : null}
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
                  <th>Open Frame No.</th>
                  <th>Beam No.</th>
                  <th>Element No.</th>
                  <th>Ky</th>
                  <th>Kz</th>
                  <th>Ly (m)</th>
                  <th>Lz (m)</th>
                  <th>UNLB</th>
                  <th>UNLT</th>
                </tr>
              </thead>
              <tbody>
                {params
                  ? params.effectiveLengths.map((item) => drawRow(item))
                  : null}
              </tbody>
            </table>
          ) : (
            <table className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    data={params?.deflectionLengths ?? []}
                    onChange={(deflectionLengths) => {
                      handleChangeParams(
                        "deflectionLengths",
                        deflectionLengths
                      );
                    }}
                  />
                  <th>Open Frame No.</th>
                  <th>Element No.</th>
                  <th>dl</th>
                </tr>
              </thead>
              <tbody>
                {params
                  ? params.deflectionLengths?.map((item) => drawDLRow(item))
                  : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
});
