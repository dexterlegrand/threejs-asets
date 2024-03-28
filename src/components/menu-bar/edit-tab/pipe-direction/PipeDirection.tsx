import React, { useState, useMemo, useEffect } from "react";
import { FreePipe, Direction3 } from "../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject, getDirection, MtoMM, MMtoM } from "../../../3d-models/utils";
import { Vector3 } from "three";
import { CustomDlg } from "../../../common/CustomDlg";
import { FormGroup, Button } from "@blueprintjs/core";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { directions3 } from "../../../../store/main/constants";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { changePipeLineDirection } from "./pipeDirectionUtils";

type Props = {
  onClose: () => any;
};

export default function PipeDirection(props: Props) {
  const [pipe, setPipe] = useState<FreePipe>();
  const [newDirection, setNewDirection] = useState<Direction3>();
  const [distance, setDistance] = useState<number>(0);

  const dispatch = useDispatch();

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const direction = useMemo(() => {
    if (!pipe) return undefined;
    return getDirection(
      new Vector3(pipe.x1, pipe.y1, pipe.z1),
      new Vector3(pipe.x2, pipe.y2, pipe.z2)
    );
  }, [pipe]);

  useEffect(() => {
    if (!pipe || !project) return;
    setPipe(project.freePipes?.find((p) => p.id === pipe.id));
  }, [project]);

  useEffect(() => {
    setNewDirection(undefined);
    setDistance(0);
  }, [pipe]);

  return (
    <CustomDlg
      zIndex={2}
      title={"Pipe Edit"}
      isMinimize={true}
      onClose={props.onClose}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"bg-dark p-5"}>
            <div className={"d-flex f-column bg-gray"}>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-mc">Pipe: </div>
                <FormGroup className="no-m f-grow">
                  <SimpleSelector<FreePipe>
                    items={pipes}
                    itemLabel={(value) => value.pipe}
                    selected={pipe}
                    onSelect={setPipe}
                    filter={(query, item) => item.pipe.toLowerCase().includes(query.toLowerCase())}
                    className={"fill-select"}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-mc">New Direction: </div>
                <FormGroup className="no-m f-grow">
                  <SimpleSelector<Direction3>
                    items={directions3}
                    itemLabel={(value) => value}
                    selected={newDirection}
                    onSelect={setNewDirection}
                    className={"fill-select"}
                  />
                </FormGroup>
              </div>
              <div className={"hr"} />
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-mc">Distance from start: </div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    min={0}
                    max={pipe ? MtoMM(pipe.length) : undefined}
                    isDecimal={true}
                    value={distance}
                    onChange={setDistance}
                  />
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
          key={"apply"}
          text={"Apply"}
          disabled={!pipe || !newDirection}
          onClick={() =>
            project &&
            changePipeLineDirection(dispatch, project, pipes, pipe!, newDirection!, MMtoM(distance))
          }
          intent={"primary"}
        />,
      ]}
    />
  );
}
