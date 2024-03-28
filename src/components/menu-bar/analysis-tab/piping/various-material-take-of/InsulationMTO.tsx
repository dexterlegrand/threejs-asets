import React, { useState, useMemo } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  getUnicuesArray,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../common/MultiSelector";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";

type Props = {
  onClose: () => any;
};

export function InsulationMTO({ onClose }: Props) {
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const rows = useMemo(() => [] as any[], []);

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const progress = useMemo(() => ui?.requests?.reports || ui?.requests?.weight, [ui]);

  function drawRow(item: any, i: number) {
    return (
      <tr key={i}>
        <td>{item.line}</td>
        <td>{item.name}</td>
        <td>{item.density}</td>
        <td>{item.weight}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          ...row,
          "Line No.": row.line,
          Name: row.name,
          Density: fixNumberToStr(row.density),
          "Weight (m)": fixNumberToStr(row.weight),
        };
      }),
      "Insulation MTO"
    );
  }

  return (
    <CustomDlg
      title={"Insulation MTO"}
      isMinimize={true}
      onClose={onClose}
      body={
        <div className="d-flex f-column f-grow">
          <div className="d-flex f-ai-center bg-dark label-light">
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
            <div className="t-end w-90">Line No.</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                items={lines}
                selected={selectedLines}
                onSelect={setSelectedLines}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className="hr" />
          {progress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className={"p-5 bg-dark"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Line No.</th>
                    <th>Name</th>
                    <th>Density</th>
                    <th>Wieght (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => drawRow(row, i))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>{rows.reduce((acc, row) => acc + row.weight, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
