import React, { useState, useMemo, useEffect } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject, getCurrentUI } from "../../../3d-models/utils";
import { FormGroup, Button } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { Model } from "../../../../store/main/types";
import { ConfirmDlg } from "../../../common/ConfirmDlg";
import { handleMove, handleCopySerial } from "./movingUtils";
import { MultiSelector } from "../../../common/MultiSelector";
import { TFlare } from "../../../../store/main/types/flare";
import { TProcessState } from "../../../../store/process/types";

type Props = {
  onClose: () => any;
};

export default function Moving(props: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [z, setZ] = useState<number>(0);
  const [count, setCount] = useState<number>(1);
  const [serialModels, setSerialModels] = useState<Model[]>([]);

  const dispatch = useDispatch();

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const processes = useSelector((state: ApplicationState) => state.process);
  const current = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const PRs = useMemo(() => {
    return project?.models.filter((m) => m.type === "Pipe Rack") ?? [];
  }, [project?.models]);

  const OFs = useMemo(() => {
    return project?.models.filter((m) => m.type === "Open Frame") ?? [];
  }, [project?.models]);

  const FSs = useMemo(() => {
    return project?.models.filter((m) => m.type === "Factory Shed") ?? [];
  }, [project?.models]);

  const flares: TFlare[] = useMemo(() => {
    return project?.flares?.map((f) => ({ ...f, type: "Flare" })) ?? [];
  }, [project?.flares]);

  const lines = useMemo(() => {
    if (!project || !project.freePipes) return [];
    const lines: Model[] = [];
    for (const pipe of project.freePipes) {
      if (lines.some((l) => l.name === `${pipe.line}`)) continue;
      lines.push({
        name: `${pipe.line}`,
        project: project.name,
        type: "Pipe Line",
      });
    }
    return lines;
  }, [project]);

  const models = useMemo(() => {
    return [
      ...PRs,
      ...OFs,
      ...FSs,
      ...flares,
      ...lines,
      ...getProcessElements(processes),
    ];
  }, [PRs, OFs, FSs, flares, lines, processes]);

  useEffect(() => {
    setSerialModels((selected) => {
      const reselected: Model[] = [];
      for (const s of selected) {
        const model = models.find((m) => m.name === s.name);
        if (model) reselected.push(model);
      }
      return reselected;
    });
  }, [models]);

  function getProcessElements(processes: TProcessState): Model[] {
    const p = processes.processes.get(current);
    if (!p) return [];
    return Array.from(p.elements.values())
      .sort((a, b) => a.tag.localeCompare(b.tag))
      .map((el) => ({ name: el.tag, type: "Equipment" } as Model));
  }

  return (
    <>
      {dlg}
      <CustomDlg
        zIndex={2}
        idText="move-or-clone-dialog"
        title={"Move"}
        isMinimize={true}
        onClose={props.onClose}
        body={
          <div className={"d-flex f-column f-grow"}>
            <div className={"bg-dark p-5"}>
              <div className={"d-flex f-column bg-gray"}>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-70">Models</div>
                  <FormGroup className="no-m f-grow">
                    <MultiSelector<Model>
                      items={models}
                      itemLabel={(value) => value.name}
                      selected={serialModels}
                      onSelect={setSerialModels}
                      className={"fill-select"}
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-mw">X =</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput value={x} onChange={setX} />
                  </FormGroup>
                  <div className="label-light w-50">mm</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-mw">Y =</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput value={y} onChange={setY} />
                  </FormGroup>
                  <div className="label-light w-50">mm</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-mw">Z =</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput value={z} onChange={setZ} />
                  </FormGroup>
                  <div className="label-light w-50">mm</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-mw">No. of copies</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput value={count} onChange={setCount} />
                  </FormGroup>
                </div>
              </div>
            </div>
          </div>
        }
        actions={[
          <Button
            small
            key={"move"}
            text={"Move"}
            onClick={() =>
              handleMove(
                dispatch,
                x,
                y,
                z,
                serialModels,
                project,
                processes.processes.get(current)
              )
            }
            intent={"primary"}
          />,
          <Button
            small
            key={"clone"}
            text={"Clone"}
            onClick={() =>
              mode !== "DESIGNER"
                ? setDlg(
                    <ConfirmDlg
                      message={"Do you want to clone geometry with loads?"}
                      onCancel={() =>
                        handleCopySerial(
                          dispatch,
                          setDlg,
                          models,
                          x,
                          y,
                          z,
                          count,
                          project,
                          processes.processes.get(current),
                          ui,
                          serialModels
                        )
                      }
                      onConfirm={() =>
                        handleCopySerial(
                          dispatch,
                          setDlg,
                          models,
                          x,
                          y,
                          z,
                          count,
                          project,
                          processes.processes.get(current),
                          ui,
                          serialModels,
                          true
                        )
                      }
                    />
                  )
                : handleCopySerial(
                    dispatch,
                    setDlg,
                    models,
                    x,
                    y,
                    z,
                    count,
                    project,
                    processes.processes.get(current),
                    ui,
                    serialModels
                  )
            }
            intent={"primary"}
          />,
        ]}
      />
    </>
  );
}
