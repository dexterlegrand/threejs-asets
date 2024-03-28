import React, { useEffect, useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { TMemberStressCheck, PipeRack } from "../../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { changeProjectAction, changeProjectModeAction } from "../../../../../../store/main/actions";
import { NumericCell } from "../../../../../common/NumericCell";
import { LCTypesList } from "../../../../../../store/main/constants";
import { ApplicationState } from "../../../../../../store";
import { Paginator } from "../../../../../common/Paginator";
import { getCurrentProject, getCurrentUI } from "../../../../../3d-models/utils";
import { MemberStressCheckUI } from "../../../../../../store/ui/types";

type Props = {
  models: PipeRack[];
};

export function MemberStressCheck(props: Props) {
  const { models } = props;

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "stressCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const dispatch = useDispatch();

  const [selectedModels, setSelectedModels] = useState<PipeRack[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const reportsProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.reports
  );

  const rows = useMemo(() => {
    if (!ui) return [];
    return selectedModels.reduce((acc, model) => {
      const analysis = ui.analysisUI[model.name];
      return [...acc, ...(analysis?.memberStressChecks ?? [])];
    }, [] as MemberStressCheckUI[]);
  }, [ui, selectedModels, selectedTypes, selectedLists]);

  function drawRows(item: TMemberStressCheck) {
    return (
      <tr key={`${item.model}-${item.elementNumber}-${item.LCNumber}`}>
        <td>{item.model}</td>
        <td>{item.elementNumber}</td>
        <td>{item.LCNumber}</td>
        <td>{item.actual}</td>
        <td>{item.allowable}</td>
        <td>{item.result}</td>
      </tr>
    );
  }

  const minStressValue = useMemo(() => {
    if (!project) return 0;
    if (project.designCode === "IS 800 : 2007 LSD")
      return project.indianDesignCode.minStressRation ?? 0.3;
    if (project.designCode === "AISC LRFD")
      return project.americanDesignCode.minStressRation ?? 0.3;
    if (project.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 0.3;
    return 0.3;
  }, [project]);

  const maxStressValue = useMemo(() => {
    if (!project) return 0;
    if (project.designCode === "IS 800 : 2007 LSD") return project.indianDesignCode.stressRation;
    if (project.designCode === "AISC LRFD") return project.americanDesignCode.stressRation;
    if (project.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 1;
    return 1;
  }, [project]);

  function handleChangeMinStressRation(minStressRation: number) {
    if (project) {
      if (project.designCode === "IS 800 : 2007 LSD") {
        dispatch(
          changeProjectAction({
            ...project,
            indianDesignCode: {
              ...project.indianDesignCode,
              minStressRation,
            },
          })
        );
      } else if (project.designCode === "AISC LRFD") {
        dispatch(
          changeProjectAction({
            ...project,
            americanDesignCode: {
              ...project.americanDesignCode,
              minStressRation,
            },
          })
        );
      }
    }
  }

  function handleChangeMaxStressRation(stressRation: number) {
    if (project) {
      if (project.designCode === "IS 800 : 2007 LSD") {
        dispatch(
          changeProjectAction({
            ...project,
            indianDesignCode: {
              ...project.indianDesignCode,
              stressRation,
            },
          })
        );
      } else if (project.designCode === "AISC LRFD") {
        dispatch(
          changeProjectAction({
            ...project,
            americanDesignCode: {
              ...project.americanDesignCode,
              stressRation,
            },
          })
        );
      }
    }
  }

  const [selectedRows, setSelectedRows] = useState<TMemberStressCheck[]>([]);

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
      </div>
      <div className="hr" />
      <div className={"d-flex bg-dark p-5"}>
        <div className="d-flex f-grow f-jc-between bg-gray">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Pipe Rack</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<PipeRack>
                items={models}
                selected={selectedModels}
                onSelect={setSelectedModels}
                itemLabel={(item) => item.name}
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

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">LC List</div>
            <FormGroup className="no-m w-100">
              <MultiSelector<string>
                items={["1"]}
                selected={selectedLists}
                onSelect={setSelectedLists}
                itemLabel={(item) => item}
                className="fill-select"
                disabled={true}
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
                <th>PR. No.</th>
                <th>Element. No.</th>
                <th>L/C</th>
                <th>Actual Stress Ratio</th>
                <th>Allowable Stress Ratio</th>
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
