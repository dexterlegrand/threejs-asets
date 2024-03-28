import React, { useMemo } from "react";
import { Button, Icon, FormGroup } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import {
  TPipingElbow,
  TPipingAccessory,
  TPipingTee,
} from "../../../../store/data/types";
import { changeProjectAction } from "../../../../store/main/actions";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { FreePipe, Project } from "../../../../store/main/types";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import {
  getAngle,
  getPipingAccessories,
} from "../../../3d-models/pipes/pipesUtils";
import { selectPipeConnector } from "../../../../store/selections/actions";

type Props = {
  project: Project | undefined;
};

export function SelectedConnector({ project }: Props) {
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedConnector
  );
  const UDEs = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );
  const resoures = useSelector((state: ApplicationState) => state.data);

  const dispatch = useDispatch();

  const name = useMemo(() => {
    if (!selected) return "";
    return `${(selected.connector as TPipingElbow).isUser ? "UDE - " : ""}${
      selected.connector.nps
    } - ${selected.connector.schedule} - ${
      (selected.connector as TPipingElbow).degree
        ? `${(selected.connector as TPipingElbow).degree} - `
        : ""
    }${selected.connector.material}`;
  }, [selected]);

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const prev = useMemo(() => {
    if (!selected) return undefined;
    return pipes.find((p) => p.pipe === selected.prev);
  }, [selected, pipes]);

  const nexts = useMemo(() => {
    if (!selected) return [];
    return pipes.filter((p) => selected.nexts.includes(p.pipe));
  }, [selected, pipes]);

  const angles = useMemo(() => {
    const angles: { angle: number; pipe: FreePipe }[] = [];
    if (!prev) return angles;
    for (const next of nexts) {
      const angle = getAngle(next, prev) || 0;
      if (!angles.find((item) => item.angle === angle))
        angles.push({ pipe: next, angle });
    }
    return angles;
  }, [prev, nexts]);

  function handleClose() {
    dispatch(selectPipeConnector());
  }

  function handleRemove() {
    if (!(project && selected && prev)) return;
    const changed = {
      ...prev,
      params: {
        ...prev.params,
        endConnector: undefined,
        endConnectorDetails: undefined,
      },
    };
    dispatch(
      changeProjectAction({
        ...project,
        freePipes: pipes.map((item) =>
          item.id === changed.id ? changed : item
        ),
      })
    );
  }

  function handleChange(field: string, val: any) {
    if (!(project && selected && prev)) return;
    let changed = { ...prev };
    switch (field) {
      case "endConnector":
        {
          changed = {
            ...changed,
            params: { ...changed.params, [field]: val },
          };
          const type = changed.params.endConnectorType;
          const tn =
            (changed.params.endConnector as TPipingElbow)?.t ??
            (changed.params.endConnector as TPipingTee)?.t1 ??
            (changed.params.endConnector as TPipingTee)?.t2 ??
            0;
          const d =
            (changed.params.endConnector as TPipingElbow)?.d ??
            (changed.params.endConnector as TPipingTee)?.d1 ??
            (changed.params.endConnector as TPipingTee)?.d2 ??
            0;
          changed = {
            ...changed,
            params: {
              ...changed.params,
              endConnector: val,
              endConnectorDetails:
                type === "Elbow" || type === "Tee"
                  ? {
                      type: type === "Elbow" ? "BWE" : "TW",
                      tn,
                      r: (d - tn) / 2,
                      R: (changed.params.endConnector as TPipingElbow)?.a,
                    }
                  : undefined,
            },
          };
        }
        break;
      case "hNextDir":
      case "vNextDir":
        changed = { ...changed, [field]: val };
        break;
    }
    dispatch(
      changeProjectAction({
        ...project,
        freePipes: pipes.map((item) =>
          item.id === changed.id ? changed : item
        ),
      })
    );
    if (changed.params.endConnector) {
      dispatch(
        selectPipeConnector({
          ...selected,
          connector: changed.params.endConnector,
        })
      );
    }
  }

  return selected ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Element name: {name}</h2>
        </div>
        <Button
          large
          minimal
          icon={"cross"}
          onClick={handleClose}
          intent={"danger"}
        />
      </div>
      <div className={"body-grid"}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.lineNo}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Previous Pipe: </div>
        </div>
        <div className="d-flex f-ai-center">{prev?.pipe}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Next Pipes: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.nexts.join(", ")}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Type: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.type}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Connector: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<TPipingAccessory>
              items={
                prev
                  ? getPipingAccessories(resoures, UDEs, prev, nexts, angles)
                  : []
              }
              itemLabel={(item) =>
                `${(item as TPipingElbow).isUser ? "UDE - " : ""}${
                  item.nps
                } - ${item.schedule} - ${
                  (item as TPipingElbow).degree
                    ? `${(item as TPipingElbow).degree} - `
                    : ""
                }${item.material}`
              }
              itemSecondLabel={(item) => (item as any).name}
              selected={selected.connector}
              onSelect={(value) => handleChange("endConnector", value)}
              filter={(query, item) =>
                query
                  ? `${(item as TPipingElbow).isUser ? "UDE - " : ""}${
                      item.nps
                    } - ${item.schedule} - ${
                      (item as TPipingElbow).degree
                        ? `${(item as TPipingElbow).degree} - `
                        : ""
                    }${item.material}`
                      .toLowerCase()
                      .includes(query.toLowerCase())
                  : true
              }
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Plan Direction: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={-180}
              max={180}
              value={nexts[0]?.hDir ?? prev?.hNextDir}
              disabled={!!nexts[0]}
              onChange={(val) => handleChange("hNextDir", val)}
            />
          </FormGroup>
          <div className="label-light">deg</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Elevation Direction: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={-90}
              max={90}
              value={nexts[0]?.vDir ?? prev?.vNextDir}
              disabled={!!nexts[0]}
              onChange={(val) => handleChange("vNextDir", val)}
            />
          </FormGroup>
          <div className="label-light">deg</div>
        </div>
        {/*{selected.type === "Reducer" && (
          <div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc t-end">Elevation Direction: </div>
          </div>
          <div className={"d-flex f-ai-center"}>
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={-90}
              max={90}
              value={nexts[0]?.vDir ?? prev?.vNextDir}
              disabled={!!nexts[0]}
              onChange={(val) => handleChange("vNextDir", val)}
            />
          </FormGroup>
          <div className="label-light">deg</div>
          </div>
          </div>
        )}*/}
      </div>
      
      <Button
        large
        fill
        text={"Remove"}
        intent={"danger"}
        onClick={handleRemove}
      />
    </div>
  ) : null;
}
