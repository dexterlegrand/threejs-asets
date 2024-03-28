import React, { useEffect, useMemo } from "react";
import { FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { LoadingAsPerCode, Project } from "../../../../../store/main/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { loadingAsPerCodes, baseUrl } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import axios from "axios";
import {
  addEventAction,
  changeOFUIAction,
  changeProjectRequestProgressAction,
} from "../../../../../store/ui/actions";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getElementByName, getCurrentUI } from "../../../../3d-models/utils";
import { getJSONForDesignCodesAndParametersOF } from "../../../../3d-models/designCodeAndParametersOF";
import { getFSModels } from "../../../../3d-models/openFrame";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { AdditionalLoadsFS } from "../AdditionalLoads";
import { ISParamsFS } from "./ISParams";
import { USParamsFS } from "./USParams";
import { ManualParamsFS } from "./ManualParams";

type Props = {
  onClose: () => any;
};

export function WindLoadFS({ onClose }: Props) {
  const scene = useSelector((state: ApplicationState) => state.main.scene);

  const natFreqProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.natfreq
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const openFrameUI = useMemo(() => ui?.openFrameUI, [ui]);

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.windLoadUI;
  }, [openFrameUI]);

  useEffect(() => {
    handleGettingDesignCodesAndParameters(models, project);
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        models: project.models.map((model) => ({
          ...model,
          structuralNaturalFrequency: undefined,
        })),
      })
    );
  }, []);

  useEffect(() => {
    if (models.some((model) => model.structuralNaturalFrequency)) {
      handleChangeData("tab", "NF");
    } else {
      handleChangeData("tab", "AL");
    }
  }, [models]);

  function handleGettingDesignCodesAndParameters(models: TOpenFrame[], project?: Project) {
    if (!project || !models.length) return;
    if (!ui || !openFrameUI || !data) return;
    dispatch(changeProjectRequestProgressAction(project.name, "natfreq"));
    if (models.length > 1) {
      const jsons = models.map((model) =>
        getJSONForDesignCodesAndParametersOF(
          openFrameUI,
          ui.designCodeAndParametersUI,
          scene,
          project,
          model,
          models
        )
      );
      jsons.forEach((json, i, arr) => {
        sendToNatFreq(project, json, models, arr.length === i + 1);
      });
    } else {
      const json = getJSONForDesignCodesAndParametersOF(
        openFrameUI,
        ui.designCodeAndParametersUI,
        scene,
        project,
        models[0],
        models
      );
      sendToNatFreq(project, json, models, true);
    }
  }

  function sendToNatFreq(project: Project, data: any, models: TOpenFrame[], isLast?: boolean) {
    axios
      .post(`${baseUrl}api/v2/openFrame/calculate/natfreq`, JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        const model = models.find((model) => model.name === data.openFrameName);
        model &&
          dispatch(
            changeModel({
              ...model,
              structuralNaturalFrequency: response.data.structuralNaturalFrequency,
            } as TOpenFrame)
          );
        isLast && dispatch(changeProjectRequestProgressAction(project.name, "natfreq", false));
      })
      .catch((err) => {
        console.error(err);
        dispatch(
          addEventAction(`Natural frequency (${data.openFrameName}): ${err.message}`, "danger")
        );
        isLast && dispatch(changeProjectRequestProgressAction(project.name, "natfreq", false));
      });
  }

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          windLoadUI: { ...data, [field]: value },
        },
      })
    );
  }

  function showImportErrorMsg(loads: string, msg: string) {
    dispatch(addEventAction(`Wind Load (Import of ${loads}): ${msg}`, "danger"));
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
                selected={data?.windLoadingAsPerCode}
                onSelect={(value) => handleChangeData("windLoadingAsPerCode", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {data?.windLoadingAsPerCode === "IS Code" && (
            <ISParamsFS data={data} onChange={handleChangeData} />
          )}
          {data?.windLoadingAsPerCode === "US Code" && (
            <USParamsFS data={data} onChange={handleChangeData} />
          )}
          {data?.windLoadingAsPerCode === "EU Code" && <></>}
          {data?.windLoadingAsPerCode === "Manual" && (
            <ManualParamsFS data={data} onChange={handleChangeData} />
          )}
          <div className={"hr"} />
          {natFreqProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          {data && (
            <AdditionalLoadsFS
              data={data}
              models={models}
              load={"windLoadUI"}
              onChange={handleChangeData}
              onImportError={(msg) => showImportErrorMsg("Additional Loads", msg)}
            />
          )}
        </div>
      }
      onClose={onClose}
    />
  );
}
