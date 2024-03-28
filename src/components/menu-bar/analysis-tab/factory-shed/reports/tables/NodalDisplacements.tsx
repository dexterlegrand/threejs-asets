import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import {SimpleSelector} from "../../../../../common/SimpleSelector";
import { getTopOffset, exportToCSV, getCurrentUI } from "../../../../../3d-models/utils";
import { LCLoadTypesList, LCTypesList } from "../../../../../../store/main/constants";
import { Paginator } from "../../../../../common/Paginator";
import { ApplicationState } from "../../../../../../store";
import { NodeDisplacementUI } from "../../../../../../store/ui/types";
import { getCurrentProject } from "../../../../../3d-models/utils";
import { getUnicuesArray } from "../../../../../3d-models/utils";
import { changeStressCheckParamsAction } from "../../../../../../store/main/actions";
import { useDispatch, useSelector } from "react-redux";
import { strFilter } from "../../../../../3d-models/utils";

/*type Props = {
  models: string[];
};*/

export function NodalDisplacementsFS() {
  /*const { models } = props;*/

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<NodeDisplacementUI[]>([]);
  /*const [selectedModels, setSelectedModels] = useState<string[]>([]);*/
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

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
    let newRows: NodeDisplacementUI[] = [];
    for (const line of params.lines ?? []) {
      const checks = ui?.analysisUI[line]?.nodeDisplacements ?? [];
      newRows = [...newRows, ...checks];
    }
    return newRows;
  }, [lines]);

  const filtered = useMemo(() => {
    let filtered = [...rows];
    if (params.LC) filtered = filtered.filter((r) => r.LCNumber === params.LC);
    if (params.LCT)
      filtered = filtered.filter((r) => r.LCType === params.LCT);
    return filtered;
  }, [rows, params.LCT, params.LC]);

  /*const rows = useMemo(() => {
    if (!ui) return [];
    return selectedModels.reduce((acc, model) => {
      const analysis = ui.analysisUI[model];
      return [...acc, ...(analysis?.nodeDisplacements ?? [])];
    }, [] as NodeDisplacementUI[]);
  }, [ui, selectedModels, selectedTypes, selectedLists]);*/

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
        {/*<Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />*/}
      </div>
      <div className="hr" />
      <div className={"d-flex bg-dark p-5"}>
        <div className="d-flex f-grow f-jc-between bg-gray">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Factory Shed</div>
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
                <th rowSpan={2}>FS. No.</th>
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
      <Paginator items={filtered} onChange={setSelectedRows} />
    </div>
  );
}
