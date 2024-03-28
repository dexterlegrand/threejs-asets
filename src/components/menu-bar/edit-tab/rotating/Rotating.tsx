import React, { useState, useMemo, useEffect } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject, MtoMM } from "../../../3d-models/utils";
import { FormGroup, Button } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { Model, PipeRack } from "../../../../store/main/types";
import { handleRotate, TAngle } from "./rotatingUtils";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import { TFlare } from "../../../../store/main/types/flare";

type Props = {
  onClose: () => any;
};

export default function Rotating(props: Props) {
  const [model, setModel] = useState<Model>();
  const [angle, setAngle] = useState<TAngle>();
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [z, setZ] = useState<number>(0);

  const dispatch = useDispatch();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models = useMemo(() => {
    return [...(project?.models ?? []), ...(project?.flares ?? [])];
  }, [project?.models, project?.flares]);

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
  }, [project?.freePipes]);

  useEffect(() => {
    if (!model) return;
    if (
      model.type === "Pipe Rack" ||
      model.type === "Open Frame" ||
      model.type === "Factory Shed"
    ) {
      setX(MtoMM((model as PipeRack | TOpenFrame).startPos?.x ?? 0));
      setY(MtoMM((model as PipeRack | TOpenFrame).startPos?.y ?? 0));
      setZ(MtoMM((model as PipeRack | TOpenFrame).startPos?.z ?? 0));
    } else if (model.type === "Flare") {
      setX(MtoMM((model as TFlare).position?.x ?? 0));
      setY(MtoMM((model as TFlare).position?.y ?? 0));
      setZ(MtoMM((model as TFlare).position?.z ?? 0));
    }
  }, [model]);

  return (
    <CustomDlg
      zIndex={2}
      title={"Rotate"}
      isMinimize={true}
      onClose={props.onClose}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"bg-dark p-5"}>
            <div className={"d-flex f-column bg-gray"}>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Model</div>
                <FormGroup className="no-m f-grow">
                  <SimpleSelector<Model>
                    items={[...models, ...lines]}
                    itemLabel={(value) => value.name}
                    selected={model}
                    onSelect={setModel}
                    filter={(query, item) =>
                      item.name.toLowerCase().includes(query.toLowerCase())
                    }
                    className={"fill-select"}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-180">
                  Rotation Angle about Y
                </div>
                <FormGroup className="no-m f-grow">
                  <SimpleSelector<TAngle>
                    items={[270, 180, 90, -90, -180, -270]}
                    itemLabel={(value) => `${value}`}
                    selected={angle}
                    onSelect={setAngle}
                    className={"fill-select"}
                  />
                </FormGroup>
              </div>
              <div className={"hr"} />
              <div className="label-light d-flex bg-dark">
                Center of Rotation
              </div>
              <div className={"hr"} />
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-50">X =</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput value={x} onChange={setX} />
                </FormGroup>
                <div className="label-light w-50">mm</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-50">Y =</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    value={y}
                    disabled={true}
                    onChange={setY}
                  />
                </FormGroup>
                <div className="label-light w-50">mm</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-50">Z =</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput value={z} onChange={setZ} />
                </FormGroup>
                <div className="label-light w-50">mm</div>
              </div>
            </div>
          </div>
        </div>
      }
      actions={[
        <Button
          small
          key={"cancel"}
          text={"Cancel"}
          onClick={() => setModel(undefined)}
        />,
        <Button
          small
          key={"rotate"}
          text={"Rotate"}
          disabled={!project || !model}
          onClick={() =>
            handleRotate(dispatch, setModel, x, y, z, project, model, angle)
          }
          intent={"primary"}
        />,
      ]}
    />
  );
}
