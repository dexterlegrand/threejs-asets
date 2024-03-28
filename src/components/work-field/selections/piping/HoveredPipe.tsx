import React from "react";
import { useSelector } from "react-redux";
import { Icon } from "@blueprintjs/core";
import { roundVectorM, getPosByDistance } from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";

export function HoveredPipe() {
  const selectedPipe = useSelector((state: ApplicationState) => state.selections.hoveredPipe);

  function getSupports() {
    if (!selectedPipe?.pipe) return null;
    const supps = selectedPipe?.pipe?.params.supportDetails ?? [];
    return supps.map((sup: any) => {
      const pos = roundVectorM(
        getPosByDistance(sup.distance, selectedPipe.start, selectedPipe.end)
      );
      return (
        <React.Fragment key={`${sup.id}-${sup.type}`}>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">
              ({sup.type}) {sup.id}:
            </div>
          </div>
          <div className={"d-flex f-ai-center"}>
            X: {pos.x}m; Y: {pos.y}m; Z: {pos.z}m
          </div>
        </React.Fragment>
      );
    });
  }

  return selectedPipe ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Element name: {selectedPipe.pipeName}</h2>
        </div>
      </div>
      <div className={"body-grid full"}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.line}</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Start Position X:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.x1}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Start Position Y:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.y1}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Start Position Z:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.z1}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">End Position X:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.x2}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">End Position Y:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.y2}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">End Position Z:</div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.z2}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Length: </div>
        </div>
        <div className="d-flex f-ai-center">{selectedPipe.pipe?.length}m</div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light">C/S Library: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selectedPipe.pipe?.params.lib}
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light">NPS: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selectedPipe.pipe?.params.nps}
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light">Schedule: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selectedPipe.pipe?.params.profile?.schedule}
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light">Standard: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selectedPipe.pipe?.params.profile?.material}
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light">Material: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          {selectedPipe.pipe?.params.material?.material_name}
        </div>
      </div>
    </div>
  ) : null;
}
