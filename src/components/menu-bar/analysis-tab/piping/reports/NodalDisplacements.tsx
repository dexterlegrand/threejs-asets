import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentUI,
  getCurrentProject,
  getTopOffset,
  exportToCSV,
  fixNumberToStr,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { MultiSelector } from "../../../../common/MultiSelector";
import { LCTypesList, LCLoadTypesList } from "../../../../../store/main/constants";
import { Paginator } from "../../../../common/Paginator";
import { NodeDisplacementUI } from "../../../../../store/ui/types";

export function NodalDisplacementsPP() {
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<NodeDisplacementUI[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const params = useMemo(() => {
    return project?.pipeAnalysis?.stressCheckParams ?? { lines: [], green: 0.3, red: 1 };
  }, [project]);

  const lines = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const linesWithAll = useMemo(()=>{
    return ['All', ...getUnicuesArray(project?.freePipes?.map((fp)=> `${fp.line}`) ?? [])];
  },[project]);

  const rows = useMemo(() => {
    let newRows: NodeDisplacementUI[] = [];
    for (const line of selectedLines) {
      const checks = ui?.analysisUI[line]?.nodeDisplacements ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [project, selectedLines, selectedTypes, selectedLists]);

  const filtered = useMemo(() => {
    let filtered = [...rows];
    if (params.LC) filtered = filtered.filter((r) => r.LCNumber === params.LC);
    if (params.LCT)
      filtered = filtered.filter((r) => r.LCType === params.LCT);
    return filtered;
  }, [rows, params.LCT, params.LC]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  });

  function drawRows(item: NodeDisplacementUI) {
    return (
      <tr key={`${item.model}-${item.nodeNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.nodeNumber}</td>
        <td>{item.LCNumber}</td>

        <td>{item.du}</td>
        <td>{item.dv}</td>
        <td>{item.dw}</td>
        <td>{item.tResultant}</td>

        <td>{item.rz}</td>
        <td>{item.rx}</td>
        <td>{item.ry}</td>
        <td>{item.rResultant}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          "Line No.": row.model,
          "Node No.": row.nodeNumber,
          "L/C": row.LCNumber,
          "Transitional Dx (mm)": fixNumberToStr(row.du),
          "Transitional Dy (mm)": fixNumberToStr(row.dv),
          "Transitional Dz (mm)": fixNumberToStr(row.dw),
          "Transitional Resultant (mm)": fixNumberToStr(row.tResultant),
          "Rotational Rz (rad)": fixNumberToStr(row.rz),
          "Rotational Rx (rad)": fixNumberToStr(row.rx),
          "Rotational Ry (rad)": fixNumberToStr(row.ry),
          "Rotational Resultant (rad)": fixNumberToStr(row.rResultant),
        };
      }),
      "Pipe Nodal Displacements"
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
                items={lines}
                /*items={linesWithAll}*/
                selected={selectedLines}
                onSelect={setSelectedLines}
                itemLabel={(item) => item}
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
                <th rowSpan={2}>Line No.</th>
                <th rowSpan={2}>Node No.</th>
                <th rowSpan={2}>L/C</th>
                <th colSpan={4}>Transitional, Units: mm</th>
                <th colSpan={4}>Rotational, Units: rad</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Dx</th>
                <th style={{ top: offsetTop }}>Dy</th>
                <th style={{ top: offsetTop }}>Dz</th>
                <th style={{ top: offsetTop }}>Resultant</th>
                <th style={{ top: offsetTop }}>Rz</th>
                <th style={{ top: offsetTop }}>Rx</th>
                <th style={{ top: offsetTop }}>Ry</th>
                <th style={{ top: offsetTop }}>Resultant</th>
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
