import React, { useEffect, useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { DeflectionCheckUI } from "../../../../../store/ui/types";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentUI,
  getCurrentProject,
  exportToCSV,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { useSelector, useDispatch } from "react-redux";
import { changeProjectModeAction, changeProjectAction } from "../../../../../store/main/actions";
import { MultiSelector } from "../../../../common/MultiSelector";
import { Paginator } from "../../../../common/Paginator";

export function DeflectionCheckPP() {
  const [selectedRows, setSelectedRows] = useState<DeflectionCheckUI[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "deflectionCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const dispatch = useDispatch();

  const DC = useMemo(() => project?.pipeDesignCode, [project]);

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const models = useMemo(() => {
    if (!project) return [];
    return getUnicuesArray(
      project.freePipes
        ?.map((p) => p.line)
        .sort((a, b) => a - b)
        .map((p) => `${p}`) ?? []
    );
  }, [project]);

  const modelsWithAll = useMemo(()=>{
    if (!project) return [];
    return [
      'All', ...getUnicuesArray(
        project.freePipes
          ?.map((p) => p.line)
          .sort((a,b) => a - b)
          .map((p) => `${p}`) ?? []
      )
    ]
  }, [project]);

  const rows = useMemo(() => {
    if (!ui) return [];
    return selectedModels.reduce((acc, model) => {
      const analysis = ui.analysisUI[model];
      return [...acc, ...(analysis?.deflectionChecks ?? [])];
    }, [] as DeflectionCheckUI[]);
  }, [ui, selectedModels]);

  function drawRows(item: DeflectionCheckUI) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.elementNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.actual}</td>
        {/* <td>{item.allowable}</td> */}
        {/* <td>{item.utilizationRatio}</td> */}
        <td>{item.result}</td>
      </tr>
    );
  }

  const minStressValue = useMemo(() => {
    if (!DC) return 0;
    if (DC.designCode === "IS 800 : 2007 LSD") return DC.isCodeParameters?.minStressRation ?? 0.3;
    if (DC.designCode === "AISC LRFD") return DC.aiscLRFDCodeParameters?.minStressRation ?? 0.3;
    if (DC.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 0.3;
    return 0.3;
  }, [DC]);

  const maxStressValue = useMemo(() => {
    if (!DC) return 0;
    if (DC.designCode === "IS 800 : 2007 LSD") return DC.isCodeParameters?.allowStressRatio;
    if (DC.designCode === "AISC LRFD") return DC.aiscLRFDCodeParameters?.allowStressRatio;
    if (DC.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 1;
    return 1;
  }, [DC]);

  function handleChangeMinStressRation(minStressRation: number) {
    if (!DC || !project) return;
    if (DC.designCode === "IS 800 : 2007 LSD") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeDesignCode: {
            ...DC,
            isCodeParameters: DC.isCodeParameters
              ? { ...DC.isCodeParameters, minStressRation }
              : {
                  cmx: 0.9,
                  cmy: 0.9,
                  cmz: 0.9,
                  deflectionRatio: 325,
                  klrColumn: 180,
                  klrBracings: 180,
                  klrBeams: 250,
                  allowStressRatio: 1,
                  minStressRation,
                  effectiveLengthTable: {},
                },
          },
        })
      );
    } else if (DC.designCode === "AISC LRFD") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeDesignCode: {
            ...DC,
            aiscLRFDCodeParameters: DC.aiscLRFDCodeParameters
              ? { ...DC.aiscLRFDCodeParameters, minStressRation }
              : {
                  cb: 1,
                  deflectionRatio: 325,
                  klrColumn: 180,
                  klrBracings: 180,
                  klrBeams: 250,
                  allowStressRatio: 1,
                  minStressRation,
                  effectiveLengthTable: {},
                },
          },
        })
      );
    }
  }

  function handleChangeMaxStressRation(allowStressRatio: number) {
    if (!project || !DC) return;
    if (DC.designCode === "IS 800 : 2007 LSD") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeDesignCode: {
            ...DC,
            isCodeParameters: DC.isCodeParameters
              ? { ...DC.isCodeParameters, allowStressRatio }
              : {
                  cmx: 0.9,
                  cmy: 0.9,
                  cmz: 0.9,
                  deflectionRatio: 325,
                  klrColumn: 180,
                  klrBracings: 180,
                  klrBeams: 250,
                  allowStressRatio,
                  effectiveLengthTable: {},
                },
          },
        })
      );
    } else if (DC.designCode === "AISC LRFD") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeDesignCode: {
            ...DC,
            aiscLRFDCodeParameters: DC.aiscLRFDCodeParameters
              ? { ...DC.aiscLRFDCodeParameters, allowStressRatio }
              : {
                  cb: 1,
                  deflectionRatio: 325,
                  klrColumn: 180,
                  klrBracings: 180,
                  klrBeams: 250,
                  allowStressRatio,
                  effectiveLengthTable: {},
                },
          },
        })
      );
    }
  }

  function handleExport() {
    exportToCSV(rows, "Pipe Deflection Checks");
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
                items={models}
                selected={selectedModels}
                onSelect={setSelectedModels}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>

          {/* <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">LC List</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                items={["1"]}
                selected={selectedLists}
                onSelect={setSelectedLists}
                itemKey={(item) => item}
                itemLabel={(item) => item}
                className="fill-select"
                disabled={true}
              />
            </FormGroup>
          </div> */}

          {/* <div className="d-flex f-ai-center" style={{ marginRight: 10 }}>
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
                      max={maxStressValue}
                      isDecimal={true}
                      value={minStressValue}
                      disabled={!project}
                      onChange={handleChangeMinStressRation}
                      className={"w-50"}
                    />
                    <td>{`< X <`}</td>
                    <NumericCell
                      min={minStressValue}
                      isDecimal={true}
                      value={maxStressValue}
                      disabled={!project}
                      onChange={handleChangeMaxStressRation}
                      className={"w-50"}
                    />
                  </tr>
                </tbody>
              </table>
            </FormGroup>
          </div> */}
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
                <th>Node No.</th>
                <th>L/C</th>
                <th>Actual Deflection Length</th>
                {/* <th>Allowable Deflection Length</th> */}
                {/* <th>Utilization Ratio</th> */}
                <th>Results</th>
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
