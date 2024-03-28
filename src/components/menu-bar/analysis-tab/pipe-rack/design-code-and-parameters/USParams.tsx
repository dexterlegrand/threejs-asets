import React, { useMemo, useState } from "react";
import { NumericCell } from "../../../../common/NumericCell";
import {
  PipeRack,
  Element,
  AmericanEffectiveLength,
  TDeflectionLengthPR,
} from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { changeAmericanDCAction } from "../../../../../store/main/actions";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { ApplicationState } from "../../../../../store";
import { getPREffectiveLengths, getPRDeflectionLengths, getElements } from "./designCodeUtils";
import { exportToCSV, fixNumberToStr } from "../../../../3d-models/utils";

export function USParams() {
  const [tab, setTab] = useState<"EL" | "DL">("EL");

  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((item) => item.name === state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return (project?.models.filter((model) => model.type === "Pipe Rack") ?? []) as PipeRack[];
  }, [project]);

  const params = useMemo(() => {
    return project?.americanDesignCode;
  }, [project]);

  function handleDeleteRows() {
    if (!params) return;
    if (tab === "EL") {
      dispatch(
        changeAmericanDCAction({
          ...params,
          effectiveLengths: params.effectiveLengths.filter((item) => !item.selected),
        })
      );
    } else {
      dispatch(
        changeAmericanDCAction({
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
        changeAmericanDCAction({
          ...params,
          effectiveLengths: params.effectiveLengths.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })
      );
    } else {
      dispatch(
        changeAmericanDCAction({
          ...params,
          deflectionLengths: params.deflectionLengths?.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })
      );
    }
  }

  function drawRow(item: AmericanEffectiveLength) {
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
      changeAmericanDCAction({
        ...params,
        effectiveLengths: getPREffectiveLengths(models).map((el) => ({ ...el, UNLB: 0, UNLT: 0 })),
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
          UNLB: fixNumberToStr(item.UNLB),
          UNLT: fixNumberToStr(item.UNLT),
        })),
        "PR US Effective length"
      );
    } else {
      exportToCSV(
        (params?.deflectionLengths ?? []).map((item) => ({
          id: item.id,
          "PR No.": item.model ?? "",
          "Element No.": item.element ?? "",
          dl: fixNumberToStr(item.dl),
        })),
        "PR US Deflection length"
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
                <td>Cb</td>
                <NumericCell
                  isDecimal={true}
                  value={params?.cb}
                  disabled={!params}
                  onChange={(cb) => params && dispatch(changeAmericanDCAction({ ...params, cb }))}
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
                    params && dispatch(changeAmericanDCAction({ ...params, deflectionRatio }))
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
                    params && dispatch(changeAmericanDCAction({ ...params, klrMaxColumns }))
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
                    params && dispatch(changeAmericanDCAction({ ...params, klrMaxBracings }))
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
                    params && dispatch(changeAmericanDCAction({ ...params, klrMaxBeams }))
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
                    params && dispatch(changeAmericanDCAction({ ...params, stressRation }))
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
          <span>Table for Effective length of comp. Memb.</span>
        ) : (
          <span>Deflection length &quot;dl&quot;</span>
        )}
        <Button small text="Generate" intent="danger" onClick={handleGenerate} />
      </div>
      <div className="label-light bg-dark">
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
      </div>
      <div className="hr" />
      <div className={"small-table-container bg-dark p-5"}>
        {tab === "EL" ? (
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>Element No.</th>
                <th>Ky</th>
                <th>Kz</th>
                <th>Ly (m)</th>
                <th>Lz (m)</th>
                <th>UNLB</th>
                <th>UNLT</th>
              </tr>
            </thead>
            <tbody>{params ? params.effectiveLengths.map((item) => drawRow(item)) : null}</tbody>
          </table>
        ) : (
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
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
    </>
  );
}
