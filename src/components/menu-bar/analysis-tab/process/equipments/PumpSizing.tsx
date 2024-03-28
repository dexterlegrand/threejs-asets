import React, { useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { InputCell } from "../../../../common/InputCell";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  changeProcessAnalysisAction,
  changeProcessElementAction,
} from "../../../../../store/process/actions";
import { TProcessPump, EProcessElementType } from "../../../../../store/process/types";
import { NumericCell } from "../../../../common/NumericCell";
import { exportToCSV, importFromCSV, checkImportedNumber } from "../../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function PumpSizing({ onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const state = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  const pumps = useMemo(() => {
    const process = state.processes.get(current);
    if (!process) return [];
    const pumps: TProcessPump[] = [];
    for (const el of Array.from(process.elements.values())) {
      if (el.type === EProcessElementType.PUMP) pumps.push(el as TProcessPump);
    }
    return pumps;
  }, [current, state]);

  const data = useMemo(() => {
    const process = state.processes.get(current);
    return process?.analysis.pumpSummary;
  }, [current, state]);

  function handleChangeData(field: string, UOM: string) {
    const process = state.processes.get(current);
    if (!process) return;
    dispatch(
      changeProcessAnalysisAction(current, {
        ...process,
        analysis: {
          ...process.analysis,
          pumpSummary: {
            ...process.analysis.pumpSummary,
            // @ts-ignore
            [field]: { ...process.analysis.pumpSummary[field], UOM },
          },
        },
      })
    );
  }

  function drawRows() {
    if (!data) return null;
    return Object.entries(data).map(([key, dataVal]) => {
      return (
        <tr key={key}>
          <td>{dataVal.desc}</td>
          <td>{dataVal.label}</td>
          <InputCell
            value={dataVal.UOM}
            onChange={(val) => handleChangeData(key, val)}
            className={"w-100"}
          />
          {getPumpCells(key)}
        </tr>
      );
    });
  }

  function getPumpCells(field: string) {
    return pumps.map((p: any) => {
      return (
        <NumericCell
          key={`${p.name}-${field}`}
          isDecimal={true}
          value={p.details[field]}
          onChange={(val) => handleChange(p, field, val)}
          className={"w-50"}
        />
      );
    });
  }

  function handleChange(pump: TProcessPump, field: string, value: any) {
    dispatch(
      changeProcessElementAction(current, pump.name, {
        ...pump,
        details: { ...pump.details, [field]: value },
      } as TProcessPump)
    );
  }

  function getPumpsForCSV(key: string) {
    const field = pumps.reduce((acc, p) => {
      // @ts-ignore
      return { ...acc, [p.name]: p.details[key] };
    }, {});
    return field;
  }

  function handleExport() {
    if (!data) return;
    exportToCSV(
      Object.entries(data).map(([key, dataVal]) => ({
        "Parameter/Variable Description": dataVal.desc,
        "Parameter/Variable Label": dataVal.label,
        UOM: dataVal.UOM,
        ...getPumpsForCSV(key),
      })),
      "Pump Sizing"
    );
  }

  function handleImport() {
    const process = state.processes.get(current);
    if (!process || !data) return;
    importFromCSV((rows) => {
      if (!Array.isArray(rows)) return;
      const names = rows[0] ? Object.keys(rows[0]).filter((d) => d.includes("PUMP")) : [];
      const entries = Object.entries(data);
      let pumpSummary = { ...data };
      for (const name of names) {
        let pump = pumps.find((p) => p.name === name);
        if (!pump) continue;
        for (const row of rows) {
          const desc = row["Parameter/Variable Description"];
          const entry = entries.find(([k, v]) => v.desc === desc);
          if (!entry) continue;
          pumpSummary = { ...pumpSummary, [entry[0]]: { ...entry[1], UOM: row.UOM } };
          pump = {
            ...pump,
            details: {
              ...pump.details,
              [entry[0]]: checkImportedNumber(row[name]),
            },
          };
        }
        dispatch(changeProcessElementAction(current, name, pump));
      }
      dispatch(
        changeProcessAnalysisAction(current, {
          ...process,
          analysis: { ...process.analysis, pumpSummary },
        })
      );
    });
  }

  return (
    <CustomDlg
      title={"Pump Sizing"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
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
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Parameter/Variable Description</th>
                    <th>Parameter/Variable Label</th>
                    <th>UOM</th>
                    {pumps.map((p) => (
                      <th key={p.name}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{drawRows()}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
