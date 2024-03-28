import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getTopOffset,
  exportToCSV,
  getCurrentProject,
  getCurrentUI,
  fixNumberToStr,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList, LCLoadTypesList } from "../../../../../store/main/constants";
import { Paginator } from "../../../../common/Paginator";
import { ReactionSupportUI } from "../../../../../store/ui/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { useDispatch } from "react-redux";
import { changeStressCheckParamsAction } from "../../../../../store/main/actions";


export function ReactionSummaryPP() {
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<ReactionSupportUI[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  /*const rows = useMemo(() => {
    let newRows: ReactionSupportUI[] = [];
    for (const line of selectedLines) {
      const checks = ui?.analysisUI[line]?.reactionSupports ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [project, selectedLines, selectedTypes, selectedLists]);*/
  const params = useMemo(() => {
    return project?.pipeAnalysis?.stressCheckParams ?? { lines: [], green: 0.3, red: 1 };
  }, [project]);

  const dispatch = useDispatch();

  const rows = useMemo(() => {
    let newRows: ReactionSupportUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.reactionSupports ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [project, params.lines, selectedTypes]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  });

  function drawRows(item: ReactionSupportUI) {
    return (
      <tr key={`${item.model}-${item.nodeNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.nodeNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.Fx}</td>
        <td>{item.Fy}</td>
        <td>{item.Fz}</td>
        <td>{item.Mx}</td>
        <td>{item.My}</td>
        <td>{item.Mz}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "Supp. No.": row.nodeNumber,
          "L/C number": row.LCNumber,
          Fx: fixNumberToStr(row.Fx),
          Fy: fixNumberToStr(row.Fy),
          Fz: fixNumberToStr(row.Fz),
          Mx: fixNumberToStr(row.Mx),
          My: fixNumberToStr(row.My),
          Mz: fixNumberToStr(row.Mz),
        };
      }),
      "Pipe Support Reactions"
    );
  }

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
                selected={selectedLines}
                onSelect={setSelectedLines}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">LC Type</div>
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
            <div className="label-light t-end  w-100">LC List</div>
            <FormGroup className="no-m  w-100">
            <SimpleSelector<string>
                items={getUnicuesArray(rows.map((r) => r.LCNumber))}
                selected={params.LC}
                onSelect={(val) => handleChangeParams("LC", val)}
                itemLabel={(val) => val}
                className="fill-select"
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
                <th rowSpan={2}>Line No.</th>
                <th rowSpan={2}>Supp. No.</th>
                <th rowSpan={2}>L/C number</th>
                <th colSpan={6}>Units: kN, m</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Fx</th>
                <th style={{ top: offsetTop }}>Fy</th>
                <th style={{ top: offsetTop }}>Fz</th>
                <th style={{ top: offsetTop }}>Mx</th>
                <th style={{ top: offsetTop }}>My</th>
                <th style={{ top: offsetTop }}>Mz</th>
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
