import React, { useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../../common/CustomDlg";
import { ApplicationState } from "../../../../../store";
import { getElementByName } from "../../../../3d-models/utils";
import { changeProjectAction } from "../../../../../store/main/actions";
import { PipeInsulationLoads } from "./InsulationLoad";
import { AdditionalLoadsPP } from "../AdditionalLoads";

type Props = { onClose: () => any };

export function DeadLoadPP({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const dl = useMemo(() => {
    return project?.pipeLoadings.deadLoad;
  }, [project]);

  function handleChangeData(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: {
          ...project.pipeLoadings,
          deadLoad: {
            ...dl!,
            [field]: value,
          },
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Dead Load"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-grow bg-dark p-5"}>
            <div className="d-flex f-grow f-ai-center bg-gray">
              <div className="label-light">Piping self Weight Factor</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={0}
                  isDecimal={true}
                  value={dl?.pipingSelfWeightFactor}
                  onChange={(value) => handleChangeData("pipingSelfWeightFactor", value)}
                />
              </FormGroup>
            </div>
          </div>
          <div className="hr" />
          <PipeInsulationLoads project={project} pipes={pipes} dl={dl} />
          <div className="hr" />
          <AdditionalLoadsPP
            type={"DL"}
            pipes={pipes}
            loads={dl?.loads ?? []}
            onChange={(loads) => handleChangeData("loads", loads)}
          />
        </div>
      }
      onClose={onClose}
    />
  );
}
