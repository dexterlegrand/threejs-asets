import React, { FunctionComponent } from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { PipeRack } from "../../../../../store/main/types";
import { AdditionalLoads } from "../AdditionalLoads";
import { changeLoadings } from "../../../../../store/main/actions";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = { onClose: () => any };

const LiveLoad: FunctionComponent<Props> = ({ onClose }) => {
  const models = useSelector((state: ApplicationState) => {
    return state.main.projects
      .find((project) => project.name === state.main.currentProject)
      ?.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
  });

  const loadings = useSelector((state: ApplicationState) => {
    return state.main.projects.find(
      (project) => project.name === state.main.currentProject
    )?.loadings;
  });

  const dispatch = useDispatch();

  return (
    <CustomDlg
      title={"Live Load"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-grow bg-dark p-5"}>
            <div className="d-flex f-grow f-ai-center bg-gray">
              <div className="label-light">Platform Live Load intensity</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={0}
                  value={loadings?.intensity}
                  disabled={!loadings}
                  onChange={(value) =>
                    loadings &&
                    dispatch(changeLoadings({ ...loadings, intensity: value }))
                  }
                />
              </FormGroup>
              <div className="label-light">
                kg/m<sup>2</sup>
              </div>
            </div>
          </div>
          <div className="hr" />
          <AdditionalLoads models={models} load={"liveLoad"} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default LiveLoad;
