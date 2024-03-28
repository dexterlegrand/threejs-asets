import React, { useEffect, useMemo, useState } from "react";
import { ModelItem, Releases, Project, Model } from "../../store/main/types";
import { ITreeNode, Tree, Button, Icon, Popover } from "@blueprintjs/core";
import { localToGlobal, vector3FromPoint } from "../3d-models/utils";
import { changeModel, changeProjectAction } from "../../store/main/actions";
import { useDispatch } from "react-redux";
import { Section, RolledSection } from "../../store/data/types";
import { Vector3 } from "three";
import { selectModelItem } from "../../store/selections/actions";
import { ProjectUI } from "../../store/ui/types";
import { confirmAction } from "../../store/ui/actions";
import {
  getMapOfBeamElements,
  removeFromOpenFrame,
  removeOFModel,
} from "../3d-models/openFrame";
import { TColorPallete, TOpenFrame } from "../../store/main/openFrameTypes";
import { CustomDlg } from "../common/CustomDlg";
import { SketchPicker } from "react-color";

type Props = {
  ui: ProjectUI | undefined;
  item: ModelItem | undefined;
  project: Project | undefined;
  models: Model[];
};

const DefaultColorPalette: TColorPallete = {
  COLUMN: "#00cc00",
  BEAM: "#d4af37",
  "HORIZONTAL-BRACING": "#0000ff",
  "VERTICAL-BRACING": "#00ffff",
  "KNEE-BRACING": "#00ffff",
  STAIRCASE: "#d4af37",
  CANTILEVER: "#d4af37",
};

export function SelectedElement({ ui, item, project, models }: Props) {
  const [isColor, setIsColor] = useState(false);
  const [color, setColor] = useState<string>();
  const [nodes, setNodes] = useState<ITreeNode[]>([]);

  const dispatch = useDispatch();

  const model = useMemo(() => {
    if (!item) return;
    return models.find((m) => m.name === item.model);
  }, [item, models]);

  useEffect(() => {
    if (!item) return;
    if (!model) dispatch(selectModelItem(undefined));
  }, [item, model]);

  const type = useMemo(() => {
    if (!item || !model || model.type !== "Open Frame") return;
    return getMapOfBeamElements(model as TOpenFrame).get(item.name)?.type;
  }, [item, model]);

  useEffect(() => {
    if (item) {
      const globalStartV = localToGlobal(
        item.modelStart,
        item.start,
        item.modelDir
      );
      const globalEndV = localToGlobal(
        item.modelStart,
        item.end,
        item.modelDir
      );
      if (item.isPipe) {
        setPipeNodes(item, globalStartV, globalEndV);
      } else {
        setBeamNodes(item, globalStartV, globalEndV);
      }
    } else setNodes([]);
    return () => {
      setNodes([]);
      setIsColor(false);
    };
  }, [item, model, type]);

  function setPipeNodes(
    item: ModelItem,
    globalStartV: Vector3,
    globalEndV: Vector3
  ) {
    setNodes([
      {
        id: 0,
        label: "Line No.",
        isExpanded: true,
        childNodes: [{ id: 1, label: item.lineNo ?? "" }],
      },
      {
        id: 2,
        label: "Axes Helper",
        isExpanded: true,
        childNodes: [{ id: 49, label: `${!!item.isAxesHelper}` }],
      },
      {
        id: 4,
        label: "Start Position",
        isExpanded: true,
        childNodes: [
          {
            id: 5,
            label: `X: ${item.start.x.toFixed(
              3
            )}m (local); ${globalStartV.x.toFixed(3)}m (global)`,
          },
          {
            id: 6,
            label: `Y: ${item.start.y.toFixed(
              3
            )}m (local); ${globalStartV.y.toFixed(3)}m (global)`,
          },
          {
            id: 7,
            label: `Z: ${item.start.z.toFixed(
              3
            )}m (local); ${globalStartV.z.toFixed(3)}m (global)`,
          },
        ],
      },
      {
        id: 8,
        label: "End Position",
        isExpanded: true,
        childNodes: [
          {
            id: 9,
            label: `X: ${item.end.x.toFixed(
              3
            )}m (local); ${globalEndV.x.toFixed(3)}m (global)`,
          },
          {
            id: 10,
            label: `Y: ${item.end.y.toFixed(
              3
            )}m (local); ${globalEndV.y.toFixed(3)}m (global)`,
          },
          {
            id: 11,
            label: `Z: ${item.end.z.toFixed(
              3
            )}m (local); ${globalEndV.z.toFixed(3)}m (global)`,
          },
        ],
      },
      {
        id: 12,
        label: "Length",
        isExpanded: true,
        childNodes: [
          {
            id: 13,
            label: `${vector3FromPoint(item.start)
              .distanceTo(vector3FromPoint(item.end))
              .toFixed(3)}m`,
          },
        ],
      },
      {
        id: 14,
        label: "Details",
        isExpanded: true,
        childNodes: [
          { id: 15, label: `C/S Library: ${item.lib}` },
          { id: 16, label: `NPS: ${item.nps}` },
          { id: 17, label: `Schedule: ${item.schedule}` },
          { id: 18, label: `Material: ${item.material}` },
          { id: 19, label: `Outer Diameter: ${item.od ?? 0}mm` },
          { id: 20, label: `Wall Thickness: ${item.wt ?? 0}mm` },
        ],
      },
    ]);
  }

  function setBeamNodes(
    item: ModelItem,
    globalStartV: Vector3,
    globalEndV: Vector3
  ) {
    if (!model) return;
    if (model.type === "Open Frame") {
      if (!type) return;
      let color: string = "Default";
      if (
        (model as TOpenFrame).palette &&
        // @ts-ignore
        (model as TOpenFrame).palette[type]
      ) {
        // @ts-ignore
        color = (model as TOpenFrame).palette[type];
      }
      setNodes((prev) => [
        ...prev,
        {
          id: 50,
          label: "Color",
          isExpanded: true,
          childNodes: [
            {
              id: 51,
              label: (
                <div
                  className="d-flex f-ai-center"
                  style={{ gap: 8 }}
                  onClick={() => {
                    setIsColor(true);
                    setColor(
                      color === "Default" ? DefaultColorPalette[type] : color
                    );
                  }}
                >
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 15,
                      // @ts-ignore
                      backgroundColor:
                        color === "Default" ? DefaultColorPalette[type] : color,
                    }}
                  />
                  <span>{color}</span>
                </div>
              ),
            },
          ],
        },
      ]);
    }
    setNodes((prev) => [
      ...prev,
      {
        id: 48,
        label: "Axes Helper",
        isExpanded: true,
        childNodes: [{ id: 49, label: `${!!item.isAxesHelper}` }],
      },
      {
        id: 0,
        label: "Orientation",
        isExpanded: true,
        childNodes: [{ id: 1, label: `${item.orientation ?? 0}deg` }],
      },
      {
        id: 2,
        label: "Start Position",
        isExpanded: true,
        childNodes: [
          {
            id: 3,
            label: `X: ${item.start.x.toFixed(
              3
            )}m (local); ${globalStartV.x.toFixed(3)}m (global)`,
          },
          {
            id: 4,
            label: `Y: ${item.start.y.toFixed(
              3
            )}m (local); ${globalStartV.y.toFixed(3)}m (global)`,
          },
          {
            id: 5,
            label: `Z: ${item.start.z.toFixed(
              3
            )}m (local); ${globalStartV.z.toFixed(3)}m (global)`,
          },
        ],
      },
      {
        id: 6,
        label: "End Position",
        isExpanded: true,
        childNodes: [
          {
            id: 7,
            label: `X: ${item.end.x.toFixed(
              3
            )}m (local); ${globalEndV.x.toFixed(3)}m (global)`,
          },
          {
            id: 8,
            label: `Y: ${item.end.y.toFixed(
              3
            )}m (local); ${globalEndV.y.toFixed(3)}m (global)`,
          },
          {
            id: 9,
            label: `Z: ${item.end.z.toFixed(
              3
            )}m (local); ${globalEndV.z.toFixed(3)}m (global)`,
          },
        ],
      },
      {
        id: 10,
        label: "Length",
        isExpanded: true,
        childNodes: [
          {
            id: 11,
            label: `${vector3FromPoint(item.start)
              .distanceTo(vector3FromPoint(item.end))
              .toFixed(3)}m`,
          },
        ],
      },
      {
        id: 12,
        label: "Profile",
        isExpanded: true,
        childNodes: [...getProfileNodes(item.profile)],
      },
      {
        id: 41,
        label: "Releases",
        isExpanded: true,
        childNodes: [...getReleasesNodes(item.releases)],
      },
    ]);
  }

  function getProfileNodes(profile?: Section) {
    const profNodes: ITreeNode[] = [];
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
    profNodes.push({ id: 14, label: `Type: ${type}` });
    if (profile?.name) {
      profNodes.push({ id: 15, label: `Name: ${profile.name}` });
    }
    if (type === "Profile") {
      type === "Profile" &&
        profNodes.push({
          id: 16,
          label: `Country code: ${profile?.country_code}`,
        });
      type === "Profile" &&
        profNodes.push({
          id: 17,
          label: `Designation: ${profile?.designation}`,
        });
      profNodes.push({ id: 18, label: `Shape: ${profile?.shape}` });
      profile?.d_global &&
        profNodes.push({ id: 19, label: `Depth / OD: ${profile.d_global}mm` });
      // @ts-ignore
      (profile?.shape === "PIPE" ? profile.t_global : profile?.bf_global) &&
        profNodes.push({
          id: 20,
          label: `Width / ID: ${
            // @ts-ignore
            profile?.shape === "PIPE" ? profile?.t_global : profile?.bf_global
          }mm`,
        });
      if (profile?.tf_global || profile?.tfb_global || profile?.tw_global) {
        const children: ITreeNode[] = [];
        profile.tf_global &&
          children.push({
            id: 22,
            label: `Top flange: ${profile.tf_global}mm`,
          });
        profile.tf_global &&
          children.push({
            id: 23,
            label: `Bottom flange: ${profile.tf_global}mm`,
          });
        profile.tw_global &&
          children.push({ id: 24, label: `Web: ${profile.tw_global}mm` });
        profNodes.push({
          id: 21,
          label: `Thickness: `,
          isExpanded: true,
          childNodes: [...children],
        });
      }
    } else if (type === "FabProfile") {
      profNodes.push({ id: 18, label: `Shape: ${profile?.shape}` });
      if (profile?.shape !== "O") {
        profile?.d_global &&
          profNodes.push({ id: 19, label: `Depth: ${profile.d_global}mm` });
        profile?.bf_global &&
          profNodes.push({ id: 20, label: `Width: ${profile.bf_global}mm` });
        if (profile?.tf_global || profile?.tfb_global || profile?.tw_global) {
          const children: ITreeNode[] = [];
          profile.tf_global &&
            children.push({
              id: 22,
              label: `Top flange: ${profile.tf_global}mm`,
            });
          profile.tfb_global &&
            children.push({
              id: 23,
              label: `Bottom flange: ${profile.tfb_global}mm`,
            });
          profile.tw_global &&
            children.push({ id: 24, label: `Web: ${profile.tw_global}mm` });
          profNodes.push({
            id: 21,
            label: `Thickness: `,
            isExpanded: true,
            childNodes: [...children],
          });
        }
      } else {
        profile.d_global &&
          profNodes.push({
            id: 25,
            label: `Outer Diameter: ${profile.d_global}mm`,
          });
        profile.bf_global &&
          profNodes.push({
            id: 26,
            label: `Inner Diameter: ${profile.bf_global}mm`,
          });
      }
    } else if (type === "Pipe") {
      profile?.d_global &&
        profNodes.push({ id: 19, label: `Diameter: ${profile.d_global}mm` });
      profile?.bf_global &&
        profNodes.push({ id: 20, label: `Thickness: ${profile.bf_global}mm` });
    } else {
      if (rolled) {
        profNodes.push({
          id: 27,
          label: `Country code: ${rolled.baseCountryCode}`,
        });
        profNodes.push({
          id: 28,
          label: `Base Profile: ${rolled.baseProfile}`,
        });
        profile?.d_global &&
          profNodes.push({
            id: 29,
            label: `Depth / OD: ${profile.d_global}mm`,
          });
        profile?.bf_global &&
          profNodes.push({
            id: 30,
            label: `Width / ID: ${profile.bf_global}mm`,
          });
        if (profile?.tf_global || profile?.tfb_global || profile?.tw_global) {
          const children: ITreeNode[] = [];
          profile?.tf_global &&
            children.push({
              id: 32,
              label: `Top flange: ${profile.tf_global}mm`,
            });
          profile?.tfb_global &&
            children.push({
              id: 33,
              label: `Bottom flange: ${profile.tfb_global}mm`,
            });
          profile?.tw_global &&
            children.push({ id: 34, label: `Web: ${profile.tw_global}mm` });
          profNodes.push({
            id: 31,
            label: `Thickness: `,
            isExpanded: true,
            childNodes: [...children],
          });
        }
        if (rolled.tpWidth && rolled.tpThickness) {
          const children: ITreeNode[] = [];
          rolled.tpWidth &&
            children.push({ id: 36, label: `Width: ${rolled.tpWidth}mm` });
          rolled.tpThickness &&
            children.push({
              id: 37,
              label: `Thickness: ${rolled.tpThickness}mm`,
            });
          profNodes.push({
            id: 35,
            label: `Top plate: `,
            isExpanded: true,
            childNodes: [...children],
          });
        }
        if (rolled.bpWidth && rolled.bpThickness) {
          const children: ITreeNode[] = [];
          rolled.bpWidth &&
            children.push({ id: 39, label: `Width: ${rolled.bpWidth}mm` });
          rolled.bpThickness &&
            children.push({
              id: 40,
              label: `Thickness: ${rolled.bpThickness}mm`,
            });
          profNodes.push({
            id: 38,
            label: `Bottom plate: `,
            isExpanded: true,
            childNodes: [...children],
          });
        }
      }
    }
    return profNodes;
  }

  function getReleasesNodes(releases?: Releases) {
    return [
      {
        id: 42,
        label: `fx1: (${!!releases?.fx1}); fx2: (${!!releases?.fx2})`,
      },
      {
        id: 43,
        label: `fy1: (${!!releases?.fy1}); fy2: (${!!releases?.fy2})`,
      },
      {
        id: 44,
        label: `fz1: (${!!releases?.fz1}); fz2: (${!!releases?.fz2})`,
      },
      {
        id: 45,
        label: `mx1: (${!!releases?.mx1}); mx2: (${!!releases?.mx2})`,
      },
      {
        id: 46,
        label: `my1: (${!!releases?.my1}); my2: (${!!releases?.my2})`,
      },
      {
        id: 47,
        label: `mz1: (${!!releases?.mz1}); mz2: (${!!releases?.mz2})`,
      },
    ];
  }

  function handleNodeClick(
    nodeData: ITreeNode,
    _nodePath: number[],
    e: React.MouseEvent<HTMLElement>
  ) {
    const originallySelected = nodeData.isSelected;
    if (!e.shiftKey) {
      forEachNode(nodes, (n) => (n.isSelected = false));
    }
    nodeData.isSelected =
      originallySelected == null ? true : !originallySelected;
    if (nodeData.id === 49) {
      if (!project || !item) return;
      dispatch(
        changeProjectAction({
          ...project,
          settings: {
            ...project.settings,
            models: {
              ...project.settings.models,
              axesHelper: item.isAxesHelper ? undefined : item.name,
            },
          },
        })
      );
      dispatch(
        selectModelItem(
          {
            ...item,
            isAxesHelper: !item.isAxesHelper,
          },
          true
        )
      );
    }
    setNodes([...nodes]);
  }

  function handleNodeCollapse(nodeData: ITreeNode) {
    nodeData.isExpanded = false;
    setNodes([...nodes]);
  }

  function handleNodeExpand(nodeData: ITreeNode) {
    nodeData.isExpanded = true;
    setNodes([...nodes]);
  }

  function forEachNode(
    nodes: ITreeNode[],
    callback: (node: ITreeNode) => void
  ) {
    if (!nodes) return;
    for (const node of nodes) {
      callback(node);
      node.childNodes && forEachNode(node.childNodes, callback);
    }
  }

  function handleRemove() {
    if (!ui || !item || !project || item.project !== project.name) return;
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete the selected item?",
        onConfirm: () => {
          const model = models.find((m) => m.name === item.model);
          if (!model) return;
          if (model.type === "ROAD") {
            const changed = removeOFModel(project, ui.openFrameUI, model.name);
            dispatch(
              changeProjectAction({
                ...changed.newProject,
                models: [...changed.newProject.models],
              })
            );
          } else if (model.type === "Open Frame") {
            removeFromOpenFrame(
              dispatch,
              model as TOpenFrame,
              ui.openFrameUI,
              item.name
            );
            handleClose();
          }
        },
      })
    );
  }

  function handleClose() {
    dispatch(selectModelItem());
  }

  return item ? (
    <>
      <div className={"model-item-drawer"}>
        <div className={"header"}>
          <div className={"d-flex f-center"}>
            <Icon icon="info-sign" className={"m-5"} />
            <h2 className={"no-m"}>
              Element name: {item.name} of {item.model}
            </h2>
          </div>
          <Button
            large
            minimal
            icon={"cross"}
            onClick={handleClose}
            intent={"danger"}
          />
        </div>
        <div className={"body"}>
          <Tree
            contents={nodes}
            onNodeClick={handleNodeClick}
            onNodeCollapse={handleNodeCollapse}
            onNodeExpand={handleNodeExpand}
          />
        </div>
        <Button
          large
          fill
          text={"Remove"}
          intent={"danger"}
          onClick={handleRemove}
          disabled={
            models.find((m) => m.name === item.model)?.type !== "Open Frame" &&
            models.find((m) => m.name === item.model)?.type !== "ROAD" 
          }
        />
      </div>
      (
      {isColor && (
        <CustomDlg
          zIndex={3}
          title="Color"
          onClose={() => setIsColor(false)}
          body={
            <SketchPicker
              color={color}
              disableAlpha={true}
              onChange={(color) => setColor(color.hex)}
            />
          }
          actions={
            <Button
              text={"Save"}
              intent={"primary"}
              onClick={() => {
                if (!model || !type) return;
                dispatch(
                  changeModel({
                    ...model,
                    palette: {
                      ...((model as TOpenFrame).palette ?? {}),
                      [type]: color,
                    },
                  } as TOpenFrame)
                );
              }}
            />
          }
        />
      )}
      )
    </>
  ) : null;
}
