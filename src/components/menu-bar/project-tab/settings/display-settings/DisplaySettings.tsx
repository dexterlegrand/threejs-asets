import React, { useMemo } from "react";
import { Project } from "../../../../../store/main/types";
import { FormGroup, Checkbox } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { changeProjectAction } from "../../../../../store/main/actions";

type Props = {
  project: Project | undefined;
};

export function DisplaySettings(props: Props) {
  const { project } = props;

  const settings = useMemo(() => {
    return project?.settings.display;
  }, [project]);

  const dispatch = useDispatch();

  function handleChangeSettings(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          display: { ...project.settings.display, [field]: value },
        },
      })
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="p-5">
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Tooltips for structures elements</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!settings}
              checked={settings?.hoverEffects}
              onChange={(event) =>
                handleChangeSettings("hoverEffects", event.currentTarget.checked)
              }
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
