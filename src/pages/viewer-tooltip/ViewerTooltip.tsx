import { Button, FormGroup, Icon } from "@blueprintjs/core";
import React from "react";
import { SetterOrUpdater, useRecoilState } from "recoil";
import { Vector3 } from "three";
import {
  getPosByDistance,
  localToGlobal,
  round,
  roundM,
  roundVectorM,
} from "../../components/3d-models/utils";
import { SimpleInput } from "../../components/common/SimpleInput";
import { viewerSelectedElement } from "../../recoil/atoms/viewer-atom";
import { viewerComments } from "../../recoil/atoms/viewer-comments-atom";
import { FreePipe } from "../../store/main/types";
import { EProcessElementType } from "../../store/process/types";

export default function ViewerTooltip() {
  const [item, setElement] = useRecoilState(viewerSelectedElement);
  const [comments, setComments] = useRecoilState(viewerComments);

  return item ? (
    <div className={"viewer-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>{getTitle(item)}</h2>
        </div>
        <Button
          large
          minimal
          icon={"cross"}
          onClick={() => setElement(undefined)}
          intent={"danger"}
        />
      </div>
      <div className={"body-grid"}>{getBody(item, comments, setComments)}</div>
    </div>
  ) : null;
}

function getTitle(item: any) {
  if (item.isModelItem) {
    return `Element name: ${item.name} of ${item.model}`;
  } else if (item.isFreePipe) {
    return `Element name: ${item.pipe?.pipe}`;
  } else if (item.isFreePipeSupport) {
    return `Element name: ${item.pipe} ${item.support.type} Support`;
  } else if (item.isPipeConnector) {
    const name = `${item.connector.isUser ? "UDE - " : ""}${
      item.connector.nps
    } - ${item.connector.schedule} - ${
      item.connector.degree ? `${item.connector.degree} - ` : ""
    }${item.connector.material}`;
    return `Element name: ${name}`;
  } else if (item.isProcessItem) {
    return `Element name: ${item.name}`;
  } else if (item.isProcessLine) {
    return `Connection Line: ${item.from} - ${item.to}`;
  }
  return "";
}

function getBody(item: any, comments: any, setComments: SetterOrUpdater<any>) {
  if (item.isModelItem) {
    return getBeamBody(item, comments, setComments);
  } else if (item.isFreePipe) {
    return getPipeBody(item, comments, setComments);
  } else if (item.isFreePipeSupport) {
    return getPipeSuppBody(item, comments, setComments);
  } else if (item.isPipeConnector) {
    return getPipeConnectorBody(item, comments, setComments);
  } else if (item.isProcessItem) {
    return getProcessBody(item, comments, setComments);
  } else if (item.isProcessLine) {
    return getProcessLineBody(item, comments, setComments);
  }
  return null;
}

function getRow(
  title: string,
  value?: any,
  comment?: string,
  onChangeComment?: (value: string) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>{title}</div>
      </div>
      <div className="d-flex f-ai-center">{value}</div>
      <div>
        {onChangeComment ? (
          <FormGroup>
            <SimpleInput value={comment} onChange={onChangeComment} />
          </FormGroup>
        ) : null}
      </div>
    </>
  );
}

function getBeamBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const globalStartV = localToGlobal(
    item.modelStart,
    item.start,
    item.modelDir
  );
  const globalEndV = localToGlobal(item.modelStart, item.end, item.modelDir);
  const nodes: JSX.Element[] = [];
  let type, name;
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  if (item.profile) {
    const { profile } = item;
    type =
      profile?.country_code === "Rolled"
        ? "ProfileWithPlates"
        : profile?.country_code === "Fabricated"
        ? "FabProfile"
        : profile?.country_code
        ? "Profile"
        : "Pipe";
    const rolled = type === "ProfileWithPlates" ? profile : undefined;
    name = profile.name;

    if (type === "Profile") {
      nodes.push(
        getRow(
          "Country code: ",
          profile.country_code,
          elementComments["Country code: "],
          (value) => setElementComments(value, "Country code: ")
        )
      );
      nodes.push(
        getRow(
          "Designation: ",
          profile.designation,
          elementComments["Designation: "],
          (value) => setElementComments(value, "Designation: ")
        )
      );
      nodes.push(
        getRow("Shape: ", profile.shape, elementComments["Shape: "], (value) =>
          setElementComments(value, "Shape: ")
        )
      );
      profile.d_global &&
        nodes.push(
          getRow(
            "Depth / OD (mm): ",
            profile.d_global,
            elementComments["Depth / OD (mm): "],
            (value) => setElementComments(value, "Depth / OD (mm): ")
          )
        );
      (profile.shape === "PIPE" ? profile.t_global : profile.bf_global) &&
        nodes.push(
          getRow(
            "Width / ID (mm): ",
            profile.shape === "PIPE" ? profile.t_global : profile.bf_global,
            elementComments["Width / ID (mm): "],
            (value) => setElementComments(value, "Width / ID (mm): ")
          )
        );
      if (profile.tf_global || profile.tfb_global || profile.tw_global) {
        nodes.push(getRow("Thickness: "));
        profile.tf_global &&
          nodes.push(
            getRow(
              "Top flange (mm): ",
              profile.tf_global,
              elementComments["Top flange (mm): "],
              (value) => setElementComments(value, "Top flange (mm): ")
            )
          );
        (profile.tfb_global || profile.tf_global) &&
          nodes.push(
            getRow(
              "Bottom flange (mm): ",
              profile.tfb_global || profile.tf_global,
              elementComments["Bottom flange (mm): "],
              (value) => setElementComments(value, "Bottom flange (mm): ")
            )
          );
        profile.tw_global &&
          nodes.push(
            getRow(
              "Web (mm): ",
              profile.tw_global,
              elementComments["Web flange (mm): "],
              (value) => setElementComments(value, "Web flange (mm): ")
            )
          );
      }
    } else if (type === "FabProfile") {
      nodes.push(
        getRow("Shape: ", profile.shape, elementComments["Shape: "], (value) =>
          setElementComments(value, "Shape: ")
        )
      );
      if (profile.shape !== "O") {
        profile.d_global &&
          nodes.push(
            getRow(
              "Depth (mm): ",
              profile.d_global,
              elementComments["Depth (mm): "],
              (value) => setElementComments(value, "Depth (mm): ")
            )
          );
        profile.bf_global &&
          nodes.push(
            getRow(
              "Width (mm): ",
              profile.bf_global,
              elementComments["Width (mm): "],
              (value) => setElementComments(value, "Width (mm): ")
            )
          );
        if (profile.tf_global || profile.tfb_global || profile.tw_global) {
          nodes.push(getRow("Thickness: "));
          profile.tf_global &&
            nodes.push(
              getRow(
                "Top flange (mm): ",
                profile.tf_global,
                elementComments["Top flange (mm): "],
                (value) => setElementComments(value, "Top flange (mm): ")
              )
            );
          (profile.tfb_global || profile.tf_global) &&
            nodes.push(
              getRow(
                "Bottom flange (mm): ",
                profile.tfb_global || profile.tf_global,
                elementComments["Bottom flange (mm): "],
                (value) => setElementComments(value, "Bottom flange (mm): ")
              )
            );
          profile.tw_global &&
            nodes.push(
              getRow(
                "Web (mm): ",
                profile.tw_global,
                elementComments["Web (mm): "],
                (value) => setElementComments(value, "Web (mm): ")
              )
            );
        }
      } else {
        profile.d_global &&
          nodes.push(
            getRow(
              "Outer Diameter (mm): ",
              profile.d_global,
              elementComments["Outer Diameter (mm): "],
              (value) => setElementComments(value, "Outer Diameter (mm): ")
            )
          );
        profile.bf_global &&
          nodes.push(
            getRow(
              "Inner Diameter (mm): ",
              profile.bf_global,
              elementComments["Inner Diameter (mm): "],
              (value) => setElementComments(value, "Inner Diameter (mm): ")
            )
          );
      }
    } else if (type === "Pipe") {
      profile.d_global &&
        nodes.push(
          getRow(
            "Diameter (mm): ",
            profile.d_global,
            elementComments["Diameter (mm): "],
            (value) => setElementComments(value, "Diameter (mm): ")
          )
        );
      profile.bf_global &&
        nodes.push(
          getRow(
            "Thickness (mm): ",
            profile.bf_global,
            elementComments["Thickness (mm): "],
            (value) => setElementComments(value, "Thickness (mm): ")
          )
        );
    } else {
      if (rolled) {
        nodes.push(
          getRow(
            "Country code: ",
            rolled.baseCountryCode,
            elementComments["Country code: "],
            (value) => setElementComments(value, "Country code: ")
          )
        );
        nodes.push(
          getRow(
            "Base Profile: ",
            rolled.baseProfile,
            elementComments["Base Profile: "],
            (value) => setElementComments(value, "Base Profile: ")
          )
        );
        profile.d_global &&
          nodes.push(
            getRow(
              "Depth / OD (mm): ",
              profile.d_global,
              elementComments["Depth / OD (mm): "],
              (value) => setElementComments(value, "Depth / OD (mm): ")
            )
          );
        profile.bf_global &&
          nodes.push(
            getRow(
              "Width / ID (mm): ",
              profile.bf_global,
              elementComments["Width / ID (mm): "],
              (value) => setElementComments(value, "Width / ID (mm): ")
            )
          );
        if (profile.tf_global || profile.tfb_global || profile.tw_global) {
          nodes.push(getRow("Thickness: "));
          profile.tf_global &&
            nodes.push(
              getRow(
                "Top flange (mm): ",
                profile.tf_global,
                elementComments["Top flange (mm): "],
                (value) => setElementComments(value, "Top flange (mm): ")
              )
            );
          (profile.tfb_global || profile.tf_global) &&
            nodes.push(
              getRow(
                "Bottom flange (mm): ",
                profile.tfb_global || profile.tf_global,
                elementComments["Bottom flange (mm): "],
                (value) => setElementComments(value, "Bottom flange (mm): ")
              )
            );
          profile.tw_global &&
            nodes.push(
              getRow(
                "Web (mm): ",
                profile.tw_global,
                elementComments["Web (mm): "],
                (value) => setElementComments(value, "Web (mm): ")
              )
            );
        }
        if (rolled.tpWidth && rolled.tpThickness) {
          nodes.push(getRow("Top plate: "));
          rolled.tpWidth &&
            nodes.push(
              getRow(
                "Width (mm): ",
                rolled.tpWidth,
                elementComments["Width (mm): "],
                (value) => setElementComments(value, "Width (mm): ")
              )
            );
          rolled.tpThickness &&
            nodes.push(
              getRow(
                "Thickness (mm): ",
                rolled.tpThickness,
                elementComments["Thickness (mm): "],
                (value) => setElementComments(value, "Thickness (mm): ")
              )
            );
        }
        if (rolled.bpWidth && rolled.bpThickness) {
          nodes.push(getRow("Bottom plate: "));
          rolled.bpWidth &&
            nodes.push(
              getRow(
                "Width (mm): ",
                rolled.bpWidth,
                elementComments["Width (mm): "],
                (value) => setElementComments(value, "Width (mm): ")
              )
            );
          rolled.bpThickness &&
            nodes.push(
              getRow(
                "Thickness (mm): ",
                rolled.bpThickness,
                elementComments["Thickness (mm): "],
                (value) => setElementComments(value, "Thickness (mm): ")
              )
            );
        }
      }
    }
  }
  return (
    <>
      {getRow(
        "Orientation: ",
        `${item.orientation ?? 0}deg`,
        elementComments["Orientation: "],
        (value) => setElementComments(value, "Orientation: ")
      )}
      {getRow(
        "Start Position (m): ",
        `(${globalStartV.x.toFixed(3)}; ${globalStartV.y.toFixed(
          3
        )}; ${globalStartV.z.toFixed(3)})`,
        elementComments["Start Position (m): "],
        (value) => setElementComments(value, "Start Position (m): ")
      )}
      {getRow(
        "End Position (m): ",
        `(${globalEndV.x.toFixed(3)}; ${globalEndV.y.toFixed(
          3
        )}; ${globalEndV.z.toFixed(3)})`,
        elementComments["End Position (m): "],
        (value) => setElementComments(value, "End Position (m): ")
      )}
      {getRow(
        "Length (m): ",
        `${new Vector3(item.start.x, item.start.y, item.start.z)
          .distanceTo(new Vector3(item.end.x, item.end.y, item.end.z))
          .toFixed(3)}`,
        elementComments["Length (m): "],
        (value) => setElementComments(value, "Length (m): ")
      )}
      {getRow("Profile: ")}
      {getRow("Type: ", type, elementComments["Type: "], (value) =>
        setElementComments(value, "Type: ")
      )}
      {name
        ? getRow("Name: ", name, elementComments["Name: "], (value) =>
            setElementComments(value, "Name: ")
          )
        : null}
      {nodes}
      {item.releases ? (
        <>
          {getRow("Releases: ")}
          {getRow(
            "",
            `fx1: (${item.releases.fx1}); fx2: (${item.releases.fx2})`,
            elementComments["Releases fx: "],
            (value) => setElementComments(value, "Releases fx: ")
          )}
          {getRow(
            "",
            `fy1: (${item.releases.fy1}); fy2: (${item.releases.fy2})`,
            elementComments["Releases fy: "],
            (value) => setElementComments(value, "Releases fy: ")
          )}
          {getRow(
            "",
            `fz1: (${item.releases.fz1}); fz2: (${item.releases.fz2})`,
            elementComments["Releases fz: "],
            (value) => setElementComments(value, "Releases fz: ")
          )}
          {getRow(
            "",
            `mx1: (${item.releases.mx1}); mx2: (${item.releases.mx2})`,
            elementComments["Releases mx: "],
            (value) => setElementComments(value, "Releases mx: ")
          )}
          {getRow(
            "",
            `my1: (${item.releases.my1}); my2: (${item.releases.my2})`,
            elementComments["Releases my: "],
            (value) => setElementComments(value, "Releases my: ")
          )}
          {getRow(
            "",
            `mz1: (${item.releases.mz1}); mz2: (${item.releases.mz2})`,
            elementComments["Releases mz: "],
            (value) => setElementComments(value, "Releases mz: ")
          )}
        </>
      ) : null}
    </>
  );
}

function getPipeBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const { pipe } = item;
  let length = 0;
  if (pipe) {
    const start = new Vector3(pipe.x1, pipe.y1, pipe.z1);
    const end = new Vector3(pipe.x2, pipe.y2, pipe.z2);
    length = roundM(start.distanceTo(end));
  }
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  return (
    <>
      {getRow(
        "Line No.: ",
        pipe?.line,
        elementComments["Line No.: "],
        (value) => setElementComments(value, "Line No.: ")
      )}
      {getRow("Tag: ", pipe?.tag, elementComments["Tag: "], (value) =>
        setElementComments(value, "Tag: ")
      )}
      {getRow(
        "Supporting Structure: ",
        pipe?.structur,
        elementComments["Supporting Structure: "],
        (value) => setElementComments(value, "Supporting Structure: ")
      )}
      {getRow(
        "Start Position (m): ",
        `(${pipe?.x1}; ${pipe?.y1}; ${pipe?.z1})`,
        elementComments["Start Position (m): "],
        (value) => setElementComments(value, "Start Position (m): ")
      )}
      {getRow(
        "End Position (m): ",
        `(${pipe?.x2}; ${pipe?.y2}; ${pipe?.z2})`,
        elementComments["End Position (m): "],
        (value) => setElementComments(value, "End Position (m): ")
      )}
      {getRow(
        "Length (m): ",
        length,
        elementComments["Length (m): "],
        (value) => setElementComments(value, "Length (m): ")
      )}
      {getRow(
        "C/S Library: ",
        pipe?.params.lib,
        elementComments["C/S Library: "],
        (value) => setElementComments(value, "C/S Library: ")
      )}
      {getRow("NPS: ", pipe?.params.nps, elementComments["NPS: "], (value) =>
        setElementComments(value, "NPS: ")
      )}
      {getRow(
        "Schedule: ",
        pipe?.params.profile?.schedule,
        elementComments["Schedule: "],
        (value) => setElementComments(value, "Schedule: ")
      )}
      {getRow(
        "Standard: ",
        pipe?.params.profile?.material,
        elementComments["Standard: "],
        (value) => setElementComments(value, "Standard: ")
      )}
      {getRow(
        "Material: ",
        pipe?.params.material?.material_name,
        elementComments["Material: "],
        (value) => setElementComments(value, "Material: ")
      )}
      {getRow(
        "Outer Diameter (mm): ",
        pipe?.params.od,
        elementComments["Outer Diameter (mm): "],
        (value) => setElementComments(value, "Outer Diameter (mm): ")
      )}
      {getRow(
        "Wall Thickness (mm): ",
        pipe?.params.thickness,
        elementComments["Wall Thickness (mm): "],
        (value) => setElementComments(value, "Wall Thickness (mm): ")
      )}
      {getRow("Supports: ")}
      {getSupports(item, pipe, elementComments, setElementComments)}
    </>
  );
}

function getSupports(
  item: any,
  pipe: FreePipe | undefined,
  comments: any,
  setComments: (value: string, field: string) => any
) {
  if (!pipe) return null;
  const supps = pipe?.params.supportDetails ?? [];
  return supps.map((sup) => {
    const pos = roundVectorM(
      getPosByDistance(
        sup.distance,
        new Vector3(item.start.x, item.start.y, item.start.z),
        new Vector3(item.end.x, item.end.y, item.end.z)
      )
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
        <div>
          <FormGroup>
            <SimpleInput
              value={comments[`(${sup.type}) ${sup.id}:`]}
              onChange={(value) => setComments(value, "Wall Thickness (mm): ")}
            />
          </FormGroup>
        </div>
      </React.Fragment>
    );
  });
}

function getPipeSuppBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  return (
    <>
      {getRow(
        "Line No.: ",
        item.lineNo,
        elementComments["Line No.: "],
        (value) => setElementComments(value, "Line No.: ")
      )}
      {getRow("Pipe No.: ", item.pipe, elementComments["Pipe No.: "], (value) =>
        setElementComments(value, "Pipe No.: ")
      )}
      {getRow(
        "Support Position (m): ",
        item.support.distance,
        elementComments["Support Position (m): "],
        (value) => setElementComments(value, "Support Position (m): ")
      )}
      {getRow(
        "Support Type: ",
        item.support.type,
        elementComments["Support Type: "],
        (value) => setElementComments(value, "Support Type: ")
      )}
      {getRow(
        "Direction: ",
        item.support.direction,
        elementComments["Direction: "],
        (value) => setElementComments(value, "Direction: ")
      )}
      {getRow(
        "K / δ: ",
        item.support.valueType,
        elementComments["K / δ: "],
        (value) => setElementComments(value, "K / δ: ")
      )}
      {getRow(
        `${item.support.valueType}x (N/m): `,
        item.support.x,
        elementComments[`${item.support.valueType}x (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}x (N/m): `)
      )}
      {getRow(
        `${item.support.valueType}y (N/m): `,
        item.support.y,
        elementComments[`${item.support.valueType}y (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}y (N/m): `)
      )}
      {getRow(
        `${item.support.valueType}z (N/m): `,
        item.support.z,
        elementComments[`${item.support.valueType}z (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}z (N/m): `)
      )}
      {getRow(
        `${item.support.valueType}Rx (Nm/deg): `,
        item.support.Rx,
        elementComments[`${item.support.valueType}Rx (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}Rx (N/m): `)
      )}
      {getRow(
        `${item.support.valueType}Ry (Nm/deg): `,
        item.support.Ry,
        elementComments[`${item.support.valueType}Ry (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}Ry (N/m): `)
      )}
      {getRow(
        `${item.support.valueType}Rz (Nm/deg): `,
        item.support.Rz,
        elementComments[`${item.support.valueType}Rz (N/m): `],
        (value) =>
          setElementComments(value, `${item.support.valueType}Rz (N/m): `)
      )}
      {getRow("µ: ", item.support.Mu, elementComments[`µ: `], (value) =>
        setElementComments(value, `µ: `)
      )}
      {getRow(
        "Master Node at Pipe: ",
        item.support.masterNodePipe,
        elementComments[`Master Node at Pipe: `],
        (value) => setElementComments(value, `Master Node at Pipe: `)
      )}
      {getRow(
        "Master Node at Dist from start (m): ",
        item.support.masterNodeDist,
        elementComments[`Master Node at Dist from start (m): `],
        (value) =>
          setElementComments(value, `Master Node at Dist from start (m): `)
      )}
    </>
  );
}

function getPipeConnectorBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const connector = `${item.connector.isUser ? "UDE - " : ""}${
    item.connector.nps
  } - ${item.connector.schedule} - ${
    item.connector.degree ? `${item.connector.degree} - ` : ""
  }${item.connector.material}`;
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  return (
    <>
      {getRow(
        "Line No.: ",
        item.lineNo,
        elementComments[`Line No.: `],
        (value) => setElementComments(value, `Line No.: `)
      )}
      {getRow(
        "Previous Pipe: ",
        item.prev,
        elementComments[`Previous Pipe: `],
        (value) => setElementComments(value, `Previous Pipe: `)
      )}
      {getRow(
        "Next Pipes: ",
        item.nexts.join(", "),
        elementComments[`Next Pipes: `],
        (value) => setElementComments(value, `Next Pipes: `)
      )}
      {getRow("Type: ", item.type, elementComments[`Type: `], (value) =>
        setElementComments(value, `Type: `)
      )}
      {getRow(
        "Connector: ",
        connector,
        elementComments[`Connector: `],
        (value) => setElementComments(value, `Connector: `)
      )}
    </>
  );
}

function getProcessBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  return (
    <>
      {getRow("Tag No.: ", item.tag, elementComments[`Tag No.: `], (value) =>
        setElementComments(value, `Tag No.: `)
      )}
      {getRow(
        "Position (m): ",
        `(${item.position.x}; ${item.position.y}; ${item.position.z})`,
        elementComments[`Position (m): `],
        (value) => setElementComments(value, `Position (m): `)
      )}
      {getRow(
        "Rotation (deg): ",
        `(${item.rotationX}; ${item.rotation}; ${item.rotationZ})`,
        elementComments[`Rotation (deg): `],
        (value) => setElementComments(value, `Rotation (deg): `)
      )}
      {getRow(
        "Scale (%): ",
        round(item.scale * 100),
        elementComments[`Scale (%): `],
        (value) => setElementComments(value, `Scale (%): `)
      )}
      {getRow(
        "Connections: ",
        item.points.length,
        elementComments[`Connections: `],
        (value) => setElementComments(value, `Connections: `)
      )}
      {getAdditionalProcessFields(item, elementComments, setElementComments)}
    </>
  );
}

function getAdditionalProcessFields(
  item: any,
  comments: any,
  setComments: (value: string, field: string) => any
) {
  switch (item.type) {
    case EProcessElementType.VALVE:
      return (
        <>
          {getRow(
            "Valve Type: ",
            item.parameters.type,
            comments[`Valve Type: `],
            (value) => setComments(value, `Valve Type: `)
          )}
          {getRow(
            "Actuator Type: ",
            item.parameters.actuator,
            comments[`Actuator Type: `],
            (value) => setComments(value, `Actuator Type: `)
          )}
          {getRow(
            "Control Type: ",
            item.parameters.control,
            comments[`Control Type: `],
            (value) => setComments(value, `Control Type: `)
          )}
        </>
      );
    case EProcessElementType.HEADER:
      return (
        <>
          {getRow("NPS: ", item.parameters.nps, comments[`NPS: `], (value) =>
            setComments(value, `NPS: `)
          )}
          {item.parameters.schedule
            ? getRow(
                "Schedule: ",
                `${item.parameters.schedule.nominal_pipe_size_inch} ${item.parameters.schedule.schedule}`,
                comments[`Schedule: `],
                (value) => setComments(value, `Schedule: `)
              )
            : null}
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.SEPARATOR:
      return (
        <>
          {getRow(
            "Center line elevation (m): ",
            item.parameters.centerElevation,
            comments[`Center line elevation (m): `],
            (value) => setComments(value, `Center line elevation (m): `)
          )}
          {getRow(
            "Outlet line elevation (m): ",
            item.parameters.outletElevation,
            comments[`Outlet line elevation (m): `],
            (value) => setComments(value, `Outlet line elevation (m): `)
          )}
          {getRow(
            "Position from start (m): ",
            item.parameters.offset,
            comments[`Position from start (m): `],
            (value) => setComments(value, `Position from start (m): `)
          )}
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.HORIZONTAL_DRUM:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.PFR:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.CSTR:
      return (
        <>
          {getRow(
            "Volume: ",
            item.parameters.volume,
            comments[`Volume: `],
            (value) => setComments(value, `Volume: `)
          )}
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.TANK:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.DRUM:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.DISTILLATION_COLUMN:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.ABSORPTION_COLUMN:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.COLUMN:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.EXTRACTOR:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.EXPANDER:
      return (
        <>
          {getRow(
            "Center line elevation (m): ",
            item.parameters.centerElevation,
            comments[`Center line elevation (m): `],
            (value) => setComments(value, `Center line elevation (m): `)
          )}
        </>
      );
    case EProcessElementType.COMPRESSOR:
      return (
        <>
          {getRow(
            "Center line elevation (m): ",
            item.parameters.centerElevation,
            comments[`Center line elevation (m): `],
            (value) => setComments(value, `Center line elevation (m): `)
          )}
        </>
      );
    case EProcessElementType.PUMP:
      return (
        <>
          {getRow("Inlet Elevation (m): ", item.parameters.inletElevation)}
          {getRow(
            "Outlet line elevation (m): ",
            item.parameters.outletElevation,
            comments[`Outlet line elevation (m): `],
            (value) => setComments(value, `Outlet line elevation (m): `)
          )}
        </>
      );
    case EProcessElementType.PSV:
      return (
        <>
          {getRow(
            "Inlet Elevation (m): ",
            item.parameters.inletElevation,
            comments[`Inlet elevation (m): `],
            (value) => setComments(value, `Inlet elevation (m): `)
          )}
          {getRow(
            "Outlet line elevation (m): ",
            item.parameters.outletElevation,
            comments[`Outlet line elevation (m): `],
            (value) => setComments(value, `Outlet line elevation (m): `)
          )}
        </>
      );
    case EProcessElementType.AIRPHIN_COOLER:
      return (
        <>
          {getRow(
            "Width (mm): ",
            item.parameters.width,
            comments[`Width (mm): `],
            (value) => setComments(value, `Width (mm): `)
          )}
          {getRow(
            "Height (mm): ",
            item.parameters.height,
            comments[`Height (mm): `],
            (value) => setComments(value, `Height (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.SKID:
    case EProcessElementType.OTHER:
      return (
        <>
          {getRow(
            "Width (mm): ",
            item.parameters.width,
            comments[`Width (mm): `],
            (value) => setComments(value, `Width (mm): `)
          )}
          {getRow(
            "Height (mm): ",
            item.parameters.height,
            comments[`Height (mm): `],
            (value) => setComments(value, `Height (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.ST_HE_1P:
    case EProcessElementType.ST_HE_2P:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.ENLARGER:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Length (m): ",
            item.parameters.length,
            comments[`Length (m): `],
            (value) => setComments(value, `Length (m): `)
          )}
        </>
      );
    case EProcessElementType.RG:
    case EProcessElementType.RE:
    case EProcessElementType.RC:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.HEATER:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    case EProcessElementType.COOLER:
      return (
        <>
          {getRow(
            "Diameter (mm): ",
            item.parameters.diameter,
            comments[`Diameter (mm): `],
            (value) => setComments(value, `Diameter (mm): `)
          )}
          {getRow(
            "Height (m): ",
            item.parameters.height,
            comments[`Height (m): `],
            (value) => setComments(value, `Height (m): `)
          )}
        </>
      );
    default:
      return null;
  }
}

function getProcessLineBody(
  item: any,
  comments: any,
  setComments: SetterOrUpdater<any>
) {
  const title = getTitle(item);
  const elementComments = comments[title] ?? {};
  const setElementComments = (value: string, field: string) => {
    setComments((prev: any) => ({
      ...prev,
      [title]: { ...elementComments, [field]: value },
    }));
  };
  return (
    <>
      {getRow(
        "Line No.: ",
        item.processLineNo,
        elementComments[`Line No.: `],
        (value) => setElementComments(value, `Line No.: `)
      )}
      {getRow("Order: ", item.order, elementComments[`Order: `], (value) =>
        setElementComments(value, `Order: `)
      )}
      {getRow(
        "Length (m): ",
        item.segments.reduce((acc: number, s: any) => {
          return (
            acc +
            roundM(
              new Vector3(s.start.x, s.start.y, s.start.z).distanceTo(
                new Vector3(s.end.x, s.end.y, s.end.z)
              )
            )
          );
        }, 0),
        elementComments[`Length (m): `],
        (value) => setElementComments(value, `Length (m): `)
      )}
      {getRow(
        "Type: ",
        item.parameters?.type,
        elementComments[`Type: `],
        (value) => setElementComments(value, `Type: `)
      )}
      {getRow(
        "NPS: ",
        item.parameters?.nps,
        elementComments[`NPS: `],
        (value) => setElementComments(value, `NPS: `)
      )}
      {getRow(
        "Schedule: ",
        item.parameters?.schedule?.schedule,
        elementComments[`Schedule: `],
        (value) => setElementComments(value, `Schedule: `)
      )}
      {getRow(
        "Material: ",
        item.parameters?.material?.material_name,
        elementComments[`Material: `],
        (value) => setElementComments(value, `Material: `)
      )}
      {item.segments.map((s: any, i: number) => {
        return (
          <React.Fragment key={`${s.id}-${i}`}>
            {getRow(`Segment (${i + 1}): `)}
            {getRow(
              `Locked: `,
              s.locked,
              elementComments[`Segment (${i + 1}) Locked: `],
              (value) =>
                setElementComments(value, `Segment (${i + 1}) Locked: `)
            )}
            {getRow(
              `Length: `,
              roundM(
                new Vector3(s.start.x, s.start.y, s.start.z).distanceTo(
                  new Vector3(s.end.x, s.end.y, s.end.z)
                )
              ),
              elementComments[`Segment (${i + 1}) Length: `],
              (value) =>
                setElementComments(value, `Segment (${i + 1}) Length: `)
            )}
            {getRow(
              `NPS: `,
              s.parameters?.nps,
              elementComments[`Segment (${i + 1}) NPS: `],
              (value) => setElementComments(value, `Segment (${i + 1}) NPS: `)
            )}
            {getRow(
              `Schedule: `,
              s.parameters?.profile?.schedule,
              elementComments[`Segment (${i + 1}) Schedule: `],
              (value) =>
                setElementComments(value, `Segment (${i + 1}) Schedule: `)
            )}
            {getRow(
              `Material: `,
              s.parameters?.material?.material_name,
              elementComments[`Segment (${i + 1}) Material: `],
              (value) =>
                setElementComments(value, `Segment (${i + 1}) Material: `)
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
