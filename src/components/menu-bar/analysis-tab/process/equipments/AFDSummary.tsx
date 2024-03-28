
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
import {
  EProcessElementType,
  TProcessElement,
  TProcess,
  TProcessAFD,
} from "../../../../../store/process/types";
import { NumericCell } from "../../../../common/NumericCell";
import { exportToCSV, importFromCSV, checkImportedNumber } from "../../../../3d-models/utils";
import { fixNumberToStr } from "../../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function AFDSummary({ onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const state = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  const items = useMemo(() => {
    const process = state.processes.get(current);
    if (!process) return [];
    const items: TProcessAFD[] = [];
    for (const el of Array.from(process.elements.values())) {
      if (el.type === EProcessElementType.AC) items.push(el as any);
    }
    return items;
  }, [current, state]);

  const data = useMemo(() => {
    const process = state.processes.get(current);
    return process?.analysis.AFDSummary;
  }, [current, state]);

  function handleChangeProcessElement(el: TProcessElement, field: string, value: any) {
    dispatch(changeProcessElementAction(current, el.name, { ...el, [field]: value }));
  }

  function handleChangeData(process: TProcess, field: string, UOM: string) {
    dispatch(
      changeProcessAnalysisAction(current, {
        ...process,
        analysis: {
          ...process.analysis,
          AFDSummary: {
            ...process.analysis.AFDSummary,
            // @ts-ignore
            [field]: { ...process.analysis.AFDSummary[field], UOM },
          },
        },
      })
    );
  }

  function drawRows() {
    if (!data) return null;
    const process = state.processes.get(current);
    if (!process) return null;
    return [
      <tr key={"tag"}>
        <td>{"Tag No."}</td>
        <td>{"Tag"}</td>
        <td>{"-"}</td>
        {items.map((item) => (
          <InputCell
            key={item.name}
            value={item.tag}
            onChange={(val) => handleChangeProcessElement(item, "tag", val)}
            className={"w-50"}
          />
        ))}
      </tr>,
      ...Object.entries(data).map(([key, dataVal]) => {
        return (
          <tr key={key}>
            <td>{dataVal.desc}</td>
            <td>{dataVal.label}</td>
            <InputCell
              value={dataVal.UOM}
              onChange={(val) => handleChangeData(process, key, val)}
              className={"w-100"}
            />
            {getCells(key)}
          </tr>
        );
      }),
    ];
  }

  function getCells(field: string) {
    return items.map((p: any) => {
      return (
        <InputCell
          key={`${p.name}-${field}`}
          /*isDecimal={true}*/
          value={p.details ? p.details[field] : undefined}
          onChange={(val) => handleChange(p, field, val)}
          className={"w-50"}
        />
      );
    });
  }

  function handleChange(item: TProcessAFD, field: string, value: any) {
    dispatch(
      changeProcessElementAction(current, item.name, {
        ...item,
        details: { ...item.details, [field]: value },
      })
    );
  }

  function getItemsForCSV(key: string) {
    const field = items.reduce((acc, p) => {
      // @ts-ignore
      return { ...acc, [p.tag]: p.details ? fixNumberToStr(p.details[key]) : "" };
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
      "AC Summary"
    );
  }

  function handleImport() {
    const process = state.processes.get(current);
    if (!process || !data) return;
    importFromCSV((rows) => {
      if (!Array.isArray(rows)) return;
      const names = rows[0] ? Object.keys(rows[0]).filter((d) => d.includes("")) : [];
      const entries = Object.entries(data);
      let AFDSummary = { ...data };
      for (const name of names) {
        let item = items.find((item) => item.tag === name);
        if (!item) continue;
        for (const row of rows) {
          const desc = row["Parameter/Variable Description"];
          const entry = entries.find(([k, v]) => v.desc === desc);
          if (!entry) continue;
          AFDSummary = {
            ...AFDSummary,
            [entry[0]]: { ...entry[1], UOM: row.UOM },
          };
          item = {
            ...item!,
            // @ts-ignore
            /*details: { ...item!.details, [entry[0]]: checkImportedNumber(row[name]) },*/
            details: {...item!.details, [entry[0]]: row[name] },
          };
        }
        dispatch(changeProcessElementAction(current, name, item!));
      }
      dispatch(
        changeProcessAnalysisAction(current, {
          ...process,
          analysis: { ...process.analysis, AFDSummary},
        })
      );
    });
  }

  return (
    <CustomDlg
      title={"AC Summary"}
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
                    {items.map((p) => (
                      <th key={p.tag}>{p.tag}</th>
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
