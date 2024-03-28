import React, { useEffect, useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentProject,
  getCurrentUI,
  exportToCSV,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import {
  changeProjectModeAction,
  changeFlangeCheckParamsAction,
} from "../../../../../store/main/actions";
import { TFlangeCheck } from "../../../../../store/main/pipeTypes";
import { MultiSelector } from "../../../../common/MultiSelector";
import { NumericCell } from "../../../../common/NumericCell";
import { Paginator } from "../../../../common/Paginator";

export function FlangeCheck() {
  const [selectedRows, setSelectedRows] = useState<TFlangeCheck[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "flangeCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const dispatch = useDispatch();

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const params = useMemo(() => {
    return project?.pipeAnalysis?.flangeCheckParams ?? { lines: [], green: 0.3, red: 1 };
  }, [project]);

  const filtered = useMemo(() => {
    let newRows: TFlangeCheck[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.flangeChecks ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [ui, params]);

  function drawRows(item: TFlangeCheck) {
    return (
      <tr key={`${item.line}-${item.pipe}-${item.flangeAt}`}>
        <td>{item.line}</td>
        <td>{item.pipe}</td>
        <td>{item.flangeAt}</td>
        <td>{item.nodeNo}</td>
        <td>{item.nps}</td>
        <td>{item.type}</td>
        <td>{item.class}</td>
        <td>{item.material}</td>
        <td>{item.loadCase}</td>
        <td>{item.criticalLoadDir}</td>
        <td>{item.loadValue}</td>
        <td>{item.allowableLoad}</td>
        <td>{item.utilizationRatio}</td>
        <td>{item.result}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      lines.reduce((acc, line) => {
        const checks = ui?.analysisUI[line]?.flangeChecks ?? [];
        return [
          ...acc,
          ...checks.map((row) => ({
            "Line No.": row.line,
            "Pipe No.": row.pipe,
            "Flange At": row.flangeAt,
            "Node No.": row.nodeNo,
            NPS: row.nps,
            Type: row.type,
            Class: row.class,
            "Load Case": row.loadCase,
            "Critical load dir": row.criticalLoadDir,
            "Load value": row.loadValue,
            "Allowable load": row.allowableLoad,
            "Utilization Ratio": row.utilizationRatio,
            Result: row.result,
          })),
        ];
      }, []),
      "Pipe Flange Checks"
    );
  }

  function handleChangeParams(field: string, value: any) {
    dispatch(changeFlangeCheckParamsAction({ ...params, [field]: value }));
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
                items={lines}
                selected={params?.lines ?? []}
                onSelect={(val) => handleChangeParams("lines", val)}
                itemLabel={(val) => val}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center" style={{ marginRight: 10 }}>
            <div className="label-light t-end w-120">Colour Code</div>
            <FormGroup className="no-m w-160">
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Green</th>
                    <th>Yellow</th>
                    <th>Red</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <NumericCell
                      max={params.red}
                      isDecimal={true}
                      value={params.green}
                      onChange={(val) => handleChangeParams("green", val)}
                      className={"w-50"}
                    />
                    <td>{`< X <`}</td>
                    <NumericCell
                      min={params.green}
                      isDecimal={true}
                      value={params.red}
                      onChange={(val) => handleChangeParams("red", val)}
                      className={"w-50"}
                    />
                  </tr>
                </tbody>
              </table>
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
                <th>Line No</th>
                <th>Pipe No</th>
                <th>Flange At</th>
                <th>Node No</th>
                <th>NPS</th>
                <th>Type</th>
                <th>Class</th>
                <th>Load Case</th>
                <th>Critical load dir.</th>
                <th>Load value</th>
                <th>Allowable load</th>
                <th>Utilization Ratio</th>
                <th>Result</th>
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
