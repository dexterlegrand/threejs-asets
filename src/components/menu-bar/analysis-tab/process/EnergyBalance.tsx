import React, { useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { TProcessEnergyBalance } from "../../../../store/process/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import {
  getCurrentProcess,
  getNextId,
  exportToCSV,
  fixNumberToStr,
  importFromCSV,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { changeProcessAnalysisAction } from "../../../../store/process/actions";
import { InputCell } from "../../../common/InputCell";
import { NumericCell } from "../../../common/NumericCell";

type Props = {
  onClose: () => any;
};

export function EnergyBalance({ onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const process = useSelector((state: ApplicationState) => getCurrentProcess(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return process?.analysis.energyBalances ?? [];
  }, [process]);

  function handleChangeData(energyBalances: TProcessEnergyBalance[]) {
    if (!process) return;
    dispatch(
      changeProcessAnalysisAction(current, {
        ...process,
        analysis: { ...process.analysis, energyBalances },
      })
    );
  }

  function handleAdd() {
    handleChangeData([
      ...data,
      { id: getNextId(data), selected: false, stage: "", UOM: "", energyIn: 0, energyOut: 0 },
    ]);
  }

  function handleChange(row: TProcessEnergyBalance, field: string, val: any) {
    handleChangeData(
      data.map((d) => {
        if (d.id === row.id) {
          return { ...d, [field]: val };
        } else return d;
      })
    );
  }

  function handleDelete() {
    handleChangeData(data.filter((d) => !d.selected));
  }

  function handleExport() {
    exportToCSV(
      data.map((d) => ({
        id: d.id,
        Stage: d.stage,
        UOM: d.UOM,
        "Energy In": fixNumberToStr(d.energyIn),
        "Energy Out": fixNumberToStr(d.energyOut),
      })),
      "Energy Balance"
    );
  }

  function handleImport() {
    importFromCSV((data) => {
      if (!Array.isArray(data)) return;
      const news: TProcessEnergyBalance[] = [];
      for (const item of data) {
        const newItem: TProcessEnergyBalance = {
          id: news.length,
          selected: false,
          stage: item.Stage ?? "",
          UOM: item.UOM ?? "",
          energyIn: checkImportedNumber(item["Energy In"]) ?? 0,
          energyOut: checkImportedNumber(item["Energy Out"]) ?? 0,
        };
        news.push(newItem);
      }
      handleChangeData(news);
    });
  }

  function getRow(row: TProcessEnergyBalance) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(val) => handleChange(row, "selected", val)}
        />
        <InputCell value={row.stage} onChange={(val) => handleChange(row, "stage", val)} />
        <InputCell value={row.UOM} onChange={(val) => handleChange(row, "UOM", val)} />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.energyIn}
          onChange={(val) => handleChange(row, "energyIn", val)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.energyOut}
          onChange={(val) => handleChange(row, "energyOut", val)}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Energy Balance"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
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
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell data={data} onChange={(res) => handleChangeData(res)} />
                    <th>Stage</th>
                    <th>UOM</th>
                    <th>Energy In</th>
                    <th>Energy Out</th>
                  </tr>
                </thead>
                <tbody>{data.map(getRow)}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
