import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { getTopOffset, exportToCSV, getCurrentUI } from "../../../../../3d-models/utils";
import { LCLoadTypesList, LCTypesList } from "../../../../../../store/main/constants";
import { Paginator } from "../../../../../common/Paginator";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { MemberEndForceUI } from "../../../../../../store/ui/types";
import { SimpleSelector } from "../../../../../common/SimpleSelector";

type Props = {
  models: string[];
};

export function MemberEndForcesOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<MemberEndForceUI[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const analysis: MemberEndForceUI[] = useMemo(() => {
    if (!ui || !selectedModel) return [];
    return ui.analysisUI[selectedModel]?.memberEndForces ?? [];
  }, [ui, selectedModel]);

  const LCList = useMemo(() => {
    return analysis.reduce((acc: string[], el) => {
      return !acc.includes(el.LCNumber) ? [...acc, el.LCNumber] : acc;
    }, []);
  }, [analysis]);

  const rows = useMemo(() => {
    return selectedLists.length
      ? analysis.filter((el) => selectedLists.includes(el.LCNumber))
      : analysis;
  }, [analysis, selectedLists]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  });

  function drawRows(item: MemberEndForceUI) {
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

  function handleExport() {
    exportToCSV(rows, "OF Member End Forces");
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
            <div className="label-light t-end w-90">Open Frame</div>
            <FormGroup className="no-m w-100">
              <SimpleSelector<string>
                items={models}
                selected={selectedModel}
                onSelect={setSelectedModel}
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
                items={LCList}
                selected={selectedLists}
                onSelect={setSelectedLists}
                itemLabel={(item) => item}
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
                <th rowSpan={2}>OF. No.</th>
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
