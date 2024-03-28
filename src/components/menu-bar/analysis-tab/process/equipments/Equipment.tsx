import React, { useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeProcessElementAction } from "../../../../../store/process/actions";
import { EProcessElementType, TProcessElement } from "../../../../../store/process/types";
import { NumericCell } from "../../../../common/NumericCell";
import { exportToCSV, importFromCSV } from "../../../../3d-models/utils";

type Props = {
  type: EProcessElementType;
  onClose: () => any;
};

export function Equipment({ type, onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const state = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  const items = useMemo(() => {
    const process = state.processes.get(current);
    if (!process) return [];
    const items: TProcessElement[] = [];
    for (const el of Array.from(process.elements.values())) {
      if (el.type === type) items.push(el);
    }
    return items;
  }, [current, state]);

  const data = useMemo(() => {
    return {};
  }, [current, state]);

  function handleChangeData(field: string, UOM: string) {
    const process = state.processes.get(current);
    if (!process) return;
    // dispatch(
    //   changeProcessAnalysisAction(current, {
    //     ...process,
    //     analysis: {
    //       ...process.analysis,
    //       pumpSummary: {
    //         ...process.analysis.pumpSummary,
    //         // @ts-ignore
    //         [field]: { ...process.analysis.pumpSummary[field], UOM },
    //       },
    //     },
    //   })
    // );
  }

  function drawRows() {
    if (!data) return null;
    return Object.entries(data).map(([key, dataVal]) => {
      return (
        <tr key={key}>
          {/* <td>{dataVal.desc}</td> */}
          {/* <td>{dataVal.label}</td> */}
          {/* <InputCell
            value={dataVal.UOM}
            onChange={(val) => handleChangeData(key, val)}
            className={"w-100"}
          /> */}
          {getCells(key)}
        </tr>
      );
    });
  }

  function getCells(field: string) {
    return items.map((item: any) => {
      return (
        <NumericCell
          key={`${item.name}-${field}`}
          isDecimal={true}
          value={item.details[field]}
          onChange={(val) => handleChange(item, field, val)}
          className={"w-50"}
        />
      );
    });
  }

  function handleChange(item: TProcessElement, field: string, value: any) {
    dispatch(
      changeProcessElementAction(current, item.name, {
        ...item,
        details: { ...item.details, [field]: value },
      })
    );
  }

  function getForCSV(key: string) {
    const field = items.reduce((acc, item) => {
      return { ...acc, [item.name]: item.details ? item.details[key] : "" };
    }, {});
    return field;
  }

  function handleExport() {
    if (!data) return;
    exportToCSV(
      Object.entries(data).map(([key, dataVal]) => ({
        // "Parameter/Variable Description": dataVal.desc,
        // "Parameter/Variable Label": dataVal.label,
        // UOM: dataVal.UOM,
        ...getForCSV(key),
      })),
      `${type} Equipment`
    );
  }

  function handleImport() {
    const process = state.processes.get(current);
    if (!process || !data) return;
    importFromCSV((rows) => {
      if (!Array.isArray(rows)) return;
      const names = rows[0] ? Object.keys(rows[0]).filter((d) => d.includes(type)) : [];
      for (const name of names) {
        let item = items.find((item) => item.name === name);
        if (!item) continue;
        for (const row of rows) {
          // const desc = row["Parameter/Variable Description"];
          // const entry = entries.find(([k, v]) => v.desc === desc);
          // if (!entry) continue;
          // pumpSummary = { ...pumpSummary, [entry[0]]: { ...entry[1], UOM: row.UOM } };
          item = {
            ...item,
            details: {
              ...item.details,
              // [entry[0]]: checkImportedNumber(row[name]),
            },
          };
        }
        dispatch(changeProcessElementAction(current, name, item));
      }
    });
  }

  return (
    <CustomDlg
      title={`${type} Equipment`}
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
                    {/* <th>Parameter/Variable Description</th>
                    <th>Parameter/Variable Label</th>
                    <th>UOM</th> */}
                    {items.map((p) => (
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
