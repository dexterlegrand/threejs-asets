import React, { FunctionComponent, useEffect } from "react";
import { FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { PipeRack, LoadingAsPerCode, Project } from "../../../../../store/main/types";
import { AdditionalLoads } from "../AdditionalLoads";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { loadingAsPerCodes, baseUrl } from "../../../../../store/main/constants";
import { changeLoadings, changeModel } from "../../../../../store/main/actions";
import { IndianParams } from "./IndianParams";
import { USParams } from "./USParams";
import { getJSONForDesignCodesAndParameters } from "../../../../3d-models/designCodeAndParameters";
import axios from "axios";
import { ManualParams } from "./ManualParams";
import {
  addEventAction,
  changeProjectRequestProgressAction,
} from "../../../../../store/ui/actions";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getCurrentUI } from "../../../../3d-models/utils";

type Props = {
  project?: Project;
  onClose: () => any;
};

const WindLoad: FunctionComponent<Props> = ({ project, onClose }) => {
  const natFreqProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.natfreq
  );

  const loadings = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject)
      ?.loadings;
  });

  const dispatch = useDispatch();

  function handleChangeWindLoadingsAsPerCode(value: any) {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          windLoadingAsPerCode: value,
        })
      );
  }

  const scene = useSelector((state: ApplicationState) => state.main.scene);

  const models = useSelector((state: ApplicationState) => {
    return state.main.projects
      .find((project) => project.name === state.main.currentProject)
      ?.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
  });

  useEffect(() => {
    if (project) {
      handleGettingDesignCodesAndParameters(models, project);
      models.forEach((model) => {
        dispatch(
          changeModel({
            ...model,
            structuralNaturalFrequency: undefined,
          } as PipeRack)
        );
      });
    }
  }, []);

  function handleGettingDesignCodesAndParameters(models: PipeRack[], project: Project) {
    if (models.length) {
      dispatch(changeProjectRequestProgressAction(project.name, "natfreq"));
      if (models.length > 1) {
        const jsons = models.map((model, i, arr) =>
          getJSONForDesignCodesAndParameters(scene, project, model, arr)
        );
        jsons.forEach((json, i, arr) => sendToNatFreq(project, json, models, arr.length === i + 1));
      } else {
        const prModels = project.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
        const json = getJSONForDesignCodesAndParameters(scene, project, models[0], prModels);
        sendToNatFreq(project, json, models, true);
      }
    }
  }

  function sendToNatFreq(project: Project, data: any, models: PipeRack[], isLast?: boolean) {
    axios
      .post(`${baseUrl}api/v2/piperack/calculate/natfreq`, JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        const model = models.find((model) => model.name === data.piperackName);
        model &&
          dispatch(
            changeModel({
              ...model,
              structuralNaturalFrequency: response.data.structuralNaturalFrequency,
            } as PipeRack)
          );
        isLast && dispatch(changeProjectRequestProgressAction(project.name, "natfreq", false));
      })
      .catch((err) => {
        console.error(err);
        dispatch(
          addEventAction(`Natural frequency (${data.piperackName}): ${err.message}`, "danger")
        );
        isLast && dispatch(changeProjectRequestProgressAction(project.name, "natfreq", false));
      });
  }

  return (
    <CustomDlg
      title={"Wind Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always">
            <div className="label-light t-end w-160">Wind Loading as per</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<LoadingAsPerCode | "Manual">
                items={[...loadingAsPerCodes, "Manual"]}
                selected={loadings?.windLoadingAsPerCode}
                onSelect={handleChangeWindLoadingsAsPerCode}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {loadings?.windLoadingAsPerCode === "IS Code" && <IndianParams />}
          {loadings?.windLoadingAsPerCode === "US Code" && <USParams />}
          {loadings?.windLoadingAsPerCode === "EU Code" && <></>}
          {loadings?.windLoadingAsPerCode === "Manual" && <ManualParams />}
          <div className={"hr"} />
          {natFreqProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <AdditionalLoads models={models} load={"windLoad"} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default WindLoad;
