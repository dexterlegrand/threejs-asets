import React, { useEffect, useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentProject,
  getCurrentUI,
  exportToCSV,
  fixNumberToStr,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import {
  changeProjectModeAction,
  changeThicknessCheckParamsAction,
} from "../../../../../store/main/actions";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList } from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { Paginator } from "../../../../common/Paginator";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { PipeThicknessCheckUI } from "../../../../../store/ui/types";

export function PipeThicknessCheck() {
  const [selectedRows, setSelectedRows] = useState<PipeThicknessCheckUI[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const linesWithAll = useMemo(() => {
    return ['All', ...getUnicuesArray(project?.freePipes?.map((fp)=> `${fp.line}`) ?? [])];
  },[project]);

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "thicknessCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const dispatch = useDispatch();

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const params = useMemo(() => {
    return project?.pipeAnalysis?.thicknessCheckParams ?? { lines: [], green: 0.3, red: 1 };
  }, [project]);

  const rows = useMemo(() => {
    let newRows: PipeThicknessCheckUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.thicknessChecks ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [params]);

  /*const filtered = useMemo(() => {
    return rows.filter((item) => {
      return (
        params.lines?.some((line) => `${line}` === `${item.model}`) &&
        `${params?.LC}` === `${item.LCNumber}`
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

  function drawRows(item: PipeThicknessCheckUI) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.elementNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.requiredThickness}</td>
        <td>{item.providedThickness}</td>
        <td>{item.utilizationRatio}</td>
        <td>{item.result}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "Element No.": row.elementNumber,
          "L/C": row.LCNumber,
          "Required Thickness (mm)": fixNumberToStr(row.requiredThickness),
          "Provided Thickness (mm)": fixNumberToStr(row.providedThickness),
          "Utilization Ratio = reqd. / prov.": fixNumberToStr(row.utilizationRatio),
          Result: fixNumberToStr(row.result),
        };
      }),
      "Pipe Thickness Checks"
    );
  }

  /*function handleChangeParams(field: string, value: any) {
    dispatch(changeThicknessCheckParamsAction({ ...params, [field]: value }));
  }*/

  function handleChangeParams(field:string, value: any) {
    if (field === 'lines') {
      if (value.includes('All')) {
        dispatch(changeThicknessCheckParamsAction({...params, [field]: lines}));
      } else{
      dispatch(changeThicknessCheckParamsAction({...params, [field]: value}));
    }
    } else {
      dispatch(changeThicknessCheckParamsAction({...params, [field]: value}));
    }
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
                items={linesWithAll}
                selected={params?.lines ?? []}
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
                <th>Line No.</th>
                <th>Element No.</th>
                <th>L/C</th>
                <th>Required Thickness (mm)</th>
                <th>Provided Thickness (mm)</th>
                <th>Utilization Ratio = reqd. / prov.</th>
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
