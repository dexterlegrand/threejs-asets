import React, { useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentProject,
  getCurrentUI,
  exportToCSV,
  fixNumberToStr,
  getUnicuesArray,
  strFilter,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { changeStressCheckParamsAction } from "../../../../../store/main/actions";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList } from "../../../../../store/main/constants";
import { Paginator } from "../../../../common/Paginator";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { NodalStressCheckUI } from "../../../../../store/ui/types";

export function NodalStressCheckPP() {
  const [selectedRows, setSelectedRows] = useState<NodalStressCheckUI[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const linesWithAll = useMemo(() => {
    return ['All', ...getUnicuesArray(project?.freePipes?.map((fp)=> `${fp.line}`) ?? [])];
  },[project]);

  const params = useMemo(() => {
    return project?.pipeAnalysis?.stressCheckParams ?? { lines: [], green: 0.3, red: 1 };
  }, [project]);

  const rows = useMemo(() => {
    let newRows: NodalStressCheckUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.nodalStressChecks ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [lines]);

  /*const filtered = useMemo(() => {
    return rows.filter((item) => {
      return (
        params.lines?.some((line) => `${line}` === item.model) &&
        `${params.LC}` === `${item.LCNumber}`
      );
    });
  }, [rows, params]);*/

  const filtered = useMemo(() => {
    let filtered = [...rows];
    if (params.LC) filtered = filtered.filter((r) => r.LCNumber === params.LC);
    if (params.LCT)
      filtered = filtered.filter((r) => r.LCType === params.LCT);
    return filtered;
  }, [rows, params.LCT, params.LC]);

  function drawRows(item: NodalStressCheckUI) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.nodeNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.LCNumber}</td>
        <td>{item.elementNumber}</td>
        <td>{item.nodeNumber}</td>
        <td>{item.flexibilityFactor}</td>
        <td>{item.outOfPlaneSIF}</td>
        <td>{item.inPlaneSIF}</td>
        <td>{item.actualMPa}</td>
        <td>{item.allowableMPa}</td>
        <td>{item.ratio}</td>
        <td>{item.result}</td>
      </tr>
    );
  }

  /*function handleChangeParams(field: string, value: any) {
    dispatch(changeStressCheckParamsAction({ ...params, [field]: value }));
  }*/

  function handleChangeParams(field: string, value: any) {
    if (field === 'lines') {
      if (value.includes('All')) {
        dispatch(changeStressCheckParamsAction({...params, [field]: lines}));
      } else {
        dispatch(changeStressCheckParamsAction({...params, [field]: value}));
      }
    } else {
      dispatch(changeStressCheckParamsAction({...params, [field]: value}));
    }
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "L/C": row.LCNumber,
          "Element No.": row.elementNumber,
          "Node No.": row.nodeNumber,
          "Flexibility Factor": fixNumberToStr(row.flexibilityFactor),
          "SIF Out of Plane": fixNumberToStr(row.outOfPlaneSIF),
          "SIF In Plane": fixNumberToStr(row.inPlaneSIF),
          "Actual Combined Stress (MPa)": fixNumberToStr(row.actualMPa),
          "Allowable Combined Stress (MPa)": fixNumberToStr(row.allowableMPa),
          Ratio: fixNumberToStr(row.ratio),
          Result: row.result,
        };
      }),
      "Pipe Member Stress Checks"
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
            <div className="label-light t-end w-90">Line No.</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                /*items={lines}*/
                items = {linesWithAll}
                selected={params.lines ?? []}
                onSelect={(val) => handleChangeParams("lines", val)}
                itemLabel={(val) => val}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">LC Type</div>
            <FormGroup className="no-m w-100">
            <SimpleSelector<string>
                /*items={LCTypesList}*/
                items= {getUnicuesArray(rows.map((r) => r.LCType))}
                selected={params.LCT}
                onSelect={(val) => handleChangeParams("LCT", val)}
                itemLabel={(val) => val}
                className="fill-select"
                filter={strFilter}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">LC List</div>
            <FormGroup className="no-m w-100">
              <SimpleSelector<string>
                items={getUnicuesArray(rows.map((r) => r.LCNumber))}
                selected={params.LC}
                onSelect={(val) => handleChangeParams("LC", val)}
                itemLabel={(val) => val}
                className="fill-select"
                filter={strFilter}
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
          <table className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}>Line No.</th>
                <th rowSpan={2}>L/C</th>
                <th rowSpan={2}>Element No.</th>
                <th rowSpan={2}>Node No.</th>
                <th rowSpan={2}>Flexibility Factor</th>
                <th colSpan={2}>SIF</th>
                <th colSpan={2}>Combined Stress (MPa)</th>
                <th rowSpan={2}>Ratio</th>
                <th rowSpan={2}>Result</th>
              </tr>
              <tr>
                <th>Out of Plane</th>
                <th>In Plane</th>
                <th>Actual</th>
                <th>Allowable</th>
              </tr>
            </thead>
            <tbody>{selectedRows.map((row) => drawRows(row))}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={filtered} onChange={setSelectedRows} />
    </div>
  );
}
