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
import { EProcessElementType, TProcessValve } from "../../../../../store/process/types";
import { NumericCell } from "../../../../common/NumericCell";
import { exportToCSV, importFromCSV, checkImportedNumber } from "../../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function ControlValves({ onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const state = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  const valves = useMemo(() => {
    const process = state.processes.get(current);
    if (!process) return [];
    const valves: TProcessValve[] = [];
    for (const el of Array.from(process.elements.values())) {
      if (el.type === EProcessElementType.VALVE) valves.push(el as TProcessValve);
    }
    return valves;
  }, [current, state]);

  const data = useMemo(() => {
    const process = state.processes.get(current);
    return process?.analysis.valveSummary;
  }, [current, state]);

  function handleChangeData(field: string, UOM: string) {
    const process = state.processes.get(current);
    if (!process) return;
    dispatch(
      changeProcessAnalysisAction(current, {
        ...process,
        analysis: {
          ...process.analysis,
          valveSummary: {
            ...process.analysis.valveSummary,
            // @ts-ignore
            [field]: { ...process.analysis.valveSummary[field], UOM },
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
          {getCells(key)}
        </tr>
      );
    });
  }

  function getCells(field: string) {
    return valves.map((v: any) => {
      return (
        <NumericCell
          key={`${v.name}-${field}`}
          isDecimal={true}
          value={v.details[field]}
          onChange={(val) => handleChange(v, field, val)}
          className={"w-50"}
        />
      );
    });
  }

  function handleChange(valve: TProcessValve, field: string, value: any) {
    dispatch(
      changeProcessElementAction(current, valve.name, {
        ...valve,
        details: { ...valve.details, [field]: value },
      } as TProcessValve)
    );
  }

  function getItemsForCSV(key: string) {
    const field = valves.reduce((acc, v) => {
      // @ts-ignore
      return { ...acc, [v.name]: v.details[key] };
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
        ...getItemsForCSV(key),
      })),
      "Control Valves"
    );
  }

  function handleImport() {
    const process = state.processes.get(current);
    if (!process || !data) return;
    importFromCSV((rows) => {
      if (!Array.isArray(rows)) return;
      const names = rows[0] ? Object.keys(rows[0]).filter((d) => d.includes("VALVE")) : [];
      const entries = Object.entries(data);
      let valveSummary = { ...data };
      for (const name of names) {
        let valve = valves.find((p) => p.name === name);
        if (!valve) continue;
        for (const row of rows) {
          const desc = row["Parameter/Variable Description"];
          const entry = entries.find(([k, v]) => v.desc === desc);
          if (!entry) continue;
          valveSummary = { ...valveSummary, [entry[0]]: { ...entry[1], UOM: row.UOM } };
          valve = {
            ...valve,
            details: {
              ...valve.details,
              [entry[0]]: checkImportedNumber(row[name]),
            },
          };
        }
        dispatch(changeProcessElementAction(current, name, valve));
      }
      dispatch(
        changeProcessAnalysisAction(current, {
          ...process,
          analysis: { ...process.analysis, valveSummary },
        })
      );
    });
  }

  return (
    <CustomDlg
      title={"Control Valves"}
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
                    {valves.map((v) => (
                      <th key={v.name}>{v.name}</th>
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
