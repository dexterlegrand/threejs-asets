import React, { useMemo } from "react";
import { Icon } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { Vector3 } from "three";
import { ApplicationState } from "../../../../store";
import { localToGlobal, vector3FromPoint } from "../../../3d-models/utils";
import { ModelItem, Releases } from "../../../../store/main/types";
import { Section, RolledSection } from "../../../../store/data/types";

export function HoveredMember() {
  const item = useSelector(
    (state: ApplicationState) => state.selections.hoveredMember
  );

  const globalStartV = useMemo(() => {
    return item
      ? localToGlobal(item.modelStart, item.start, item.modelDir)
      : new Vector3();
  }, [item]);

  const globalEndV = useMemo(() => {
    return item
      ? localToGlobal(item.modelStart, item.end, item.modelDir)
      : new Vector3();
  }, [item]);

  // function setPipeNodes(item: ModelItem, globalStartV: Vector3, globalEndV: Vector3) {
  //   setNodes([
  //     {
  //       id: 0,
  //       label: "Line No.",
  //       isExpanded: true,
  //       childNodes: [{ id: 1, label: item.lineNo ?? "" }],
  //     },
  //     {
  //       id: 4,
  //       label: "Start Position",
  //       isExpanded: true,
  //       childNodes: [
  //         {
  //           id: 5,
  //           label: `X: ${item.start.x.toFixed(3)}m (local); ${globalStartV.x.toFixed(3)}m (global)`,
  //         },
  //         {
  //           id: 6,
  //           label: `Y: ${item.start.y.toFixed(3)}m (local); ${globalStartV.y.toFixed(3)}m (global)`,
  //         },
  //         {
  //           id: 7,
  //           label: `Z: ${item.start.z.toFixed(3)}m (local); ${globalStartV.z.toFixed(3)}m (global)`,
  //         },
  //       ],
  //     },
  //     {
  //       id: 8,
  //       label: "End Position",
  //       isExpanded: true,
  //       childNodes: [
  //         {
  //           id: 9,
  //           label: `X: ${item.end.x.toFixed(3)}m (local); ${globalEndV.x.toFixed(3)}m (global)`,
  //         },
  //         {
  //           id: 10,
  //           label: `Y: ${item.end.y.toFixed(3)}m (local); ${globalEndV.y.toFixed(3)}m (global)`,
  //         },
  //         {
  //           id: 11,
  //           label: `Z: ${item.end.z.toFixed(3)}m (local); ${globalEndV.z.toFixed(3)}m (global)`,
  //         },
  //       ],
  //     },
  //     {
  //       id: 12,
  //       label: "Length",
  //       isExpanded: true,
  //       childNodes: [{ id: 13, label: `${item.start.distanceTo(item.end).toFixed(3)}m` }],
  //     },
  //     {
  //       id: 14,
  //       label: "Details",
  //       isExpanded: true,
  //       childNodes: [
  //         { id: 15, label: `C/S Library: ${item.lib}` },
  //         { id: 16, label: `NPS: ${item.nps}` },
  //         { id: 17, label: `Schedule: ${item.schedule}` },
  //         { id: 18, label: `Material: ${item.material}` },
  //         { id: 19, label: `Outer Diameter: ${item.od ?? 0}mm` },
  //         { id: 20, label: `Wall Thickness: ${item.wt ?? 0}mm` },
  //       ],
  //     },
  //   ]);
  // }

  function getField(
    label: string,
    value?: string | number | null,
    secondLabel?: string
  ) {
    return (
      <>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{label}: </div>
        </div>
        <div className="d-flex f-ai-center">
          {value}
          {secondLabel}
        </div>
      </>
    );
  }

  function getBeamNodes(item: ModelItem) {
    return (
      <>
        {getField(
          "Start X",
          `${item.start?.x.toFixed(3) ?? 0}m (local); ${globalStartV.x.toFixed(
            3
          )}m (global)`
        )}
        {getField(
          "Start Y",
          `${item.start?.y.toFixed(3) ?? 0}m (local); ${globalStartV.y.toFixed(
            3
          )}m (global)`
        )}
        {getField(
          "Start Z",
          `${item.start?.z.toFixed(3) ?? 0}m (local); ${globalStartV.z.toFixed(
            3
          )}m (global)`
        )}

        {getField(
          "End X",
          `${item.end?.x.toFixed(3) ?? 0}m (local); ${globalEndV.x.toFixed(
            3
          )}m (global)`
        )}
        {getField(
          "End Y",
          `${item.end?.y.toFixed(3) ?? 0}m (local); ${globalEndV.y.toFixed(
            3
          )}m (global)`
        )}
        {getField(
          "End Z",
          `${item.end?.z.toFixed(3) ?? 0}m (local); ${globalEndV.z.toFixed(
            3
          )}m (global)`
        )}

        {getField(
          "Length",
          vector3FromPoint(item.start)
            ?.distanceTo(vector3FromPoint(item.end) ?? new Vector3())
            .toFixed(3),
          "m"
        )}

        {getProfileNodes(item.profile)}
        {getReleasesNodes(item.releases)}
      </>
    );
  }

  function getProfileNodes(profile?: Section) {
    const type =
      profile?.country_code === "Rolled"
        ? "ProfileWithPlates"
        : profile?.country_code === "Fabricated"
        ? "FabProfile"
        : profile?.country_code
        ? "Profile"
        : "Pipe";
    const rolled =
      type === "ProfileWithPlates" ? (profile as RolledSection) : undefined;

    return profile ? (
      <>
        {type === "Profile" ? (
          <>
            {getField("Country code", profile.country_code)}
            {getField("Designation", profile.designation)}
            {getField("Shape", profile.shape)}
          </>
        ) : null}

        {type === "FabProfile" ? <>{getField("Shape", profile.shape)}</> : null}

        {rolled ? (
          <>
            {getField("Country code", rolled.baseCountryCode)}
            {getField("Base Profile", rolled.baseProfile)}
          </>
        ) : null}
      </>
    ) : null;
  }

  function getReleasesNodes(releases?: Releases) {
    return releases ? (
      <>
        {getField(
          "Releases fx",
          `1: (${!!releases?.fx1}); 2: (${!!releases?.fx2})`
        )}
        {getField(
          "Releases fy",
          `1: (${!!releases?.fy1}); 2: (${!!releases?.fy2})`
        )}
        {getField(
          "Releases fz",
          `1: (${!!releases?.fz1}); 2: (${!!releases?.fz2})`
        )}
        {getField(
          "Releases mx",
          `1: (${!!releases?.mx1}); 2: (${!!releases?.mx2})`
        )}
        {getField(
          "Releases my",
          `1: (${!!releases?.my1}); 2: (${!!releases?.my2})`
        )}
        {getField(
          "Releases mz",
          `1: (${!!releases?.mz1}); 2: (${!!releases?.mz2})`
        )}
      </>
    ) : null;
  }

  return item ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Element name: {item.name} of {item.model}
          </h2>
        </div>
      </div>
      <div className={"body-grid full"}>{item ? getBeamNodes(item) : null}</div>
    </div>
  ) : null;
}
