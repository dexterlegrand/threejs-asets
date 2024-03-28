import React, { useEffect, useMemo, useState } from "react";
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
import {
  changeProjectModeAction,
  changeStressCheckParamsAction,
} from "../../../../../store/main/actions";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList } from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { Paginator } from "../../../../common/Paginator";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { MemberStressCheckUI } from "../../../../../store/ui/types";

export function MemberStressCheckPP() {
  const [selectedRows, setSelectedRows] = useState<MemberStressCheckUI[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "stressCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

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
    let newRows: MemberStressCheckUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.memberStressChecks ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [project, params.lines, selectedTypes]);
  
  const filtered = useMemo(() => {
    let filtered = [...rows];
    if (params.LC) filtered = filtered.filter((r) => r.LCNumber === params.LC);
    if (params.LCT)
      filtered = filtered.filter((r) => r.LCType === params.LCT);
    return filtered;
  }, [rows, params.LCT, params.LC]);
 

  function drawRows(item: MemberStressCheckUI) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.elementNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.LCType}</td>
        <td>{item.actual}</td>
        <td>{item.allowable}</td>
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
          "Element No.": row.elementNumber,
          "L/C": row.LCNumber,
          "L/C Type": row.LCType,
          "Actual Stress Ratio": fixNumberToStr(row.actual),
          "Allowable Stress Ratio": fixNumberToStr(row.allowable),
          Result: fixNumberToStr(row.result),
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
                /*items ={lines}*/
                items={linesWithAll}
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
                      onChange={(value) => handleChangeParams("green", value)}
                      className={"w-50"}
                    />
                    <td>{`< X <`}</td>
                    <NumericCell
                      min={params.green}
                      isDecimal={true}
                      value={params.red}
                      onChange={(value) => handleChangeParams("red", value)}
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
                <th>Line No.</th>
                <th>Element No.</th>
                <th>L/C</th>
                <th>Actual Stress Ratio</th>
                <th>Allowable Stress Ratio</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>{selectedRows.map(drawRows)}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={filtered} onChange={setSelectedRows} />
    </div>
  );
}
