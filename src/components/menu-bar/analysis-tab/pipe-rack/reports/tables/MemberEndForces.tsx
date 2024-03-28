import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { PipeRack, Project, TMemberEndForce } from "../../../../../../store/main/types";
import {
  getTopOffset,
  getCurrentUI,
  fixNumberToStr,
  exportToCSV,
} from "../../../../../3d-models/utils";
import { LCLoadTypesList, LCTypesList } from "../../../../../../store/main/constants";
import { Paginator } from "../../../../../common/Paginator";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { MemberEndForceUI } from "../../../../../../store/ui/types";

type Props = {
  models: PipeRack[];
};

export function MemberEndForces(props: Props) {
  const { models } = props;
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const [selectedModels, setSelectedModels] = useState<PipeRack[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const reportsProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.reports
  );

  const rows = useMemo(() => {
    if (!ui) return [];
    return selectedModels.reduce((acc, model) => {
      const analysis = ui.analysisUI[model.name];
      return [...acc, ...(analysis?.memberEndForces ?? [])];
    }, [] as MemberEndForceUI[]);
  }, [ui, selectedModels, selectedTypes, selectedLists]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  });

  function drawRows(item: TMemberEndForce) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.elementNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.fx_1}</td>
        <td>{item.fx_2}</td>
        <td>{item.fy_1}</td>
        <td>{item.fy_2}</td>
        <td>{item.fz_1}</td>
        <td>{item.fz_2}</td>
        <td>{item.mx_1}</td>
        <td>{item.mx_2}</td>
        <td>{item.my_1}</td>
        <td>{item.my_2}</td>
        <td>{item.mz_1}</td>
        <td>{item.mz_2}</td>
      </tr>
    );
  }

  const [selectedRows, setSelectedRows] = useState<TMemberEndForce[]>([]);

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "Pipe No.": row.elementNumber,
          "L/C": row.LCNumber,
          Fx1: fixNumberToStr(row.fx_1),
          Fy1: fixNumberToStr(row.fy_1),
          Fz1: fixNumberToStr(row.fz_1),
          Mx1: fixNumberToStr(row.mx_1),
          My1: fixNumberToStr(row.my_1),
          Mz1: fixNumberToStr(row.mz_1),
          Fx2: fixNumberToStr(row.fx_2),
          Fy2: fixNumberToStr(row.fy_2),
          Fz2: fixNumberToStr(row.fz_2),
          Mx2: fixNumberToStr(row.mx_2),
          My2: fixNumberToStr(row.my_2),
          Mz2: fixNumberToStr(row.mz_2),
        };
      }),
      "PR Member End Forces"
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
      </div>
      <div className="hr" />
      <div className={"d-flex bg-dark p-5"}>
        <div className="d-flex f-grow f-jc-between bg-gray">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Pipe Rack</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<PipeRack>
                items={models}
                selected={selectedModels}
                onSelect={setSelectedModels}
                itemLabel={(item) => item.name}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">LC Type</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                items={LCTypesList}
                selected={selectedTypes}
                onSelect={setSelectedTypes}
                itemLabel={(item) => item}
                className="fill-select"
                disabled={true}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center" style={{ marginRight: 10 }}>
            <div className="label-light t-end w-90">LC List</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                items={LCLoadTypesList}
                selected={selectedLists}
                onSelect={setSelectedLists}
                itemLabel={(item) => item}
                className="fill-select"
                disabled={true}
              />
            </FormGroup>
          </div>
        </div>
      </div>
      <div className="hr" />
      {reportsProgress ? (
        <>
          <ProgressBar />
          <div className={"hr"} />
        </>
      ) : null}
      <div className={"p-5 bg-dark"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}>PR. No.</th>
                <th rowSpan={2}>Element. No.</th>
                <th rowSpan={2}>L/C</th>
                <th colSpan={12}>Units: kN, m</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Fx1</th>
                <th style={{ top: offsetTop }}>Fy1</th>
                <th style={{ top: offsetTop }}>Fz1</th>
                <th style={{ top: offsetTop }}>Mx1</th>
                <th style={{ top: offsetTop }}>My1</th>
                <th style={{ top: offsetTop }}>Mz1</th>

                <th style={{ top: offsetTop }}>Fx2</th>
                <th style={{ top: offsetTop }}>Fy2</th>
                <th style={{ top: offsetTop }}>Fz2</th>
                <th style={{ top: offsetTop }}>Mx2</th>
                <th style={{ top: offsetTop }}>My2</th>
                <th style={{ top: offsetTop }}>Mz2</th>
              </tr>
            </thead>
            <tbody>{selectedRows.map((row) => drawRows(row))}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={rows} onChange={setSelectedRows} />
    </div>
  );
}
