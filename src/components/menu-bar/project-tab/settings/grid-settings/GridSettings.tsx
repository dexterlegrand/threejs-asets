import React from "react";
import { Project } from "../../../../../store/main/types";
import { FormGroup, Checkbox, Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { changeProjectAction } from "../../../../../store/main/actions";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";

type Props = {
  project: Project | undefined;
  openCustomGrids: () => any;
};

export function GridSettings(props: Props) {
  const { project, openCustomGrids } = props;

  const dispatch = useDispatch();

  function handleChangeParameters(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          grid: { ...project.settings.grid, [field]: value },
        },
      })
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">For Each Quadrant in Each Direction Grid</div>
      <div className="hr" />
      <div className="p-5" id="grid-setting-area">
        <div className={"d-flex f-column bg-gray"}>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">Display</div>
            <FormGroup className="m-5">
              <Checkbox
                checked={project?.settings.grid.display}
                onChange={(event) => handleChangeParameters("display", event.currentTarget.checked)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">Spacing (m)</div>
            <FormGroup className="m-5">
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={project?.settings.grid.spacing}
                onChange={(value) => handleChangeParameters("spacing", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">No.</div>
            <FormGroup className="m-5">
              <SimpleNumericInput
                min={1}
                isDecimal={true}
                value={project?.settings.grid.count}
                onChange={(value) => handleChangeParameters("count", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-center">
            <Button
              id="user-defined-grid-button"
              small
              text={"User defined Grids"}
              intent={"primary"}
              onClick={openCustomGrids}
              className={"m-5"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
