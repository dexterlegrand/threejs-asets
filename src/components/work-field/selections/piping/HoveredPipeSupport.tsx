import React from "react";
import { useSelector } from "react-redux";
import { Icon } from "@blueprintjs/core";
import { ApplicationState } from "../../../../store";

export function HoveredPipeSupport() {
  const selected = useSelector((state: ApplicationState) => state.selections.hoveredPipeSupport);

  function getCoordinates() {
    if (!selected) return null;
    return (
      <>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position X: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.x}m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position Y: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.y}m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position Z: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.z}m</div>
        </div>
      </>
    );
  }

  return selected ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Element name: {`${selected.pipe} ${selected.support.type} Support`}
          </h2>
        </div>
      </div>
      <div className={"body-grid full"}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center">
          <div className={"label-light"}>{selected.lineNo}</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Pipe No.: </div>
        </div>
        <div className="d-flex f-ai-center">
          <div className={"label-light"}>{selected.pipe}</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Support Position: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.distance}
          <div className="label-light">m</div>
        </div>
        {getCoordinates()}
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Support Type: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.support.type}</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Direction: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.support.direction}</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>K / δ: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.support.valueType}</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}x: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.x}
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}y: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.y}
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}z: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.z}
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Rx: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.Rx}
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Ry: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.Ry}
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Rz: </div>
        </div>
        <div className="d-flex f-ai-center">
          {selected.support.Rz}
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>µ: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selected.support.Mu}
        </div>

        {selected.support.masterNodePipe ? (
          <>
            <div className="d-flex f-ai-center f-jc-end">
              <div className={"label-light t-end"}>Master Node at Pipe: </div>
            </div>
            <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
              {selected.support.masterNodePipe}
            </div>
            <div className="d-flex f-ai-center f-jc-end">
              <div className={"label-light t-end"}>Master Node at Dist from start: </div>
            </div>
            <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
              {selected.support.masterNodeDist}
              <div className="label-light">m</div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  ) : null;
}
