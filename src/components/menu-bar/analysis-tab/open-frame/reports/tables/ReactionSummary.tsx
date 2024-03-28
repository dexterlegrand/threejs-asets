import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { getTopOffset, exportToCSV, getCurrentUI } from "../../../../../3d-models/utils";
import { LCLoadTypesList, LCTypesList } from "../../../../../../store/main/constants";
import { Paginator } from "../../../../../common/Paginator";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { ReactionSupportUI } from "../../../../../../store/ui/types";
import { SimpleSelector } from "../../../../../common/SimpleSelector";

type Props = {
  models: string[];
};

export function ReactionSummaryOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<ReactionSupportUI[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const analysis: ReactionSupportUI[] = useMemo(() => {
    if (!ui || !selectedModel) return [];
    return ui.analysisUI[selectedModel]?.reactionSupports ?? [];
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

  const supports = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.nodeNumber) ?? []));
  }, [rows]);

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
    exportToCSV(rows, "OF Support Reactions");
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
            <div className="label-light t-end w-100">LC Type</div>
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

          <div className="d-flex f-ai-center">
            <div className="label-light t-end  w-100">LC List</div>
            <FormGroup className="no-m  w-100">
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
