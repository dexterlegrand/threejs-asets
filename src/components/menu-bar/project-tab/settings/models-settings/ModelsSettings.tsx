import React, { useMemo } from "react";
import { Project } from "../../../../../store/main/types";
import { FormGroup, Checkbox } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { changeProjectAction } from "../../../../../store/main/actions";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";

type Props = {
  project: Project | undefined;
};

export function ModelsSettings(props: Props) {
  const { project } = props;

  const modelsSettings = useMemo(() => {
    return project?.settings.models;
  }, [project]);

  const dispatch = useDispatch();

  function handleChangeSettings(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          models: { ...project.settings.models, [field]: value },
        },
      })
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="p-5">
        <div className="d-flex f-ai-center bg-gray p-end-10">
          <div className="label-light w-mc p-start-10">
            Platform Transparency Factor
          </div>
          <FormGroup className="no-m w-50">
            <SimpleNumericInput
              min={0}
              max={100}
              value={modelsSettings?.platformTransparency ?? 0}
              onChange={(value) =>
                handleChangeSettings("platformTransparency", value)
              }
            />
          </FormGroup>
          <div className="label-light w-mc p-start-10">%</div>
        </div>
        <div className="d-flex f-ai-center bg-gray p-end-10">
          <div className="label-light w-mc p-start-10">
            Fire Proofing Transparency Factor
          </div>
          <FormGroup className="no-m w-50">
            <SimpleNumericInput
              min={0}
              max={100}
              value={modelsSettings?.fireproofingTransparency ?? 0}
              onChange={(value) =>
                handleChangeSettings("fireproofingTransparency", value)
              }
            />
          </FormGroup>
          <div className="label-light w-mc p-start-10">%</div>
        </div>
        <div className="d-flex f-ai-center bg-gray p-end-10">
          <div className="label-light w-mc p-start-10">
            Process Pipe Transparency Factor
          </div>
          <FormGroup className="no-m w-50">
            <SimpleNumericInput
              min={0}
              max={100}
              value={modelsSettings?.processPipeTransparency ?? 10}
              onChange={(value) =>
                handleChangeSettings("processPipeTransparency", value)
              }
            />
          </FormGroup>
          <div className="label-light w-mc p-start-10">%</div>
        </div>
        <div className="d-flex f-ai-center bg-gray p-end-10">
          <div className="label-light w-mc p-start-10">
            Pipe Transparency Factor
          </div>
          <FormGroup className="no-m w-50">
            <SimpleNumericInput
              min={0}
              max={100}
              value={modelsSettings?.pipeTransparency ?? 100}
              onChange={(value) =>
                handleChangeSettings("pipeTransparency", value)
              }
            />
          </FormGroup>
          <div className="label-light w-mc p-start-10">%</div>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Model axes helpers</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!modelsSettings}
              checked={modelsSettings?.modelAxesHelpers}
              onChange={(event) =>
                handleChangeSettings(
                  "modelAxesHelpers",
                  event.currentTarget.checked
                )
              }
            />
          </FormGroup>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Model loadings</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!modelsSettings}
              checked={modelsSettings?.modelLoadings}
              onChange={(event) =>
                handleChangeSettings(
                  "modelLoadings",
                  event.currentTarget.checked
                )
              }
            />
          </FormGroup>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">
            Element axes helpers
          </div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!modelsSettings}
              checked={modelsSettings?.axesHelper === "ALL"}
              onChange={(event) =>
                handleChangeSettings(
                  "axesHelper",
                  event.currentTarget.checked ? "ALL" : undefined
                )
              }
            />
          </FormGroup>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">
            Show Process in Piping
          </div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!modelsSettings}
              checked={modelsSettings?.processInPiping}
              onChange={(event) =>
                handleChangeSettings(
                  "processInPiping",
                  event.currentTarget.checked
                )
              }
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
