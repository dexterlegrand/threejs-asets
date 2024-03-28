import { Button } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Vector3 } from "three";
import { ApplicationState } from "../../../../store";
import { changeProjectAction } from "../../../../store/main/actions";
import {
  TAccessoryGroupOF,
  TBeamElement,
  TBeamOF,
  TBoldedConn,
  TCantileverOF,
  TCBasePlateOF,
  TColumnOF,
  TCSpliceFlangeOF,
  THorizontalBracingOF,
  TKneeBracingOF,
  TOpenFrame,
  TPipeOF,
  TPlatformOF,
  TRBasePlateOF,
  TRSpliceFlangeOF,
  TStaircaseOF,
  TVerticalBracingOF,
} from "../../../../store/main/openFrameTypes";
import {
  addEventAction,
  changeProjectRequestProgressAction,
  changeUIAction,
} from "../../../../store/ui/actions";
import {
  getBeamElementsOfModel,
  getOFModels,
  updateConnections,
} from "../../../3d-models/openFrame";
import {
  fixVectorByOrientation,
  getCurrentProject,
  getCurrentUI,
  getDirection,
  getElementByName,
  getIndexName,
  getNextId,
  getOrientationByDirection,
  getSimpleDirection,
  localToGlobal,
  roundM,
} from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import GenericTable, {
  TDataField,
  THeader,
} from "../../../common/table/GenericTable";
import { Direction2, SimpleDirection } from "../../../../store/main/types";
import { ProjectUI } from "../../../../store/ui/types";

type Props = {
  onClose: () => any;
};

export default function Connecting({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const dispatch = useDispatch();

  const OFs = useMemo(() => {
    return getOFModels(project);
  }, [project?.models]);

  const rows: TDataField[] = useMemo(() => {
    return getDataFields(OFs, (modelA, modelB) => {
      if (!ui || !project) return;
      dispatch(changeProjectRequestProgressAction(project.name, "combining"));
      combineModels(ui, OFs, modelA, modelB)
        .then((res) => {
          if (!res) {
            dispatch(
              addEventAction(
                `Combination of ${modelA} and ${modelB} was canceled. No results`,
                "danger"
              )
            );
            return;
          }
          dispatch(
            changeProjectAction({
              ...project!,
              models: project!.models
                .filter((m) => m.name !== modelB)
                .map((m) => (m.name === modelA ? res.model : m)),
            })
          );
          dispatch(changeUIAction(res.ui));
          dispatch(
            addEventAction(
              `Models ${modelA} and ${modelB} have been successfully combined`,
              "success"
            )
          );
        })
        .catch((err) => {
          console.error(err);
          dispatch(
            addEventAction(
              `Combination of ${modelA} and ${modelB} got error`,
              "danger"
            )
          );
        })
        .finally(() => {
          dispatch(
            changeProjectRequestProgressAction(project.name, "combining", false)
          );
        });
    });
  }, [OFs, ui]);

  return (
    <CustomDlg
      zIndex={2}
      title="Connecting models"
      isMinimize={true}
      onClose={onClose}
      body={
        <div className="d-flex f-column f-grow">
          <div className="hr" />
          <GenericTable
            inProgress={ui?.requests?.combining}
            header={header}
            dataFields={rows}
          />
        </div>
      }
    />
  );
}

const header: THeader = {
  rows: [{ columns: [{ title: "Models" }, { title: "Action" }] }],
};

function getDataFields(
  models: TOpenFrame[],
  onConnect: (modelA: string, modelB: string) => any
): TDataField[] {
  const dataFields: TDataField[] = [];
  const nodesMap: Map<string, Vector3[]> = new Map();
  for (const model of models) {
    const nodes: Vector3[] = getNodes(model);
    nodesMap.set(model.name, nodes);
  }
  let i = 0;
  let j = 0;
  while (i < models.length) {
    if (i === j) {
      j++;
      continue;
    }
    const modelNameA = models[i]?.name;
    const modelNameB = models[j]?.name;
    if (!modelNameB) {
      i++;
      j = 0;
      continue;
    }
    const first = nodesMap.get(modelNameA);
    const second = nodesMap.get(modelNameB);
    if (first && second && first.some((a) => second.some((b) => a.equals(b)))) {
      dataFields.push({
        id: dataFields.length,
        fields: [
          { type: "CELL", value: `${modelNameA} - ${modelNameB}` },
          {
            type: "CUSTOM",
            element: (
              <Button
                text="Combine"
                intent="primary"
                onClick={() => onConnect(modelNameA, modelNameB)}
              />
            ),
          },
        ],
      });
    }
    j++;
  }
  return dataFields;
}

function getNodes(model: TOpenFrame): Vector3[] {
  let nodes: Vector3[] = getElementsNodes(model, model.columns, []);
  nodes = getElementsNodes(model, model.beams, nodes);
  nodes = getElementsNodes(model, model.cantilevers, nodes);
  return nodes;
}

function getElementsNodes(
  model: TOpenFrame,
  elements: TBeamElement[],
  nodes: Vector3[]
): Vector3[] {
  const newNodes: Vector3[] = [...nodes];
  for (const item of elements) {
    const start = localToGlobal(model.startPos, item.startPos, model.direction);
    start.set(roundM(start.x), roundM(start.y), roundM(start.z));
    const end = localToGlobal(model.startPos, item.endPos, model.direction);
    end.set(roundM(end.x), roundM(end.y), roundM(end.z));
    if (!newNodes.some((n) => n.equals(start))) newNodes.push(start);
    if (!newNodes.some((n) => n.equals(end))) newNodes.push(end);
  }
  return newNodes;
}

async function combineModels(
  ui: ProjectUI,
  models: TOpenFrame[],
  modelA: string,
  modelB: string
) {
  const firstModel = getElementByName(models, modelA);
  const secondModel = getElementByName(models, modelB);
  if (!firstModel || !secondModel) return;
  const namesMap: Map<string, string> = new Map();
  let changed: TOpenFrame = { ...firstModel };
  let openFrameUI = { ...ui.openFrameUI };
  const diff = secondModel.startPos.clone().sub(firstModel.startPos);
  const firstAngle = getOrientationByDirection(firstModel.direction);
  const secondAngle = getOrientationByDirection(secondModel.direction);

  const fixVector = (v: Vector3) => {
    const fixed = v.clone();
    fixed.copy(fixVectorByOrientation(new Vector3(), fixed, secondAngle));
    fixed.copy(fixVectorByOrientation(new Vector3(), fixed, firstAngle));
    fixed.set(
      roundM(fixed.x + diff.x),
      roundM(fixed.y + diff.y),
      roundM(fixed.z + diff.z)
    );
    return fixed;
  };

  for (const item of secondModel.columns) {
    const id = getNextId(changed.columns);
    const name = `C${getIndexName(changed.columns, "C")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const pos = fixVector(item.pos);
    const newItem: TColumnOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      frame: "",
      startPos,
      endPos,
      pos,
    };
    changed = { ...changed, columns: [...changed.columns, newItem] };
  }
  for (const item of secondModel.beams) {
    const id = getNextId(changed.beams);
    const name = `B${getIndexName(changed.beams, "B")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: TBeamOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      direction: getSimpleDirection(startPos, endPos) as SimpleDirection,
      frame: "",
      startPos,
      endPos,
    };
    changed = { ...changed, beams: [...changed.beams, newItem] };
  }
  for (const item of secondModel.cantilevers) {
    const id = getNextId(changed.cantilevers);
    const name = `CNT${getIndexName(changed.cantilevers, "CNT")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: TCantileverOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      direction: getDirection(startPos, endPos) as Direction2,
      frame: "",
      startPos,
      endPos,
    };
    changed = { ...changed, cantilevers: [...changed.cantilevers, newItem] };
  }
  for (const item of secondModel.verticalBracings) {
    const id = getNextId(changed.verticalBracings);
    const name = `VB${getIndexName(changed.verticalBracings, "VB")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: TVerticalBracingOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      frame: "",
      startPos,
      endPos,
    };
    changed = {
      ...changed,
      verticalBracings: [...changed.verticalBracings, newItem],
    };
  }
  for (const item of secondModel.horizontalBracings) {
    const id = getNextId(changed.horizontalBracings);
    const name = `HB${getIndexName(changed.horizontalBracings, "HB")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: THorizontalBracingOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      frame: "",
      startPos,
      endPos,
    };
    changed = {
      ...changed,
      horizontalBracings: [...changed.horizontalBracings, newItem],
    };
  }
  for (const item of secondModel.kneeBracings) {
    const id = getNextId(changed.kneeBracings);
    const name = `KB${getIndexName(changed.kneeBracings, "KB")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: TKneeBracingOF = {
      ...item,
      id,
      name,
      startConnected: [],
      connected: [],
      endConnected: [],
      frame: "",
      startPos,
      endPos,
    };
    changed = {
      ...changed,
      kneeBracings: [...changed.kneeBracings, newItem],
    };
  }
  for (const item of secondModel.circularBP) {
    const id = getNextId(changed.circularBP);
    const name = `CBP${getIndexName(changed.circularBP, "CBP")}`;
    namesMap.set(item.name, name);
    const newItem: TCBasePlateOF = {
      ...item,
      id,
      name,
      frame: "",
      // @ts-ignore
      column: namesMap.get(item.column),
    };
    changed = {
      ...changed,
      circularBP: [...changed.circularBP, newItem],
    };
  }
  for (const item of secondModel.rectangularBP) {
    const id = getNextId(changed.rectangularBP);
    const name = `RBP${getIndexName(changed.rectangularBP, "RBP")}`;
    namesMap.set(item.name, name);
    const newItem: TRBasePlateOF = {
      ...item,
      id,
      name,
      frame: "",
      // @ts-ignore
      column: namesMap.get(item.column),
    };
    changed = {
      ...changed,
      rectangularBP: [...changed.rectangularBP, newItem],
    };
  }
  for (const item of secondModel.circularSF) {
    const id = getNextId(changed.circularSF);
    const name = `CSF${getIndexName(changed.circularSF, "CSF")}`;
    namesMap.set(item.name, name);
    const newItem: TCSpliceFlangeOF = {
      ...item,
      id,
      name,
      // @ts-ignore
      column: namesMap.get(item.column),
    };
    changed = {
      ...changed,
      circularSF: [...changed.circularSF, newItem],
    };
  }
  for (const item of secondModel.rectangularSF) {
    const id = getNextId(changed.rectangularSF);
    const name = `RSF${getIndexName(changed.rectangularSF, "RSF")}`;
    namesMap.set(item.name, name);
    const newItem: TRSpliceFlangeOF = {
      ...item,
      id,
      name,
      // @ts-ignore
      column: namesMap.get(item.column),
    };
    changed = {
      ...changed,
      rectangularSF: [...changed.rectangularSF, newItem],
    };
  }
  for (const item of secondModel.staircases) {
    const id = getNextId(changed.staircases);
    const name = `FL${getIndexName(changed.staircases, "FL")}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const endPos = fixVector(item.endPos);
    const newItem: TStaircaseOF = {
      ...item,
      id,
      name,
      frame: "",
      startConnected: [],
      connected: [],
      endConnected: [],
      startPos,
      endPos,
    };
    changed = {
      ...changed,
      staircases: [...changed.staircases, newItem],
    };
  }
  for (const item of secondModel.platforms) {
    const id = getNextId(changed.platforms);
    const name = `P${getIndexName(changed.platforms, "P")}`;
    namesMap.set(item.name, name);
    const newItem: TPlatformOF = {
      ...item,
      id,
      name,
      // @ts-ignore
      from: namesMap.get(item.from),
      // @ts-ignore
      to: namesMap.get(item.to),
    };
    changed = {
      ...changed,
      platforms: [...changed.platforms, newItem],
    };
  }
  for (const item of secondModel.accessories) {
    const id = getNextId(changed.accessories);
    const name = `${changed.name}-${item.type}${getIndexName(
      changed.accessories,
      `${changed.name}-${item.type}`
    )}`;
    namesMap.set(item.name, name);
    const startPos = fixVector(item.startPos);
    const newItem: TAccessoryGroupOF = {
      ...item,
      id,
      name,
      startPos,
      elements: item.elements.map((el) => {
        return {
          ...el,
          beams: el.beams.map((b) => namesMap.get(b) ?? ""),
          columns: el.columns.map((c) => namesMap.get(c) ?? ""),
          frame: namesMap.get(el.frame) ?? "",
        };
      }),
    };
    changed = {
      ...changed,
      accessories: [...changed.accessories, newItem],
    };
  }
  if (secondModel.beamToBeamConnections)
    for (const item of secondModel.beamToBeamConnections) {
      const id = getNextId(changed.beamToBeamConnections);
      const name = `BBC${getIndexName(
        changed.beamToBeamConnections ?? [],
        "BBC"
      )}`;
      namesMap.set(item.name, name);
      const parent = item.parent ? namesMap.get(item.parent) : undefined;
      const newItem: TBoldedConn = {
        ...item,
        id,
        name,
        model: changed.name,
        parent,
      };
      changed = {
        ...changed,
        beamToBeamConnections: [
          ...(changed.beamToBeamConnections ?? []),
          newItem,
        ],
      };
      openFrameUI = {
        ...openFrameUI,
        beamToBeamConnections: openFrameUI.beamToBeamConnections?.map((ui) => {
          return ui.id === item.id
            ? { ...ui, id, name, model: changed.name, parent }
            : ui;
        }),
      };
    }
  if (secondModel.beamToColumnConnections)
    for (const item of secondModel.beamToColumnConnections) {
      const id = getNextId(changed.beamToColumnConnections);
      const name = `BCC${getIndexName(
        changed.beamToColumnConnections ?? [],
        "BCC"
      )}`;
      namesMap.set(item.name, name);
      const parent = item.parent ? namesMap.get(item.parent) : undefined;
      const newItem: TBoldedConn = {
        ...item,
        id,
        name,
        model: changed.name,
        parent,
      };
      changed = {
        ...changed,
        beamToColumnConnections: [
          ...(changed.beamToColumnConnections ?? []),
          newItem,
        ],
      };
      openFrameUI = {
        ...openFrameUI,
        beamToColumnConnections: openFrameUI.beamToColumnConnections?.map(
          (ui) => {
            return ui.id === item.id
              ? { ...ui, id, name, model: changed.name, parent }
              : ui;
          }
        ),
      };
    }
  if (secondModel.hBracingConnections)
    for (const item of secondModel.hBracingConnections) {
      const id = getNextId(changed.hBracingConnections);
      const name = `HBC${getIndexName(
        changed.hBracingConnections ?? [],
        "HBC"
      )}`;
      namesMap.set(item.name, name);
      const parent = item.parent ? namesMap.get(item.parent) : undefined;
      const newItem: TBoldedConn = {
        ...item,
        id,
        name,
        model: changed.name,
        parent,
      };
      changed = {
        ...changed,
        hBracingConnections: [...(changed.hBracingConnections ?? []), newItem],
      };
      openFrameUI = {
        ...openFrameUI,
        hBracingConnections: openFrameUI.hBracingConnections?.map((ui) => {
          return ui.id === item.id
            ? { ...ui, id, name, model: changed.name, parent }
            : ui;
        }),
      };
    }
  if (secondModel.vBracingConnections)
    for (const item of secondModel.vBracingConnections) {
      const id = getNextId(changed.vBracingConnections);
      const name = `VBC${getIndexName(
        changed.vBracingConnections ?? [],
        "VBC"
      )}`;
      namesMap.set(item.name, name);
      const parent = item.parent ? namesMap.get(item.parent) : undefined;
      const newItem: TBoldedConn = {
        ...item,
        id,
        name,
        model: changed.name,
        parent,
      };
      changed = {
        ...changed,
        vBracingConnections: [...(changed.vBracingConnections ?? []), newItem],
      };
      openFrameUI = {
        ...openFrameUI,
        vBracingConnections: openFrameUI.vBracingConnections?.map((ui) => {
          return ui.id === item.id
            ? { ...ui, id, name, model: changed.name, parent }
            : ui;
        }),
      };
    }
  if (secondModel.kBracingConnections)
    for (const item of secondModel.kBracingConnections) {
      const id = getNextId(changed.kBracingConnections);
      const name = `KBC${getIndexName(
        changed.kBracingConnections ?? [],
        "KBC"
      )}`;
      namesMap.set(item.name, name);
      const parent = item.parent ? namesMap.get(item.parent) : undefined;
      const newItem: TBoldedConn = {
        ...item,
        id,
        name,
        model: changed.name,
        parent,
      };
      changed = {
        ...changed,
        kBracingConnections: [...(changed.kBracingConnections ?? []), newItem],
      };
      openFrameUI = {
        ...openFrameUI,
        kBracingConnections: openFrameUI.kBracingConnections?.map((ui) => {
          return ui.id === item.id
            ? { ...ui, id, name, model: changed.name, parent }
            : ui;
        }),
      };
    }
  for (const item of secondModel.pipes) {
    const id = getNextId(changed.pipes);
    const name = `PP${getIndexName(changed.pipes ?? [], "PP")}`;
    namesMap.set(item.name, name);
    const newItem: TPipeOF = {
      ...item,
      id,
      name,
      B1: namesMap.get(item.B1) ?? "",
      B2: namesMap.get(item.B2) ?? "",
      supports: item.supports.map((s) => {
        return { ...s, beam: s.beam ? namesMap.get(s.beam) : undefined };
      }),
    };
    changed = {
      ...changed,
      pipes: [...changed.pipes, newItem],
    };
  }

  openFrameUI = {
    ...openFrameUI,
    additionalBeams: {
      ...openFrameUI.additionalBeams,
      beamToBeam: openFrameUI.additionalBeams.beamToBeam
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                from: item.from ? namesMap.get(item.from) : undefined,
                to: item.to ? namesMap.get(item.to) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      cantilever: openFrameUI.additionalBeams.cantilever
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
                elevation: roundM(item.elevation + diff.y),
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      columns: openFrameUI.additionalBeams.columns
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                lowerBeam: item.lowerBeam
                  ? namesMap.get(item.lowerBeam)
                  : undefined,
                upperBeam: item.upperBeam
                  ? namesMap.get(item.upperBeam)
                  : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      columnToBeam: openFrameUI.additionalBeams.columnToBeam
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                beam: item.beam ? namesMap.get(item.beam) : undefined,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      columnToColumn: openFrameUI.additionalBeams.columnToColumn
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      kneeBracings: openFrameUI.additionalBeams.kneeBracings
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
                beam: item.beam ? namesMap.get(item.beam) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      planBracings: openFrameUI.additionalBeams.planBracings
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                fromBeam: item.fromBeam
                  ? namesMap.get(item.fromBeam)
                  : undefined,
                toBeam: item.toBeam ? namesMap.get(item.toBeam) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      staircases: openFrameUI.additionalBeams.staircases
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                from:
                  item.from === "Ground"
                    ? item.from
                    : item.from
                    ? namesMap.get(item.from)
                    : undefined,
                to: item.to ? namesMap.get(item.to) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      verticalBracings: openFrameUI.additionalBeams.verticalBracings
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                fromBeam: item.fromBeam
                  ? namesMap.get(item.fromBeam)
                  : undefined,
                fromColumn: item.fromColumn
                  ? namesMap.get(item.fromColumn)
                  : undefined,
                toBeam: item.toBeam ? namesMap.get(item.toBeam) : undefined,
                toColumn: item.toColumn
                  ? namesMap.get(item.toColumn)
                  : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    basePlates: {
      ...openFrameUI.basePlates,
      circular: openFrameUI.basePlates.circular
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      rectangular: openFrameUI.basePlates.rectangular
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    frames: {
      ...openFrameUI.frames,
      relocations: openFrameUI.frames.relocations
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                frame: item.frame ? namesMap.get(item.frame) : undefined,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    spliceFlanges: {
      ...openFrameUI.spliceFlanges,
      circular: openFrameUI.spliceFlanges.circular
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      rectangular: openFrameUI.spliceFlanges.rectangular
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                column: item.column ? namesMap.get(item.column) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    platforms: openFrameUI.platforms
      .map((item) => {
        return item.model === secondModel.name
          ? {
              ...item,
              model: changed.name,
              name: namesMap.get(item.name) ?? "",
              from: item.from ? namesMap.get(item.from) : undefined,
              to: item.to ? namesMap.get(item.to) : undefined,
            }
          : item;
      })
      .filter((item) => item.model !== secondModel.name),
    pipes: {
      items: openFrameUI.pipes.items
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                name: namesMap.get(item.name) ?? "",
                B1: item.B1 ? namesMap.get(item.B1) : undefined,
                B2: item.B2 ? namesMap.get(item.B2) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      supports: openFrameUI.pipes.supports
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                pipe: item.pipe ? namesMap.get(item.pipe) : undefined,
                beam: item.beam ? namesMap.get(item.beam) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    members: {
      beams: openFrameUI.members.beams
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                element: item.element ? namesMap.get(item.element) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      columns: openFrameUI.members.columns
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                element: item.element ? namesMap.get(item.element) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      releases: openFrameUI.members.releases
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                element: item.element ? namesMap.get(item.element) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
    },
    accessories: openFrameUI.accessories
      .map((item) => {
        return item.model === secondModel.name
          ? {
              ...item,
              model: changed.name,
              beam: item.beam ? namesMap.get(item.beam) : undefined,
              name: namesMap.get(item.name) ?? "",
            }
          : item;
      })
      .filter((item) => item.model !== secondModel.name),
    loadingsUI: {
      ...openFrameUI.loadingsUI,
      deadLoadUI: {
        ...openFrameUI.loadingsUI.deadLoadUI,
        loads: openFrameUI.loadingsUI.deadLoadUI.loads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  element: item.element
                    ? namesMap.get(item.element)
                    : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
        accessoriesTPLoads: openFrameUI.loadingsUI.deadLoadUI.accessoriesTPLoads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  group: item.group ? namesMap.get(item.group) : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
        accessoriesFPLoads: openFrameUI.loadingsUI.deadLoadUI.accessoriesFPLoads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  group: item.group ? namesMap.get(item.group) : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
        accessoriesCTLoads: openFrameUI.loadingsUI.deadLoadUI.accessoriesCTLoads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  group: item.group ? namesMap.get(item.group) : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
      },
      liveLoadUI: {
        ...openFrameUI.loadingsUI.liveLoadUI,
        loads: openFrameUI.loadingsUI.liveLoadUI.loads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  element: item.element
                    ? namesMap.get(item.element)
                    : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
      },
      equipmentLoadUI: openFrameUI.loadingsUI.equipmentLoadUI
        .map((item) => {
          return item.model === secondModel.name
            ? {
                ...item,
                model: changed.name,
                element: item.element ? namesMap.get(item.element) : undefined,
              }
            : item;
        })
        .filter((item) => item.model !== secondModel.name),
      pipingLoadsUI: {
        ...openFrameUI.loadingsUI.pipingLoadsUI,
        blanketLoads: openFrameUI.loadingsUI.pipingLoadsUI.blanketLoads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  from: item.from ? namesMap.get(item.from) : undefined,
                  to: item.to ? namesMap.get(item.to) : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
        directLoads: openFrameUI.loadingsUI.pipingLoadsUI.directLoads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  element: item.element
                    ? namesMap.get(item.element)
                    : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
      },
      seismicLoadsUI: {
        ...openFrameUI.loadingsUI.seismicLoadsUI,
        seismicLoads: openFrameUI.loadingsUI.seismicLoadsUI.seismicLoads
          .map((item) => {
            return item.model === secondModel.name
              ? { ...item, model: changed.name }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
      },
      windLoadUI: {
        ...openFrameUI.loadingsUI.windLoadUI,
        loads: openFrameUI.loadingsUI.windLoadUI.loads
          .map((item) => {
            return item.model === secondModel.name
              ? {
                  ...item,
                  model: changed.name,
                  element: item.element
                    ? namesMap.get(item.element)
                    : undefined,
                }
              : item;
          })
          .filter((item) => item.model !== secondModel.name),
      },
    },
  };

  let i = 0;
  while (i < changed.columns.length) {
    const item = changed.columns[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.beams.length) {
    const item = changed.beams[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.cantilevers.length) {
    const item = changed.cantilevers[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.cantilevers.length) {
    const item = changed.cantilevers[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.staircases.length) {
    const item = changed.staircases[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.horizontalBracings.length) {
    const item = changed.horizontalBracings[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.verticalBracings.length) {
    const item = changed.verticalBracings[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }
  i = 0;
  while (i < changed.kneeBracings.length) {
    const item = changed.kneeBracings[i];
    if (!item) {
      i++;
      continue;
    }
    changed = updateConnections(changed, item, () => {});
    i++;
  }

  changed = {
    ...changed,
    columns: changed.columns.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    beams: changed.beams.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    cantilevers: changed.cantilevers.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    verticalBracings: changed.verticalBracings.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    horizontalBracings: changed.horizontalBracings.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    kneeBracings: changed.kneeBracings.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
    staircases: changed.staircases.map((item) => {
      if (item.frame) return item;
      const elements = getBeamElementsOfModel(changed);
      const connected = elements.find(
        (el) => el.frame && item.startConnected.includes(el.name)
      );
      return {
        ...item,
        frame: connected?.frame ?? changed.frames[0].name,
      };
    }),
  };

  return { model: changed, ui: { ...ui, openFrameUI } };
}
