import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { getTopOffset, exportToCSV, getCurrentUI } from "../../../../../3d-models/utils";
import { LCLoadTypesList, LCTypesList } from "../../../../../../store/main/constants";
import { Paginator } from "../../../../../common/Paginator";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { NodeDisplacementUI } from "../../../../../../store/ui/types";
import { SimpleSelector } from "../../../../../common/SimpleSelector";

type Props = {
  models: string[];
};

export function NodalDisplacementsOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<NodeDisplacementUI[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const analysis: NodeDisplacementUI[] = useMemo(() => {
    if (!ui || !selectedModel) return [];
    return ui.analysisUI[selectedModel]?.nodeDisplacements ?? [];
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
    exportToCSV(rows, "OF Nodal Displacements");
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
