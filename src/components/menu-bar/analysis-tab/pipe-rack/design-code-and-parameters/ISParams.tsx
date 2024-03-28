import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@blueprintjs/core";
import { NumericCell } from "../../../../common/NumericCell";
import {
  IndianEffectiveLength,
  PipeRack,
  TDeflectionLengthPR,
} from "../../../../../store/main/types";
import { changeIndianDCAction } from "../../../../../store/main/actions";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { ApplicationState } from "../../../../../store";
import { getPREffectiveLengths, getPRDeflectionLengths } from "./designCodeUtils";
import { exportToCSV, fixNumberToStr } from "../../../../3d-models/utils";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

export function ISParams() {
  const [tab, setTab] = useState<"EL" | "DL">("EL");

  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((item) => item.name === state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return (project?.models.filter((model) => model.type === "Pipe Rack") ?? []) as PipeRack[];
  }, [project]);

  const params = useMemo(() => {
    return project?.indianDesignCode;
  }, [project]);

  function handleDeleteRows() {
    if (!params) return;
    if (tab === "EL") {
      dispatch(
        changeIndianDCAction({
          ...params,
          effectiveLengths: params.effectiveLengths.filter((item) => !item.selected),
        })
      );
    } else {
      dispatch(
        changeIndianDCAction({
          ...params,
          deflectionLengths: params.deflectionLengths?.filter((item) => !item.selected),
        })
      );
    }
  }

  function handleChangeRow(id: number, field: string, value: any) {
    if (!params) return;
    if (tab === "EL") {
      dispatch(
        changeIndianDCAction({
          ...params,
          effectiveLengths: params.effectiveLengths.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })
      );
    } else {
      dispatch(
        changeIndianDCAction({
          ...params,
          deflectionLengths: params.deflectionLengths?.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })
      );
    }
  }

  function drawRow(item: IndianEffectiveLength) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item.id, "selected", value)}
        />
        <td>{item.pr}</td>
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

  function drawDLRow(item: TDeflectionLengthPR) {
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

  function handleGenerate() {
    if (!params) return;
    dispatch(
      changeIndianDCAction({
        ...params,
        effectiveLengths: getPREffectiveLengths(models),
        deflectionLengths: getPRDeflectionLengths(models),
      })
    );
  }

  function handleExport() {
    if (tab === "EL") {
      exportToCSV(
        (params?.effectiveLengths ?? []).map((item) => ({
          id: item.id,
          "PR No.": item.pr ?? "",
          "Element No.": item.element ?? "",
          Ky: fixNumberToStr(item.Ky),
          Kz: fixNumberToStr(item.Kz),
          "Ly (m)": fixNumberToStr(item.Ly),
          "Lz (m)": fixNumberToStr(item.Lz),
        })),
        `PR IS Effective length`
      );
    } else {
      exportToCSV(
        (params?.deflectionLengths ?? []).map((item) => ({
          id: item.id,
          "PR No.": item.model ?? "",
          "Element No.": item.element ?? "",
          dl: fixNumberToStr(item.dl),
        })),
        "PR IS Deflection length"
      );
    }
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
                  onChange={(cmx) => params && dispatch(changeIndianDCAction({ ...params, cmx }))}
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
                  onChange={(cmy) => params && dispatch(changeIndianDCAction({ ...params, cmy }))}
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
                  onChange={(cmz) => params && dispatch(changeIndianDCAction({ ...params, cmz }))}
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
                    params && dispatch(changeIndianDCAction({ ...params, deflectionRatio }))
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
                  onChange={(klrMaxColumns) =>
                    params && dispatch(changeIndianDCAction({ ...params, klrMaxColumns }))
                  }
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
                    params && dispatch(changeIndianDCAction({ ...params, klrMaxBracings }))
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
                  onChange={(klrMaxBeams) =>
                    params && dispatch(changeIndianDCAction({ ...params, klrMaxBeams }))
                  }
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
                  onChange={(stressRation) =>
                    params && dispatch(changeIndianDCAction({ ...params, stressRation }))
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
      <div className="label-light bg-dark f-jc-between">
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
                    onChange={(effectiveLengths: IndianEffectiveLength[]) => {
                      if (!params) return;
                      dispatch(changeIndianDCAction({ ...params, effectiveLengths }));
                    }}
                  />
                  <th>PR No.</th>
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
                      if (!params) return;
                      dispatch(changeIndianDCAction({ ...params, deflectionLengths }));
                    }}
                  />
                  <th>PR No.</th>
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
