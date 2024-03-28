import React from "react";
import { Project, TCamera } from "../../../../../store/main/types";
import { Checkbox, FormGroup } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { changeProjectAction } from "../../../../../store/main/actions";

type Props = {
  project: Project | undefined;
};

export function CameraSettings(props: Props) {
  const { project } = props;

  const dispatch = useDispatch();

  function handleChange(field: string, val: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          camera: {
            ...project.settings.camera,
            [field]: val,
          },
        },
      })
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="p-5">
        <div className={"d-flex f-column bg-gray"}>
          <div className="d-flex f-ai-center bg-gray p-end-10">
            <div className="label-light w-mc p-start-10">Type</div>
            <FormGroup className="m-5">
              <SimpleSelector<TCamera>
                items={["Othrographic", "Perspective"]}
                selected={project?.settings.camera.cameraType}
                itemLabel={(item) => item}
                onSelect={(val) => handleChange("cameraType", val)}
                className="w-130"
              />
            </FormGroup>
          </div>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Focal pivot moving</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              checked={project?.settings.camera.isPivot}
              onChange={(event) =>
                handleChange("isPivot", event.currentTarget.checked)
              }
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
