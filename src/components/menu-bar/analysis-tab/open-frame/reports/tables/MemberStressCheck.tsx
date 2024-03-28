import React, { useEffect, useMemo, useState } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { MultiSelector } from "../../../../../common/MultiSelector";
import { useDispatch, useSelector } from "react-redux";
import { changeProjectModeAction } from "../../../../../../store/main/actions";
import { NumericCell } from "../../../../../common/NumericCell";
import { LCTypesList } from "../../../../../../store/main/constants";
import { ApplicationState } from "../../../../../../store";
import { Paginator } from "../../../../../common/Paginator";
import { MemberStressCheckUI } from "../../../../../../store/ui/types";
import { changeUIAction } from "../../../../../../store/ui/actions";
import { exportToCSV, getCurrentUI } from "../../../../../3d-models/utils";
import { SimpleSelector } from "../../../../../common/SimpleSelector";

type Props = {
  models: string[];
};

export function MemberStressCheckOF(props: Props) {
  const { models } = props;

  const [selectedRows, setSelectedRows] = useState<MemberStressCheckUI[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find(
      (project) => project.name === state.main.currentProject
    )
  );

  useEffect(() => {
    if (project) dispatch(changeProjectModeAction(project.name, "stressCheck"));
    return () => {
      if (project) dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  const dispatch = useDispatch();

  const DC = useMemo(() => ui?.designCodeAndParametersUI, [ui]);

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  const analysis: MemberStressCheckUI[] = useMemo(() => {
    if (!ui || !selectedModel) return [];
    return ui.analysisUI[selectedModel]?.memberStressChecks ?? [];
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

  function drawRows(item: MemberStressCheckUI) {
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
    if (!DC) return 0;
    if (DC.designCode === "IS 800 : 2007 LSD")
      return DC.indianDesignCode.minStressRation ?? 0.3;
    if (DC.designCode === "AISC LRFD")
      return DC.americanDesignCode.minStressRation ?? 0.3;
    if (DC.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 0.3;
    return 0.3;
  }, [DC]);

  const maxStressValue = useMemo(() => {
    if (!DC) return 0;
    if (DC.designCode === "IS 800 : 2007 LSD")
      return DC.indianDesignCode.stressRation;
    if (DC.designCode === "AISC LRFD")
      return DC.americanDesignCode.stressRation;
    if (DC.designCode === "Eurocode 3 [EN 1993-1-1:2005]") return 1;
    return 1;
  }, [DC]);

  function handleChangeMinStressRation(minStressRation: number) {
    if (!ui || !DC) return;
    if (DC.designCode === "IS 800 : 2007 LSD") {
      dispatch(
        changeUIAction({
          ...ui,
          designCodeAndParametersUI: {
            ...DC,
            indianDesignCode: {
              ...DC.indianDesignCode,
              minStressRation,
            },
          },
        })
      );
    } else if (DC.designCode === "AISC LRFD") {
      dispatch(
        changeUIAction({
          ...ui,
          designCodeAndParametersUI: {
            ...DC,
            americanDesignCode: {
              ...DC.americanDesignCode,
              minStressRation,
            },
          },
        })
      );
    }
  }

  function handleChangeMaxStressRation(stressRation: number) {
    if (!ui || !DC) return;
    if (DC.designCode === "IS 800 : 2007 LSD") {
      dispatch(
        changeUIAction({
          ...ui,
          designCodeAndParametersUI: {
            ...DC,
            indianDesignCode: {
              ...DC.indianDesignCode,
              stressRation,
            },
          },
        })
      );
    } else if (DC.designCode === "AISC LRFD") {
      dispatch(
        changeUIAction({
          ...ui,
          designCodeAndParametersUI: {
            ...DC,
            americanDesignCode: {
              ...DC.americanDesignCode,
              stressRation,
            },
          },
        })
      );
    }
  }

  function handleExport() {
    exportToCSV(rows, "OF Member Stress Checks");
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

          <div className="d-flex f-ai-center">
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
                <th>OF. No.</th>
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
