import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@blueprintjs/core";
import { ApplicationState } from "../../../../../store";
import { changeProcessAnalysisAction } from "../../../../../store/process/actions";
import { TProcessHeatExchanger } from "../../../../../store/process/types";
import { CustomDlg } from "../../../../common/CustomDlg";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  getCurrentProcess,
  getNextId,
  exportToCSV,
  fixNumberToStr,
  importFromCSV,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { InputCell } from "../../../../common/InputCell";
import { NumericCell } from "../../../../common/NumericCell";

type Props = {
  onClose: () => any;
};

export function HeatExchanger({ onClose }: Props) {
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const process = useSelector((state: ApplicationState) => getCurrentProcess(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return process?.analysis.heatExchangers ?? [];
  }, [process]);

  function handleChangeData(heatExchangers: TProcessHeatExchanger[]) {
    if (!process) return;
    dispatch(
      changeProcessAnalysisAction(current, {
        ...process,
        analysis: { ...process.analysis, heatExchangers },
      })
    );
  }

  function handleAdd() {
    handleChangeData([
      ...data,
      { id: getNextId(data), selected: false, HEID: "", parameter: "", UOM: "", value: 0 },
    ]);
  }

  function handleChange(row: TProcessHeatExchanger, field: string, val: any) {
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
        HEID: d.HEID,
        Parameter: d.parameter,
        UOM: d.UOM,
        Value: fixNumberToStr(d.value),
      })),
      "Heat Exchanger"
    );
  }

  function handleImport() {
    importFromCSV((data) => {
      if (!Array.isArray(data)) return;
      const news: TProcessHeatExchanger[] = [];
      for (const item of data) {
        const newItem: TProcessHeatExchanger = {
          id: news.length,
          selected: false,
          HEID: item.HEID ?? "",
          parameter: item.Parameter ?? "",
          UOM: item.UOM ?? "",
          value: checkImportedNumber(item.Value) ?? 0,
        };
        news.push(newItem);
      }
      handleChangeData(news);
    });
  }

  function getRow(row: TProcessHeatExchanger) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(val) => handleChange(row, "selected", val)}
        />
        <InputCell value={row.HEID} onChange={(val) => handleChange(row, "HEID", val)} />
        <InputCell value={row.parameter} onChange={(val) => handleChange(row, "parameter", val)} />
        <InputCell value={row.UOM} onChange={(val) => handleChange(row, "UOM", val)} />
        <NumericCell
          isDecimal={true}
          value={row.value}
          onChange={(val) => handleChange(row, "value", val)}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Heat Exchanger"}
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
                    <th>HE ID</th>
                    <th>Parameter</th>
                    <th>UOM</th>
                    <th>Value</th>
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
