import React, { useEffect, useMemo } from "react";
import { Project } from "../../../../../store/main/types";
import { FormGroup, Checkbox } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { changeProjectAction } from "../../../../../store/main/actions";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";

type Props = {
  project: Project | undefined;
};

export function AnalysisSettings(props: Props) {
  const { project } = props;

  const settings = useMemo(() => {
    return project?.settings.analysis;
  }, [project]);

  const dispatch = useDispatch();

  useEffect(()=>{
    console.log("settings updated", settings);
  }, [settings]);

  function handleChangeSettings(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          analysis: { ...project.settings.analysis, [field]: value },
        },
      })
    );
  }

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="p-5">
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Transparensy of Colors</div>
          <FormGroup className={"m-5"}>
            <SimpleNumericInput
              min={0}
              max={100}
              disabled={!settings}
              value={settings?.transparensyOfColors}
              onChange={(val) => handleChangeSettings("transparensyOfColors", val)}
            />
          </FormGroup>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Show Nodes</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!settings}
              checked={settings?.showNodes}
              onChange={(event) => handleChangeSettings("showNodes", event.currentTarget.checked)}
            />
          </FormGroup>
        </div>
        <div className={"d-flex f-ai-center bg-gray p-end-10"}>
          <div className="label-light w-mc p-start-10">Show Labels</div>
          <FormGroup className={"m-5"}>
            <Checkbox
              disabled={!settings}
              checked={settings?.showLabels}
              onChange={(event) => handleChangeSettings("showLabels", event.currentTarget.checked)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
