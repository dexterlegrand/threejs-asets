import React from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { ISParams } from "./ISParams";
import { USParams } from "./USParams";
import { DesignCode, Project } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { changeProjectAction } from "../../../../../store/main/actions";
import { ApplicationState } from "../../../../../store";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = {
  onClose: () => any;
};

export function DesignCodeAndParameters({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((project) => project.name === state.main.currentProject)
  );

  const dispatch = useDispatch();

  function handleChangeDesignCode(project: Project | undefined, designCode?: DesignCode) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        designCode: designCode ?? "IS 800 : 2007 LSD",
      })
    );
  }

  return (
    <CustomDlg
      title={"Design Code & Parameters"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always" style={{ paddingRight: 10 }}>
            <div className="label-light t-end w-120">Design Code</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<DesignCode>
                items={["IS 800 : 2007 LSD", "AISC LRFD", "Eurocode 3 [EN 1993-1-1:2005]"]}
                selected={project?.designCode}
                onSelect={(designCode) => handleChangeDesignCode(project, designCode)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {project?.designCode === "IS 800 : 2007 LSD" && <ISParams />}
          {project?.designCode === "AISC LRFD" && <USParams />}
          {project?.designCode === "Eurocode 3 [EN 1993-1-1:2005]" && <></>}
        </div>
      }
      onClose={onClose}
    />
  );
}
