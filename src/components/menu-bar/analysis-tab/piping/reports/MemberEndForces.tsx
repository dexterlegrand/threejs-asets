import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentUI,
  getCurrentProject,
  getTopOffset,
  exportToCSV,
  fixNumberToStr,
  getUnicuesArray,
  strFilter,
} from "../../../../3d-models/utils";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList } from "../../../../../store/main/constants";
import { Paginator } from "../../../../common/Paginator";
import { MemberEndForceUI } from "../../../../../store/ui/types";
import {
  changeProjectModeAction,
  changeStressCheckParamsAction,
} from "../../../../../store/main/actions";
import { SimpleSelector } from "../../../../common/SimpleSelector";

export function MemberEndForcesPP() {
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<MemberEndForceUI[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!project) return;
    dispatch(changeProjectModeAction(project.name, "endForces"));
    return () => {
      dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  //added to select all the lines
  const linesWithAll = useMemo(() => {
    return ['All', ...getUnicuesArray(project?.freePipes?.map((fp)=> `${fp.line}`) ?? [])];
  },[project]);

  const params = useMemo(() => {
    return (
      project?.pipeAnalysis?.stressCheckParams ?? {
        lines: [],
        green: 0.3,
        red: 1,
      }
    );
  }, [project]);

  const rows = useMemo(() => {
    let newRows: MemberEndForceUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.memberEndForces ?? [];
      newRows = [...newRows, ...checks];
      
    }
    return newRows;
  }, [project, params.lines, selectedTypes]);

  const filtered = useMemo(() => {
    let filtered = [...rows];
    if (params.LC) filtered = filtered.filter((r) => r.LCNumber === params.LC);
    if (params.element)
      filtered = filtered.filter((r) => r.elementNumber === params.element);
    if (params.LCT)
      filtered = filtered.filter((r) => r.LCType === params.LCT);
    return filtered;
  }, [rows, params.element, params.LC, params.LCT]);

  const elements = useMemo(() => {
    const numbers: number[] = [];
    const elements: { number: number; name: string }[] = [];
    for (const row of rows) {
      if (numbers.includes(row.elementNumber)) continue;
      numbers.push(row.elementNumber);
      elements.push({ number: row.elementNumber, name: row.elementName ?? "" });
    }
    return elements;
  }, [rows]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  });

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

  function drawRows(item: MemberEndForceUI) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>
          {item.elementNumber}
          {item.elementName ? ` (${item.elementName})` : ""}
        </td>
        <td>{item.LCNumber}</td>
        <td>{item.fx_1}</td>
        <td>{item.fy_1}</td>
        <td>{item.fz_1}</td>
        <td>{item.mx_1}</td>
        <td>{item.my_1}</td>
        <td>{item.mz_1}</td>
        <td>{item.fx_2}</td>
        <td>{item.fy_2}</td>
        <td>{item.fz_2}</td>
        <td>{item.mx_2}</td>
        <td>{item.my_2}</td>
        <td>{item.mz_2}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "Element No.":
            row.elementNumber +
            (row.elementName ? ` (${row.elementName})` : ""),
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
      "Pipe Member End Forces"
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={handleExport}
        />
      </div>
      <div className="hr" />
      <div className={"d-flex bg-dark p-5"}>
        <div className="d-flex f-grow f-jc-between bg-gray">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Line No.</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                /*items={lines}*/
                items= {linesWithAll}
                selected={params.lines ?? []}
                onSelect={(val) => handleChangeParams("lines", val)}
                itemLabel={(val) => val}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center" style={{ marginRight: 10 }}>
            <div className="label-light t-end w-90">Element</div>
            <FormGroup className="no-m w-100">
              <SimpleSelector<{ number: number; name: string }>
                items={elements}
                selected={elements.find((el) => el.number === params.element)}
                onSelect={(val) => handleChangeParams("element", val?.number)}
                /*itemLabel={(val) => `${val}`}*/
                itemLabel={(item) => `${item.number} - ${item.name}`}
                className="fill-select"
                filter={(q, item) =>
                  !q ||
                  `${item.number}${item.name ? ` (${item.name})` : ""}`
                    .toLowerCase()
                    .includes(q.toLowerCase())
                }
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

          <div className="d-flex f-ai-center" style={{ marginRight: 10 }}>
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
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}>Line No.</th>
                <th rowSpan={2}>Element No.</th>
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
            <tbody>{selectedRows.map(drawRows)}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={filtered} onChange={setSelectedRows} />
    </div>
  );
}
