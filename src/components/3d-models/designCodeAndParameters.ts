import {
  AdditionalLoad,
  BlanketLoad,
  ChristmasTreeAccessory,
  CircularBP,
  CircularSF,
  DL_CTree,
  DL_FPost,
  FPostAccessory,
  LC_Condition,
  LoadCombination,
  Loadings,
  Orientation,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  PipeRackColumn,
  PipeRackPortal,
  Project,
  RectangularBP,
  RectangularSF,
  Releases,
  Side,
  TPostAccessory,
  AccessoryElement,
} from "../../store/main/types";
import {
  CylinderBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Vector2,
  Vector3,
} from "three";
import {
  fixValueToNumber,
  fixVectorByOrientation,
  getRotationByLegs,
  localToGlobal,
  MtoMM,
  radToDeg,
  getProfileLibrary,
  roundM,
  round,
  checkRange,
  replaceSplitNumber,
  vector3FromPoint,
} from "./utils";
import { deg180InRad, deg90InRad } from "../../store/main/constants";
import { AvailableSectionListUI } from "../../store/ui/types";
import {
  RolledSection,
  Material,
  Section,
  ShapeType,
  CombinedSection,
  CombinationType,
  DataState,
} from "../../store/data/types";
import {
  splitColumns,
  splitBeams,
  splitCantilevers,
  getHBracingsWithPositions,
  getAccessoriesElements,
  getPipes,
  getAllElements,
  sortByMiddlePoint,
} from "./pipe-rack/pipeRackUtils";

export type Node = {
  nodeNumber: number;
  x: number;
  y: number;
  z: number;
  memberNames: string; // all members that are connected with this node
};

export type BeamElement = {
  label: number;
  nodes: number[];
  bodyLoads: string[];
  boundaryLoads: any[];
  section: number;
  zAxis: number[];
  beamHinges: boolean[];
};

export type BeamNode = {
  label: number;
  coordinates: number[];
  loads: [];
  boundaryConditionsOne: "Fixed" | "Pinned" | "";
};

export type Member = {
  label: number;
  name: string;
  type: string | undefined;
  profileName?: string;
  countryCode: string | null;
  profileType: string | null;
  length: number;
  thickness: number;
  width: number;

  FabProfType: ShapeType | null;
  FabProfDepth: number | null;
  FabProfWidth: number | null;
  FabProfTFthk: number | null;
  FabProfBFthk: number | null;
  FabProfWebThk: number | null;
  // if shape O
  FabProfOd: number | null;
  FabProfID: number | null;

  RolWthPltCountryCode: string | null;
  RolWthPltProfile: string | null;
  RolWthPltTPWidth: number | null;
  RolWthPltTPthk: number | null;
  RolWthPltBPWidth: number | null;
  RolWthPltBPthk: number | null;

  pipeouterdiameter: number | null;
  pipewallthickness: number | null;
  pipematerial: any | null;

  combination: CombinationType | null;
  clearGap: number | null;
};

type FireProofLoad = {
  fpDensity: number;
  fpThickness: number;
  fpHeight: number;
  fpApp: "All elements" | "Only Columns and Beams";
  fpDf: number;
  boxFpList: { label: number; length: number }[];
  profFpList: { label: number; length: number }[];
};

type DeadLoad = {
  selfWeightFactor: number;
  platformDeadLoadIntensity: number;
  fireProofLoad: FireProofLoad;
  additionalLoad: {
    udl: any;
    pointLoad: any;
  };
  accessories: any;
};

type LiveLoad = {
  platformLiveLoadIntensity: number;
  additionalLoad: {
    udl: any;
    pointLoad: any;
  };
};

type LoadComb = {
  number: number;
  limitState: string;
  loadCondition: LC_Condition;
  deadLoad: number;
  liveLoad: number;
  temperatureLoad: number;
  pipingEmptyLoad: number;
  pipingTestingLoad: number;
  pipingOperatingLoad: number;
  pipingThermalAnchorLoad: number;
  pipingThermalFrictionLoad: number;
  equipmentEmptyLoad: number;
  equipmentTestingLoad: number;
  equipmentOperatingLoad: number;
  windLoadPlusX0Deg: number;
  windLoadPlusXMinusZ45Deg: number;
  windLoadMinusZ90Deg: number;
  windLoadMinusZMinusX135Deg: number;
  windLoadMinusX180Deg: number;
  windLoadMinusXPlusZ225Deg: number;
  windLoadPlusZ270Deg: number;
  windLoadPlusZPlusX315Deg: number;
  seismicX: number;
  seismicZ: number;
  seismicY: number;
};

export function getJSONForDesignCodesAndParameters(
  scene: Scene,
  project: Project,
  model: PipeRack,
  models: PipeRack[]
) {
  let nodes: Node[] = [];
  const beamElements: BeamElement[] = [];
  let members: Member[] = [];
  let beamNodes: BeamNode[] = [];

  const deadLoad = getDeadLoad(project.loadings);
  const liveLoad = getLiveLoad(project.loadings);
  const windLoads = getElementsForWindLoads(
    model,
    project.loadings,
    getAllElements(models)
  );
  const pipingLoad = getPipingLoad();
  const equipmentLoad = getEquipmentLoad();

  const prBlanketLoads = project.loadings.blanketLoads.filter(
    (item) =>
      item.pr === model.name &&
      item.fromPortal &&
      item.toPortal &&
      item.tier !== undefined
  );

  const elements = [
    ...splitColumns(model.columns),
    ...splitBeams(model.beams),
    ...splitCantilevers(model.cantilevers),
    ...model.vBracings,
    ...getHBracingsWithPositions(model.hBracings, [
      ...model.beams,
      ...model.cantilevers,
    ]),
    ...getAccessoriesElements(model.accessories, model.portals),
  ]
    .map((el) => ({
      ...el,
      startPos: localToGlobal(model.startPos, el.startPos, model.direction),
      endPos: localToGlobal(model.startPos, el.endPos, model.direction),
    }))
    .sort((a, b) => sortByMiddlePoint(a, b));
  // creating nodes
  let vectors: Vector3[] = [];
  elements?.forEach((el) => {
    if (!vectors.some((v) => v.equals(el.startPos)))
      vectors = [...vectors, el.startPos];
    if (!vectors.some((v) => v.equals(el.endPos)))
      vectors = [...vectors, el.endPos];
  });
  vectors
    .sort((a, b) =>
      a.y === b.y ? (a.z === b.z ? a.x - b.x : a.z - b.z) : a.y - b.y
    )
    .forEach((v, i) => {
      const x = MtoMM(v.x);
      const y = MtoMM(v.y);
      const z = MtoMM(v.z);
      nodes = [...nodes, { nodeNumber: i + 1, x, y, z, memberNames: "" }];
      beamNodes = [
        ...beamNodes,
        {
          label: i + 1,
          coordinates: [x, y, z],
          loads: [],
          boundaryConditionsOne: "",
        },
      ];
    });

  const pipesElements = getPipes(model.pipes, model.beams)
    .map((el) => ({
      ...el,
      startPos: localToGlobal(model.startPos, el.startPos, model.direction),
      endPos: localToGlobal(model.startPos, el.endPos, model.direction),
    }))
    .sort((a, b) => sortByMiddlePoint(a, b));
  let pipeVectors: Vector3[] = [];
  pipesElements.forEach((el) => {
    if (
      !pipeVectors.some((v) => v.equals(el.startPos)) &&
      !vectors.some((v) => v.equals(el.startPos))
    )
      pipeVectors = [...pipeVectors, el.startPos];
    if (
      !pipeVectors.some((v) => v.equals(el.endPos)) &&
      !vectors.some((v) => v.equals(el.endPos))
    )
      pipeVectors = [...pipeVectors, el.endPos];
  });
  pipeVectors
    .sort((a, b) =>
      a.y === b.y ? (a.z === b.z ? a.x - b.x : a.z - b.z) : a.y - b.y
    )
    .forEach((v) => {
      const x = MtoMM(v.x);
      const y = MtoMM(v.y);
      const z = MtoMM(v.z);
      nodes = [
        ...nodes,
        { nodeNumber: nodes.length + 1, x, y, z, memberNames: "" },
      ];
      beamNodes = [
        ...beamNodes,
        {
          label: nodes.length,
          coordinates: [x, y, z],
          loads: [],
          boundaryConditionsOne: "",
        },
      ];
    });

  const allElements: any[] = [...elements, ...pipesElements];
  // creating others
  allElements.forEach((item) => {
    // start node
    const node1 = nodes.find(
      (node) =>
        node.x === MtoMM(item.startPos.x) &&
        node.y === MtoMM(item.startPos.y) &&
        node.z === MtoMM(item.startPos.z)
    );
    // end node
    const node2 = nodes.find(
      (node) =>
        node.x === MtoMM(item.endPos.x) &&
        node.y === MtoMM(item.endPos.y) &&
        node.z === MtoMM(item.endPos.z)
    );
    nodes = nodes.map((node) => {
      if (node.nodeNumber === node1!.nodeNumber) {
        return {
          ...node1,
          memberNames: node1!.memberNames
            ? `${node1!.memberNames},${
                item.type === "PipeConnector" ? item.beamName : item.name
              }`
            : item.name,
        } as Node;
      } else if (node.nodeNumber === node2!.nodeNumber) {
        return {
          ...node2,
          memberNames: node2!.memberNames
            ? `${node2!.memberNames},${
                item.type === "PipeConnector" ? item.pipeName : item.name
              }`
            : item.name,
        } as Node;
      } else return node;
    });

    if (item.type === "PipeRackColumn" && item.onGround) {
      const portal = model.portals.find(
        (portal) => portal.name === item.parent
      );
      if (portal) {
        beamNodes = beamNodes.map((bNode) => {
          if (bNode.label === node1!.nodeNumber) {
            return {
              ...bNode,
              boundaryConditionsOne:
                portal.supportType === "Fix" ? "Fixed" : "Pinned",
            };
          } else return bNode;
        });
      }
    }

    const zAxis = new Vector3();

    if (item.type === "PipeConnector") {
      const start = new Vector3(node1!.x, node1!.y, node1!.z);
      const end = new Vector3(node2!.x, node2!.y, node2!.z);
      const pos = new Vector3().addVectors(start, end).divideScalar(2);
      const pc = new Mesh(
        new CylinderBufferGeometry(1, 1, start.distanceTo(end)),
        new MeshBasicMaterial()
      );
      pc.position.add(pos);
      pc.lookAt(end);
      pc.rotateX(deg90InRad);
      pc.getWorldDirection(zAxis);
    } else if (item.type === "PipeItem") {
      const start = new Vector3(node1!.x, node1!.y, node1!.z);
      const end = new Vector3(node2!.x, node2!.y, node2!.z);
      const pos = new Vector3().addVectors(start, end).divideScalar(2);
      const pc = new Mesh(
        new CylinderBufferGeometry(1, 1, start.distanceTo(end))
      );
      pc.position.add(pos);
      pc.lookAt(end);
      pc.rotateY(-deg90InRad);
      pc.rotateX(deg180InRad);
      pc.getWorldDirection(zAxis);
    } else {
      scene
        .getObjectByName(model.name)
        ?.getObjectByName(item.name.replace(/\..+$/gi, ""))
        ?.getWorldDirection(zAxis);
    }

    const beamElement = getBeamElement(
      node1!.nodeNumber,
      node2!.nodeNumber,
      beamElements.length,
      [zAxis.x, zAxis.y, zAxis.z],
      item.releases
    );

    beamElements[beamElement.label - 1] = beamElement;

    members = [
      ...members,
      getMember(
        beamElement.label,
        item.name,
        item.profile,
        roundM(item.startPos.distanceTo(item.endPos)),
        item.diameter,
        item.thickness,
        item.material
      ),
    ];

    if (
      (deadLoad.fireProofLoad.fpApp === "All elements" ||
        item.type === "PipeRackColumn" ||
        item.type === "PipeRackBeam") &&
      (item.startPos.y < deadLoad.fireProofLoad.fpHeight ||
        item.endPos.y < deadLoad.fireProofLoad.fpHeight)
    ) {
      let maxValue;
      if (item.type === "PipeItem") {
        maxValue = item.diameter;
      } else {
        maxValue = Math.max(
          item.profile.bf_global ?? 0,
          item.profile.d_global ?? 0,
          item.profile.tf_global ?? 0,
          item.profile.tfb_global ?? 0,
          item.profile.tw_global ?? 0
        );
      }

      let length = item.startPos.distanceTo(item.endPos);

      if (item.endPos.y > deadLoad.fireProofLoad.fpHeight)
        length -= item.endPos.y - deadLoad.fireProofLoad.fpHeight;
      if (item.startPos.y > deadLoad.fireProofLoad.fpHeight)
        length -= item.startPos.y - deadLoad.fireProofLoad.fpHeight;

      if (maxValue <= deadLoad.fireProofLoad.fpDf) {
        deadLoad.fireProofLoad.boxFpList.push({
          label: beamElement.label,
          length: round(MtoMM(length)),
        });
      } else {
        deadLoad.fireProofLoad.profFpList.push({
          label: beamElement.label,
          length: round(MtoMM(length)),
        });
      }
    }

    // additional load
    if (item.isDeadLoadPointS) {
      deadLoad.additionalLoad.pointLoad = getPointLoad(
        deadLoad.additionalLoad.pointLoad,
        node1!,
        item.deadLoad
      );
    }
    if (item.isDeadLoadPointE) {
      deadLoad.additionalLoad.pointLoad = getPointLoad(
        deadLoad.additionalLoad.pointLoad,
        node2!,
        item.deadLoad
      );
    }
    if (item.isLiveLoadPointS) {
      liveLoad.additionalLoad.pointLoad = getPointLoad(
        liveLoad.additionalLoad.pointLoad,
        node1!,
        item.liveLoad
      );
    }
    if (item.isLiveLoadPointE) {
      liveLoad.additionalLoad.pointLoad = getPointLoad(
        liveLoad.additionalLoad.pointLoad,
        node2!,
        item.liveLoad
      );
    }
    if (item.isWindLoadPointS) {
      windLoads.additionalLoad.pointLoad = getPointLoad(
        windLoads.additionalLoad.pointLoad,
        node1!,
        item.windLoad
      );
    }
    if (item.isWindLoadPointE) {
      windLoads.additionalLoad.pointLoad = getPointLoad(
        windLoads.additionalLoad.pointLoad,
        node2!,
        item.windLoad
      );
    }
    if (item.isDirectLoadPointS) {
      const load = project.loadings.directLoads?.find(
        (dl) => dl.id === item.directLoadId
      );
      if (load) {
        pipingLoad.directLoad.emptyLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.emptyLoad.pointLoad,
            node1!,
            { Fy: load.empty_Fy } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.testingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.testingLoad.pointLoad,
            node1!,
            {
              Fx: load.test_Fx,
              Fy: load.test_Fy,
              Fz: load.test_Fz,
              Mx: load.test_Mx,
              My: load.test_My,
              Mz: load.test_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.operatingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.operatingLoad.pointLoad,
            node1!,
            {
              Fx: load.operating_Fx,
              Fy: load.operating_Fy,
              Fz: load.operating_Fz,
              Mx: load.operating_Mx,
              My: load.operating_My,
              Mz: load.operating_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalAnchorLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalAnchorLoad.pointLoad,
            node1!,
            {
              Fx: load.thermalAnchor_Fx,
              Fy: load.thermalAnchor_Fy,
              Fz: load.thermalAnchor_Fz,
              Mx: load.thermalAnchor_Mx,
              My: load.thermalAnchor_My,
              Mz: load.thermalAnchor_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalFrictionLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalFrictionLoad.pointLoad,
            node1!,
            {
              Fx: load.thermalFriction_Fx,
              Fy: load.thermalFriction_Fy,
              Fz: load.thermalFriction_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadX.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadX.pointLoad,
            node1!,
            {
              Fx: load.windLoadX_Fx,
              Fy: load.windLoadX_Fy,
              Fz: load.windLoadX_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadZ.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadZ.pointLoad,
            node1!,
            {
              Fx: load.windLoadZ_Fx,
              Fy: load.windLoadZ_Fy,
              Fz: load.windLoadZ_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad,
            node1!,
            {
              Fx: load.surgeLoad_Fx,
              Fy: load.surgeLoad_Fy,
              Fz: load.surgeLoad_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.snowIceLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.snowIceLoad.pointLoad,
            node1!,
            { Fy: load.snowLoad } as AdditionalLoad,
            load.lineNo
          ),
        };
      }
    }
    if (item.isDirectLoadPointE) {
      const load = project.loadings.directLoads?.find(
        (dl) => dl.id === item.directLoadId
      );
      if (load) {
        pipingLoad.directLoad.emptyLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.emptyLoad.pointLoad,
            node2!,
            { Fy: load.empty_Fy } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.testingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.testingLoad.pointLoad,
            node2!,
            {
              Fx: load.test_Fx,
              Fy: load.test_Fy,
              Fz: load.test_Fz,
              Mx: load.test_Mx,
              My: load.test_My,
              Mz: load.test_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.operatingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.operatingLoad.pointLoad,
            node2!,
            {
              Fx: load.operating_Fx,
              Fy: load.operating_Fy,
              Fz: load.operating_Fz,
              Mx: load.operating_Mx,
              My: load.operating_My,
              Mz: load.operating_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalAnchorLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalAnchorLoad.pointLoad,
            node2!,
            {
              Fx: load.thermalAnchor_Fx,
              Fy: load.thermalAnchor_Fy,
              Fz: load.thermalAnchor_Fz,
              Mx: load.thermalAnchor_Mx,
              My: load.thermalAnchor_My,
              Mz: load.thermalAnchor_Mz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalFrictionLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalFrictionLoad.pointLoad,
            node2!,
            {
              Fx: load.thermalFriction_Fx,
              Fy: load.thermalFriction_Fy,
              Fz: load.thermalFriction_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadX.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadX.pointLoad,
            node2!,
            {
              Fx: load.windLoadX_Fx,
              Fy: load.windLoadX_Fy,
              Fz: load.windLoadX_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadZ.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadZ.pointLoad,
            node2!,
            {
              Fx: load.windLoadZ_Fx,
              Fy: load.windLoadZ_Fy,
              Fz: load.windLoadZ_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad,
            node2!,
            {
              Fx: load.surgeLoad_Fx,
              Fy: load.surgeLoad_Fy,
              Fz: load.surgeLoad_Fz,
            } as AdditionalLoad,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.snowIceLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.snowIceLoad.pointLoad,
            node2!,
            { Fy: load.snowLoad } as AdditionalLoad,
            load.lineNo
          ),
        };
      }
    }
    if (item.isEquipmentLoadS) {
      equipmentLoad.directLoad.emptyLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node1!,
        {
          Fy: item.equipmentLoad?.empty_Fy,
        } as AdditionalLoad
      );
      equipmentLoad.directLoad.testingLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node1!,
        {
          Fx: item.equipmentLoad.test_Fx,
          Fy: item.equipmentLoad.test_Fy,
          Fz: item.equipmentLoad.test_Fz,
          Mx: item.equipmentLoad.test_Mx,
          My: item.equipmentLoad.test_My,
          Mz: item.equipmentLoad.test_Mz,
        } as AdditionalLoad
      );
      equipmentLoad.directLoad.operatingLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node1!,
        {
          Fx: item.equipmentLoad.operating_Fx,
          Fy: item.equipmentLoad.operating_Fy,
          Fz: item.equipmentLoad.operating_Fz,
          Mx: item.equipmentLoad.operating_Mx,
          My: item.equipmentLoad.operating_My,
          Mz: item.equipmentLoad.operating_Mz,
        } as AdditionalLoad
      );
    }
    if (item.isEquipmentLoadE) {
      equipmentLoad.directLoad.emptyLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node2!,
        {
          Fy: item.equipmentLoad?.empty_Fy,
        } as AdditionalLoad
      );
      equipmentLoad.directLoad.testingLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node2!,
        {
          Fx: item.equipmentLoad.test_Fx,
          Fy: item.equipmentLoad.test_Fy,
          Fz: item.equipmentLoad.test_Fz,
          Mx: item.equipmentLoad.test_Mx,
          My: item.equipmentLoad.test_My,
          Mz: item.equipmentLoad.test_Mz,
        } as AdditionalLoad
      );
      equipmentLoad.directLoad.operatingLoad.pointLoad = getPointLoad(
        equipmentLoad.directLoad.emptyLoad.pointLoad,
        node2!,
        {
          Fx: item.equipmentLoad.operating_Fx,
          Fy: item.equipmentLoad.operating_Fy,
          Fz: item.equipmentLoad.operating_Fz,
          Mx: item.equipmentLoad.operating_Mx,
          My: item.equipmentLoad.operating_My,
          Mz: item.equipmentLoad.operating_Mz,
        } as AdditionalLoad
      );
    }

    if (item.isDeadLoadUDL) {
      deadLoad.additionalLoad.udl = getUDL(
        deadLoad.additionalLoad.udl,
        beamElement,
        item.deadLoad
      );
    }
    if (item.isLiveLoadUDL) {
      liveLoad.additionalLoad.udl = getUDL(
        liveLoad.additionalLoad.udl,
        beamElement,
        item.liveLoad
      );
    }
    if (item.isWindLoadUDL) {
      windLoads.additionalLoad.udl = getUDL(
        windLoads.additionalLoad.udl,
        beamElement,
        item.windLoad
      );
    }
  });

  let accessoriesItems: any[] = [];
  model.accessories
    .filter((ag: any) => ag.deadLoad)
    .forEach((ag: any) => {
      accessoriesItems = [
        ...accessoriesItems,
        ...ag.elements.map((el: AccessoryElement) => ({
          grName: ag.name,
          loadData: {
            type: ag.type,
            TPS: ag.type === "T-Post" ? ag.spacing : 0,
            TPL: ag.type === "T-Post" ? ag.deadLoad!.intensity : 0,
            TPPL:
              ag.type === "T-Post" ? (el as TPostAccessory).leftProjection : 0,
            TPPR:
              ag.type === "T-Post" ? (el as TPostAccessory).rightProjection : 0,
            FPS: ag.type === "F-Post" ? ag.spacing : 0,
            FPLL1:
              ag.type === "F-Post" ? (ag.deadLoad! as DL_FPost).intensityL1 : 0,
            FPLL2:
              ag.type === "F-Post" ? (ag.deadLoad! as DL_FPost).intensityL2 : 0,
            FPLL3:
              ag.type === "F-Post" ? (ag.deadLoad! as DL_FPost).intensityL3 : 0,
            FPLL4:
              ag.type === "F-Post" ? (ag.deadLoad! as DL_FPost).intensityL4 : 0,
            FPLT:
              ag.type === "F-Post" ? (ag.deadLoad! as DL_FPost).intensity : 0,
            FPPL1: ag.type === "F-Post" ? (el as FPostAccessory).projection : 0,
            FPPL2: ag.type === "F-Post" ? (el as FPostAccessory).projection : 0,
            FPPL3: ag.type === "F-Post" ? (el as FPostAccessory).projection : 0,
            FPPL4: ag.type === "F-Post" ? (el as FPostAccessory).projection : 0,
            FPPLT: ag.type === "F-Post" ? (el as FPostAccessory).projection : 0,
            CPS: ag.type === "Christmas Tree" ? ag.spacing : 0,
            CPL1:
              ag.type === "Christmas Tree"
                ? (ag.deadLoad! as DL_CTree).intensityL1
                : 0,
            CPL2:
              ag.type === "Christmas Tree"
                ? (ag.deadLoad! as DL_CTree).intensityL2
                : 0,
            CPL3:
              ag.type === "Christmas Tree"
                ? (ag.deadLoad! as DL_CTree).intensityL3
                : 0,
            CPL4:
              ag.type === "Christmas Tree"
                ? (ag.deadLoad! as DL_CTree).intensityL4
                : 0,
            CPLT:
              ag.type === "Christmas Tree"
                ? (ag.deadLoad! as DL_CTree).intensity
                : 0,
            CPPL1:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).leftProjection
                : 0,
            CPPL2:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).leftProjection
                : 0,
            CPPL3:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).leftProjection
                : 0,
            CPPL4:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).leftProjection
                : 0,
            CPPLT:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).leftProjection
                : 0,
            CPPR1:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).rightProjection
                : 0,
            CPPR2:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).rightProjection
                : 0,
            CPPR3:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).rightProjection
                : 0,
            CPPR4:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).rightProjection
                : 0,
            CPPRT:
              ag.type === "Christmas Tree"
                ? (el as ChristmasTreeAccessory).rightProjection
                : 0,
          },
        })),
      ];
    });

  deadLoad.accessories = accessoriesItems.reduce(
    (acc, el, i) => ({ ...acc, [i]: el }),
    {}
  );

  if (prBlanketLoads) {
    pipingLoad.blanketLoad = getBlanketLoad(prBlanketLoads, model, members);
  }

  const tierList = elements
    .filter((el) => el.type === "PipeRackColumn" && !el.additional)
    .reduce((acc, el) => {
      const beamElement = beamElements.find(
        (beamElement) =>
          beamElement.label ===
          members.find((member) => member.name === el.name)?.label
      );
      if (beamElement) {
        return acc[el.tier]
          ? {
              ...acc,
              [el.tier]: {
                nodeList: [...acc[el.tier].nodeList, beamElement.nodes[1]],
              },
            }
          : { ...acc, [el.tier]: { nodeList: [beamElement.nodes[1]] } };
      } else return acc;
    }, {});

  const seismicData = {
    countryCode: project.loadings.seismicLoadingAsPerCode,
    analysisMethod: project.loadings.seismicAnalysisMethod,
    modalCombination: project.loadings.modalCombinationMethod,
    spectralData: project.loadings.spectralsPoints.map((sp) => ({
      timePeriod: sp.timePeriod,
      acceleration: sp.acceleration,
    })),
    zoneFactor: project.loadings.isSeismicCode?.zoneFactor,
    responseReductionFactor:
      project.loadings.isSeismicCode?.responseReductionFactor,
    soilType: project.loadings.isSeismicCode?.soilType,
    importanceFactor: project.loadings.isSeismicCode?.importanceFactor,
    dampingRatio: project.loadings.isSeismicCode?.dampingRatio,
    soilFoundationCondition:
      project.loadings.isSeismicCode?.soilFoundationCondition,
    timePeriod: project.loadings.isSeismicCode?.timePeriod,
    tierList: Object.values(tierList).map((tier: any) => ({
      nodeList: Array.from(new Set(tier.nodeList)),
    })),
    seismicResponse:
      project.loadings.seismicLoads
        ?.filter((sl) => sl.prNo === model.name)
        .map((sl) => ({
          prNo: sl.prNo,
          nodeNo: sl.nodeNo,
          tierNo: sl.tierNo,
          seismicWeight: sl.seismicWeight,
        })) ?? [],
  };

  const accessoriesData = getAccessoriesData(model, members);

  return {
    id: `admin${project.name.replace(/\s/g, "")}`, // todo selecting user name
    projectName: project.name,
    material: project.selectedMaterial?.material_name,
    materialId: project.selectedMaterial?.material_id,
    piperackName: model.name,
    piperackDirection: model.direction,
    length: model.portals.reduce(
      (acc, item) => Math.max(acc, item.chainage),
      0
    ),
    width: model.portals.reduce((acc, item) => Math.max(acc, item.width), 0),
    overallStructureHeight:
      model.portals[0]?.tiers.reduce(
        (max, elevation) => Math.max(max, elevation),
        0
      ) ?? 0,
    baseElevation: model.baseElevation ?? 0,
    numberOfBays: model.portals.length - 1,
    tiers:
      model.portals[0]?.tiers.map((tier, index) => ({
        tier: index + 1,
        elevation: tier,
      })) ?? [],
    portalData: getPortalData(model, members),
    bayData: getBayData(model, members),
    platformData: getPlatformData(model, members),
    accessoriesData,
    nodes: nodes.reduce(
      (acc, node) => ({ ...acc, [node.nodeNumber]: node }),
      {}
    ),
    beamElements: beamElements.reduce(
      (acc, element) => ({ ...acc, [element.label]: element }),
      {}
    ),
    beamNodes: beamNodes.reduce(
      (acc, node) => ({ ...acc, [node.label]: node }),
      {}
    ),
    members,
    deadLoad,
    liveLoad,
    temperatureLoad: {
      min: project.loadings.minTemp,
      max: project.loadings.maxTemp,
    },
    pipingLoad,
    equipmentLoad,
    windLoads,
    seismicData,
    loadCombinations: parseLoadCombinations(project.loadings.loadCombinations),
    basePlate: getBasePlateData(project, model, members),
    splicePlate: getSplicePlateData(model, members),
    designParameters: {
      designCode: project.designCode,
      isCodeParameters: {
        cmx: project.indianDesignCode.cmx,
        cmy: project.indianDesignCode.cmy,
        cmz: project.indianDesignCode.cmz,
        deflectionRatio: project.indianDesignCode.deflectionRatio,
        klrColumn: project.indianDesignCode.klrMaxColumns,
        klrBracings: project.indianDesignCode.klrMaxBracings,
        klrBeams: project.indianDesignCode.klrMaxBeams,
        allowStressRatio: project.indianDesignCode.stressRation,
        effectiveLengthTable: project.indianDesignCode.effectiveLengths
          .filter((item) => item.pr === model.name && item.element)
          .reduce((acc, item) => {
            const label =
              members.find((member) => member.name === item.element)?.label ??
              -1;
            return {
              ...acc,
              [label]: {
                element: label,
                ky: item.Ky,
                kz: item.Kz,
                ly: item.Ly,
                lz: item.Lz,
              },
            };
          }, {}),
        deflectionLengthTable:
          project.indianDesignCode.deflectionLengths
            ?.filter((item) => item.model === model.name && item.element)
            .reduce((acc, item) => {
              const label =
                members.find((member) => member.name === item.element)?.label ??
                -1;
              return { ...acc, [label]: item.dl };
            }, {}) ?? {},
      },
      aiscLRFDCodeParameters: {
        cb: project.americanDesignCode.cb,
        deflectionRatio: project.americanDesignCode.deflectionRatio,
        klrColumn: project.americanDesignCode.klrMaxColumns,
        klrBracings: project.americanDesignCode.klrMaxBracings,
        klrBeams: project.americanDesignCode.klrMaxBeams,
        allowStressRatio: project.americanDesignCode.stressRation,
        effectiveLengthTable: project.americanDesignCode.effectiveLengths
          .filter((item) => item.pr === model.name && item.element)
          .reduce((acc, item) => {
            const label =
              members.find((member) => member.name === item.element)?.label ??
              -1;
            return {
              ...acc,
              [label]: {
                element: label,
                ky: item.Ky,
                kz: item.Kz,
                ly: item.Ly,
                lz: item.Lz,
                unlb: item.UNLB,
                unlt: item.UNLT,
              },
            };
          }, {}),
        deflectionLengthTable:
          project.americanDesignCode.deflectionLengths
            ?.filter((item) => item.model === model.name && item.element)
            .reduce((acc, item) => {
              const label =
                members.find((member) => member.name === item.element)?.label ??
                -1;
              return { ...acc, [label]: item.dl };
            }, {}) ?? {},
      },
      euroCodeParameters: {},
    },
  } as any;
}

function getAccessoriesData(model: PipeRack, members: Member[]) {
  return {
    groupData: model.accessories.map((ag) => ({
      grName: ag.name,
      startFromPortal: ag.parent,
      distanceFromStart: ag.distanceFromStart ?? 0,
      tierNo: ag.tier + 1,
      side: ag.side,
      type: ag.type,
      orientation: ag.orientation,
      accessorySpacing: ag.spacing,
      nos: ag.elements.length,
    })),
    tPosts: model.accessories
      .reduce(
        (acc, ag) =>
          ag.type === "T-Post"
            ? [...acc, ...(ag.elements as TPostAccessory[])]
            : acc,
        [] as TPostAccessory[]
      )
      .map((el) => ({
        grName: el.group,
        totalHeight: el.totalH,
        columns: el.colItems.map((cEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === cEl.name
          )?.label,
          orientation: el.colOrientation,
        })),
        beams: el.beamItems.map((bEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === bEl.name
          )?.label,
          orientation: el.beamOrientation,
        })),
      })),
    fPosts: model.accessories
      .reduce(
        (acc, ag) =>
          ag.type === "F-Post"
            ? [...acc, ...(ag.elements as FPostAccessory[])]
            : acc,
        [] as FPostAccessory[]
      )
      .map((el) => ({
        grName: el.group,
        totalHeight: el.totalH,
        level1: el.h1 ?? 0,
        level2: el.h2 ?? 0,
        level3: el.h3 ?? 0,
        level4: el.h4 ?? 0,
        columns: el.colItems.map((cEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === cEl.name
          )?.label,
          orientation: el.colOrientation,
        })),
        beams: el.beamItems.map((bEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === bEl.name
          )?.label,
          orientation: el.beamOrientation,
        })),
      })),
    christmasTree: model.accessories
      .reduce(
        (acc, ag) =>
          ag.type === "Christmas Tree"
            ? [...acc, ...(ag.elements as ChristmasTreeAccessory[])]
            : acc,
        [] as ChristmasTreeAccessory[]
      )
      .map((el) => ({
        grName: el.group,
        totalHeight: el.totalH,
        level1: el.h1 ?? 0,
        level2: el.h2 ?? 0,
        level3: el.h3 ?? 0,
        level4: el.h4 ?? 0,
        columns: el.colItems.map((cEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === cEl.name
          )?.label,
          orientation: el.colOrientation,
        })),
        beams: el.beamItems.map((bEl) => ({
          label: members.find(
            (member) => member.name.replace(/\..+$/gi, "") === bEl.name
          )?.label,
          orientation: el.beamOrientation,
        })),
      })),
  };
}

function getPortalData(model: PipeRack, members: Member[]) {
  return model.portals.reduce(
    (acc, portal, i) => ({
      ...acc,
      [`${i + 1}`]: {
        chainage: roundM(portal.chainage),
        tiers: getPortalTiersElements(model, portal, members),
      },
    }),
    {}
  );
}

function getPortalTiersElements(
  model: PipeRack,
  portal: PipeRackPortal,
  members: Member[]
) {
  return portal.tiers.reduce(
    (tierAcc, tier, index) => ({
      ...tierAcc,
      [`${index + 1}`]: {
        columns: model.columns
          .filter(
            (column) => column.tier === index && column.parent === portal.name
          )
          .map((column) => ({
            name: column.name,
            label: members.find(
              (member) => member.name.replace(/\..+$/gi, "") === column.name
            )?.label,
          })),
        beams: model.beams
          .filter(
            (beam) =>
              beam.tier === index &&
              beam.parent === portal.name &&
              !beam.additional &&
              beam.direction === "Z"
          )
          .map((beam) => ({
            name: beam.name,
            label: members.find(
              (member) => member.name.replace(/\..+$/gi, "") === beam.name
            )?.label,
          })),
      },
    }),
    {}
  );
}

function getBayData(model: PipeRack, members: Member[]) {
  return model.portals.reduce((acc, portal, i, arr) => {
    return arr.length > i + 1
      ? {
          ...acc,
          [`${i + 1}`]: {
            leftSide: { ...getBayTiersElements(model, portal, "L", members) },
            rightSide: { ...getBayTiersElements(model, portal, "R", members) },
          },
        }
      : acc;
  }, {});
}

function getBayTiersElements(
  model: PipeRack,
  portal: PipeRackPortal,
  side: Side,
  members: Member[]
) {
  return portal.tiers.reduce(
    (tierAcc, tier, index) => ({
      ...tierAcc,
      [`${index + 1}`]: {
        tieBeams: model.beams
          .filter(
            (beam) =>
              beam.tier === index &&
              beam.parent === portal.name &&
              beam.direction === "X" &&
              beam.side === side
          )
          .map((beam) => ({
            name: beam.name,
            label: members.find(
              (member) => member.name.replace(/\..+$/gi, "") === beam.name
            )?.label,
          })),
        verBrace: model.vBracings
          .filter(
            (vb) =>
              vb.tier === index && vb.parent === portal.name && vb.side === side
          )
          .map((vb) => ({
            name: vb.name,
            label: members.find(
              (member) => member.name.replace(/\..+$/gi, "") === vb.name
            )?.label,
          })),
      },
    }),
    {}
  );
}

function getPlatformData(model: PipeRack, members: Member[]) {
  return model.platforms.map((platform) => {
    const fromPortal = model.portals.find(
      (portal) => portal.name === platform.fromPortal
    );
    const fromIndex = fromPortal ? model.portals.indexOf(fromPortal) : 0;

    const toPortal = model.portals.find(
      (portal) => portal.name === platform.toPortal
    );
    const toIndex = toPortal ? model.portals.indexOf(toPortal) : 0;

    const beams = [...model.beams, ...model.cantilevers].filter((beam) => {
      const from = fromPortal?.chainage ?? 0;
      const to = toPortal?.chainage ?? 0;
      return (
        beam.tier === platform.tier &&
        ((beam.startPos.x >= from && beam.endPos.x <= to) ||
          (beam.type !== "PipeRackBeam" &&
            beam.endPos.x >= from &&
            beam.startPos.x <= to))
      );
    });

    const getLabels = (
      beam: PipeRackBeam | PipeRackCantilever,
      members: Member[]
    ) => {
      const labels: number[] = [];
      members.forEach((member) => {
        if (new RegExp(beam.name + "(\\..+|)$").test(member.name))
          labels.push(member.label);
      });
      return labels;
    };

    const width = Math.max(fromPortal?.width ?? 0, toPortal?.width ?? 0);

    let leftZ = 0;
    let rightZ = 0;

    switch (platform.side) {
      case "RIGHT OUT":
        leftZ = width / 2;
        rightZ = leftZ + platform.width;
        break;
      case "RIGHT IN":
        rightZ = width / 2;
        leftZ = rightZ - platform.width;
        break;
      case "MID":
        rightZ = platform.width / 2;
        leftZ = -rightZ;
        break;
      case "LEFT IN":
        leftZ = -width / 2;
        rightZ = leftZ + platform.width;
        break;
      case "LEFT OUT":
        rightZ = -width / 2;
        leftZ = rightZ - width;
    }

    const xBeams = beams.filter(
      (beam) =>
        beam.startPos.z === beam.endPos.z &&
        beam.startPos.z >= leftZ &&
        beam.startPos.z <= rightZ
    );
    const zBeams = beams.filter(
      (beam) =>
        beam.startPos.x === beam.endPos.x &&
        ((beam.startPos.z <= rightZ && beam.endPos.z >= leftZ) ||
          (beam.endPos.z <= rightZ && beam.startPos.z >= leftZ))
    );
    const xPositions = Array.from(
      new Set(zBeams.map((beam) => beam.startPos.x))
    );
    let sets: any = {};
    for (let i = 1, len = xPositions.length; i < len; ++i) {
      const prevX = xPositions[i - 1];
      const nextX = xPositions[i];
      sets = {
        ...sets,
        [`set${i}`]: {
          front: zBeams
            .filter((beam) => beam.startPos.x === prevX)
            .reduce(
              (acc, beam) => [...acc, ...getLabels(beam, members)],
              [] as number[]
            ),
          left: xBeams
            .filter(
              (beam) =>
                beam.startPos.x >= prevX &&
                beam.endPos.x <= nextX &&
                beam.startPos.z === leftZ
            )
            .reduce(
              (acc, beam) => [...acc, ...getLabels(beam, members)],
              [] as number[]
            ),
          back: zBeams
            .filter((beam) => beam.startPos.x === nextX)
            .reduce(
              (acc, beam) => [...acc, ...getLabels(beam, members)],
              [] as number[]
            ),
          right: xBeams
            .filter(
              (beam) =>
                beam.startPos.x >= prevX &&
                beam.endPos.x <= nextX &&
                beam.startPos.z === rightZ
            )
            .reduce(
              (acc, beam) => [...acc, ...getLabels(beam, members)],
              [] as number[]
            ),
        },
      };
    }

    return {
      name: platform.name,
      fromPortal: fromIndex + 1,
      toPortal: toIndex + 1,
      tier: platform.tier + 1,
      side: platform.side,
      width: platform.width,
      gratingThickness: platform.thickness,
      peripherialElements: sets,
    };
  });
}

function getBasePlateData(
  project: Project,
  model: PipeRack,
  members: Member[]
) {
  return {
    concreteGrade: project.concreteGrade,
    rectangular: {
      ...model.plates
        .filter((plate) => plate.type === "Rectangular")
        .reduce((acc, plate) => {
          const fMembers = members
            .filter(
              (member) => replaceSplitNumber(member.name) === plate.column
            )
            .sort();
          const member = fMembers[0];
          if (!member) return acc;
          return {
            ...acc,
            [member.name]: {
              label: member.label,
              designMethod: plate.designMethod,
              basePlate: {
                thickness: plate.bPlateThickness,
                length: (plate as RectangularBP).bPlateLength,
                width: (plate as RectangularBP).bPlateWidth,
              },
              anchorBolt: {
                grade: plate.grade,
                dia: plate.boltDiameter,
                nos: {
                  alongLength: (plate as RectangularBP).alongLength,
                  alongWidth: (plate as RectangularBP).alongWidth,
                  spacingAlongLength: {
                    "1stRowFromCenter": (plate as RectangularBP).firstRow_L,
                    rowToRow: (plate as RectangularBP).RtoR_L,
                  },
                  spacingAlongWidth: {
                    "1stRowFromCenter": (plate as RectangularBP).firstRow_W,
                    rowToRow: (plate as RectangularBP).RtoR_W,
                  },
                },
                capacity: {
                  tension: plate.tension,
                  shear: plate.shear,
                },
              },
              stiffenerPlates: {
                size: {
                  thickness: plate.sPlateThickness,
                  height: plate.sPlateHeight,
                },
                nos: {
                  alongWeb: (plate as RectangularBP).alongWeb,
                  alongFlange: (plate as RectangularBP).alongFlange,
                },
              },
              shearResistedBy: (plate as RectangularBP).shearResistedBy,
              shear: {
                fck: project.concreteGrade
                  ? +project.concreteGrade.replace("M", "")
                  : null,
                tg:
                  (plate as RectangularBP).shearKeyDetails?.groutThickness ??
                  null,
                gammam0:
                  (plate as RectangularBP).shearKeyDetails?.materialYielding ??
                  1.1,
                gammam1:
                  (plate as RectangularBP).shearKeyDetails
                    ?.materialUltimateStress ?? 1.25,
                gammamb:
                  (plate as RectangularBP).shearKeyDetails?.anchorBolt ?? 1.25,
                gammammw:
                  (plate as RectangularBP).shearKeyDetails?.weld ?? 1.25,
                hd:
                  (plate as RectangularBP).shearKeyDetails?.overalDepth ?? null,
                hb:
                  (plate as RectangularBP).shearKeyDetails?.flangeWidth ?? null,
                tskw:
                  (plate as RectangularBP).shearKeyDetails?.webThick ?? null,
                tskf:
                  (plate as RectangularBP).shearKeyDetails?.flangeThick ?? null,
                length:
                  (plate as RectangularBP).shearKeyDetails?.keyLength ?? null,
                material:
                  (plate as RectangularBP).shearKeyDetails?.material ?? null,
              },
              tensionCheck: getTensionCheck(
                plate as RectangularBP,
                model.columns.find((c) => c.name === plate.column)
              ),
            },
          };
        }, {}),
    },
    circular: {
      ...model.plates
        .filter((plate) => plate.type === "Circular")
        .reduce((acc, plate) => {
          const fMembers = members
            .filter(
              (member) => replaceSplitNumber(member.name) === plate.column
            )
            .sort();
          const member = fMembers[0];
          if (!member) return acc;
          return {
            ...acc,
            [member.name]: {
              label: member.label,
              designMethod: plate.designMethod,
              basePlate: {
                thickness: plate.bPlateThickness,
                dia: (plate as CircularBP).bPlateDiameter,
              },
              anchorBolt: {
                grade: plate.grade,
                dia: plate.boltDiameter,
                nos: (plate as CircularBP).boltNos,
                BCD: (plate as CircularBP).boltBCD,
                capacity: {
                  tension: plate.tension,
                  shear: plate.shear,
                },
              },
              stiffenerPlates: {
                size: {
                  thickness: plate.sPlateThickness,
                  height: plate.sPlateHeight,
                  width: (plate as CircularBP).sPlateWidth,
                },
                nos: (plate as CircularBP).sPlateNos,
              },
            },
          };
        }, {}),
    },
  };
}

function getTensionCheck(rbp: RectangularBP, column?: PipeRackColumn) {
  if (!column) return { boltNos: 0, leverArm: 0 };

  const pDepth = (column.profile.d_global ?? 0) / 2;
  const pTflange = (column.profile.tf_global ?? 0) / 2;
  const pThickness = (column.profile.tw_global ?? 0) / 2;

  const pWidth = (column.profile.bf_global ?? 0) / 2;
  const pHeight = pDepth - pTflange;

  const length = rbp.bPlateLength / 2;
  const width = rbp.bPlateWidth / 2;

  const stfT = rbp.sPlateThickness / 2;

  const stfW = rbp.alongWidth / 2;
  const stfW1 = rbp.alongFlange !== 2;
  const stfW2 = rbp.alongFlange !== 1;

  const stfL = rbp.alongLength / 2;
  const stfL1 = rbp.alongWeb !== 2;

  const cmp1 = stfL1 ? 3 : 2;
  const cmp2 = stfW1 && stfW2 ? 3 : 2;
  const cmp3 = stfW2 ? 2 : undefined;

  const bolts: Vector2[] = [];
  for (
    let x = rbp.firstRow_L, lenX = rbp.firstRow_L + rbp.RtoR_L * stfL;
    x < lenX;
    x += rbp.RtoR_L
  ) {
    if (x > length) break;
    for (
      let y = rbp.firstRow_W, lenY = rbp.firstRow_W + rbp.RtoR_W * stfW;
      y < lenY;
      y += rbp.RtoR_W
    ) {
      if (y > width) break;
      bolts.push(new Vector2(x, y));
    }
  }

  const cmps: {
    nb: number;
    la: number;
    m: number;
    plateSupportedSides: number;
    a: number;
    b: number;
  }[] = [];

  const getBolts = (from: Vector2, to: Vector2) => {
    const center = new Vector2();
    let nb = 0;
    for (const b of bolts) {
      if (
        checkRange(b.x, from.x, to.x, true) &&
        checkRange(b.y, from.y, to.y, true)
      ) {
        center.add(b);
        nb++;
      }
    }
    center.divideScalar(nb);
    return { center, nb };
  };

  if (cmp3) {
    const fromV = new Vector2(pDepth, pWidth);
    const toV = new Vector2(length, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(center.x - fromV.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: nb * la,
        plateSupportedSides: cmp3,
        a: toV.x - fromV.x,
        b: toV.y - fromV.y,
      });
  }

  if (cmp2 === 2) {
    const fromV = new Vector2(pDepth, stfT);
    const toV = new Vector2(length, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(center.x - fromV.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: nb * la,
        plateSupportedSides: cmp2,
        a: toV.x - fromV.x,
        b: toV.y - fromV.y,
      });
  } else {
    const fromV = new Vector2(pDepth, stfT);
    const toV = new Vector2(length, pWidth - stfT);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(
      center.x - fromV.x,
      center.y - fromV.y,
      toV.y - center.y
    );
    la &&
      cmps.push({
        nb,
        la,
        m: nb * la,
        plateSupportedSides: cmp2,
        a: toV.x - fromV.x,
        b: toV.y - fromV.y,
      });
  }

  if (cmp1 === 2) {
    const fromV = new Vector2(0, pThickness);
    const toV = new Vector2(pHeight, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(toV.x - center.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: nb * la,
        plateSupportedSides: cmp1,
        a: toV.x - fromV.x,
        b: toV.y - fromV.y,
      });
  } else {
    const fromV = new Vector2(stfT, pThickness);
    const toV = new Vector2(pHeight, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(
      toV.x - center.x,
      center.x - fromV.x,
      center.y - fromV.y
    );
    la &&
      cmps.push({
        nb,
        la,
        m: nb * la,
        plateSupportedSides: cmp1,
        a: toV.x - fromV.x,
        b: toV.y - fromV.y,
      });
  }

  const max = Math.max(...cmps.map((cmp) => cmp.m));
  if (cmps.filter((cmp) => cmp.m === max).length > 1) {
    const leverArm = Math.max(...cmps.map((cmp) => cmp.la));
    const cmp = cmps.find((cmp) => cmp.la === leverArm);
    return {
      boltNos: cmp?.nb ?? 0,
      leverArm,
      plateSupportedSides: cmp?.plateSupportedSides ?? 0,
      a: cmp?.a ?? 0,
      b: cmp?.b ?? 0,
    };
  } else {
    const cmp = cmps.find((cmp) => cmp.m === max);
    return {
      boltNos: cmp?.nb ?? 0,
      leverArm: cmp?.la ?? 0,
      plateSupportedSides: cmp?.plateSupportedSides ?? 0,
      a: cmp?.a ?? 0,
      b: cmp?.b ?? 0,
    };
  }
}

function getSplicePlateData(model: PipeRack, members: Member[]) {
  return {
    rectangular: {
      ...model.flanges
        .filter((flange) => flange.type === "Rectangular")
        .reduce((acc, flange) => {
          const column = model.columns.find(
            (column) => column.name === flange.column
          );
          const connectingCol = model.columns.find(
            (connCol) => column && column.next === connCol.name
          );
          return {
            ...acc,
            [flange.column]: {
              label: members.find(
                (member) => replaceSplitNumber(member.name) === flange.column
              )?.label,
              connectingColName: connectingCol?.name,
              connectingColLabel: members.find(
                (member) =>
                  replaceSplitNumber(member.name) === connectingCol?.name
              )?.label,
              designMethod: flange.designMethod,
              topSplicePlate: {
                thickness: flange.bPlateThickness,
                length: (flange as RectangularSF).bPlateLength,
                width: (flange as RectangularSF).bPlateWidth,
              },
              bottomSplicePlate: {
                thickness: flange.bBottomPlateThickness,
                length: (flange as RectangularSF).bBottomPlateLength,
                width: (flange as RectangularSF).bBottomPlateWidth,
              },
              spliceBolt: {
                grade: flange.grade,
                dia: flange.boltDiameter,
                nos: {
                  alongLength: (flange as RectangularSF).alongLength,
                  alongWidth: (flange as RectangularSF).alongWidth,
                  spacingAlongLength: {
                    "1stRowFromCenter": (flange as RectangularSF).firstRow_L,
                    rowToRow: (flange as RectangularSF).RtoR_L,
                  },
                  spacingAlongWidth: {
                    "1stRowFromCenter": (flange as RectangularSF).firstRow_W,
                    rowToRow: (flange as RectangularSF).RtoR_W,
                  },
                },
                capacity: {
                  tension: flange.tension,
                  shear: flange.shear,
                },
              },
              stiffenerPlates: {
                size: {
                  thickness: flange.sPlateThickness,
                  height: flange.sPlateHeight,
                },
                nos: {
                  alongWeb: (flange as RectangularSF).alongWeb,
                  alongFlange: (flange as RectangularSF).alongFlange,
                },
              },
              tensionCheck: {
                topSplicePlate: getTensionCheck(
                  flange as RectangularBP,
                  connectingCol
                ),
                bottomSplicePlate: getTensionCheck(
                  {
                    ...flange,
                    bPlateWidth: (flange as RectangularSF).bBottomPlateWidth,
                    bPlateLength: (flange as RectangularSF).bBottomPlateLength,
                  } as RectangularBP,
                  column
                ),
              },
            },
          };
        }, {}),
    },
    circular: {
      ...model.flanges
        .filter(
          (flange: CircularSF | RectangularSF) => flange.type === "Circular"
        )
        .reduce((acc, flange) => {
          const column = model.columns.find(
            (column) => column.name === flange.column
          );
          const connectingCol = model.columns.find(
            (connCol) => column && column.next === connCol.name
          );
          return {
            ...acc,
            [flange.column]: {
              label: members.find((member) => member.name === flange.column)
                ?.label,
              connectingColName: connectingCol?.name,
              connectingColLabel: members.find(
                (member) => member.name === connectingCol?.name
              )?.label,
              designMethod: flange.designMethod,
              topSplicePlate: {
                thickness: flange.bPlateThickness,
                dia: (flange as CircularSF).bPlateDiameter,
              },
              bottomSplicePlate: {
                thickness: flange.bBottomPlateThickness,
                dia: (flange as CircularSF).bBottomPlateDiameter,
              },
              anchorBolt: {
                grade: flange.grade,
                dia: flange.boltDiameter,
                nos: (flange as CircularSF).boltNos,
                BCD: (flange as CircularSF).boltBCD,
                capacity: {
                  tension: flange.tension,
                  shear: flange.shear,
                },
              },
              stiffenerPlates: {
                size: {
                  thickness: flange.sPlateThickness,
                  height: flange.sPlateHeight,
                  width: (flange as CircularSF).sPlateWidth,
                },
                nos: (flange as CircularSF).sPlateNos,
              },
            },
          };
        }, {}),
    },
  };
}

function getBeamElement(
  start: number,
  end: number,
  count: number,
  zAxis: number[],
  releases?: Releases
): BeamElement {
  const label = count + 1;
  return {
    label,
    nodes: [start, end],
    bodyLoads: ["DeadWeight"],
    boundaryLoads: [],
    section: label,
    zAxis,
    beamHinges: releases
      ? [
          !!releases.fx1,
          !!releases.fy1,
          !!releases.fz1,
          !!releases.mx1,
          !!releases.my1,
          !!releases.mz1,
          !!releases.fx2,
          !!releases.fy2,
          !!releases.fz2,
          !!releases.mx2,
          !!releases.my2,
          !!releases.mz2,
        ]
      : [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ],
  };
}

function getMember(
  label: number,
  name: string,
  profile: Section | undefined,
  length: number,
  pipeouterdiameter?: number,
  pipewallthickness?: number,
  pipematerial?: Material
): Member {
  let type;
  switch (profile?.country_code) {
    case "Rolled":
      type = "ProfileWithPlates";
      break;
    case "Fabricated":
      type = "FabProfile";
      break;
    case "Combined":
      type = "CombinedSection";
      break;
    case undefined:
      type = "Pipe";
      break;
    default:
      type = "Profile";
  }

  const rolled =
    type === "ProfileWithPlates" ? (profile as RolledSection) : undefined;
  const combined =
    type === "CombinedSection" ? (profile as CombinedSection) : undefined;

  return {
    label,
    name,
    type,
    profileName: profile ? profile.name : undefined,
    countryCode: type === "Profile" ? profile!.country_code : null,
    profileType: type === "Profile" ? profile!.designation : null,
    length: MtoMM(length),
    thickness: profile?.tw_global ?? 0,
    width: profile?.bf_global ?? 0,

    FabProfType: type === "FabProfile" ? profile!.shape : null,
    FabProfDepth:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.d_global ?? null
        : null,
    FabProfWidth:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.bf_global ?? null
        : null,
    FabProfTFthk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tf_global ?? null
        : null,
    FabProfBFthk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tfb_global ?? null
        : null,
    FabProfWebThk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tw_global ?? null
        : null,

    FabProfOd:
      type === "FabProfile" && profile!.shape === "O"
        ? profile!.d_global ?? null
        : null,
    FabProfID:
      type === "FabProfile" && profile!.shape === "O"
        ? profile!.bf_global ?? null
        : null,

    RolWthPltCountryCode: rolled ? rolled.baseCountryCode : null,
    RolWthPltProfile: rolled ? rolled.baseProfile : null,
    RolWthPltTPWidth: rolled ? rolled.tpWidth ?? null : null,
    RolWthPltTPthk: rolled ? rolled.tpThickness ?? null : null,
    RolWthPltBPWidth: rolled ? rolled.bpWidth ?? null : null,
    RolWthPltBPthk: rolled ? rolled.bpThickness ?? null : null,

    pipeouterdiameter: pipeouterdiameter ?? null,
    pipewallthickness: pipewallthickness ?? null,
    pipematerial: pipematerial?.material_id ?? null,

    combination: combined?.combination ?? null,
    clearGap: combined?.gap ?? null,
  };
}

function getLoad(load: AdditionalLoad) {
  return {
    fx: load.Fx ?? 0,
    fy: load.Fy ?? 0,
    fz: load.Fz ?? 0,
    mx: load.Mx ?? 0,
    my: load.My ?? 0,
    mz: load.Mz ?? 0,
  };
}

function getUDL(udl: any, beamElement: BeamElement, load: AdditionalLoad) {
  return {
    ...udl,
    [beamElement.label]: {
      elementLabel: beamElement.label,
      load: getLoad(load),
    },
  };
}

function getPointLoad(
  pointLoad: any,
  node: Node,
  load: AdditionalLoad,
  lineNo?: string
) {
  return {
    ...pointLoad,
    [node.nodeNumber]: {
      lineNo,
      nodeLabel: node.nodeNumber,
      load: getLoad(load),
    },
  };
}

function getDeadLoad(loadings: Loadings): DeadLoad {
  return {
    selfWeightFactor: loadings.SWF,
    platformDeadLoadIntensity: loadings.DLI,
    fireProofLoad: {
      fpDensity: loadings.FPd,
      fpThickness: loadings.FPt,
      fpHeight: loadings.FPh,
      fpApp: loadings.FPto,
      fpDf: loadings.FPdl,
      boxFpList: [],
      profFpList: [],
    },
    additionalLoad: {
      udl: {},
      pointLoad: {},
    },
    accessories: {},
  };
}

function getLiveLoad(loadings: Loadings): LiveLoad {
  return {
    platformLiveLoadIntensity: loadings.intensity,
    additionalLoad: {
      udl: {},
      pointLoad: {},
    },
  };
}

function getPipingLoad() {
  return {
    directLoad: {
      emptyLoad: {
        pointLoad: {},
      },
      testingLoad: {
        pointLoad: {},
      },
      operatingLoad: {
        pointLoad: {},
      },
      thermalAnchorLoad: {
        pointLoad: {},
      },
      thermalFrictionLoad: {
        pointLoad: {},
      },
      windOnPipeLoadX: {
        pointLoad: {},
      },
      windOnPipeLoadZ: {
        pointLoad: {},
      },
      psvReleaseOrSurgeLoad: {
        pointLoad: {},
      },
      snowIceLoad: {
        pointLoad: {},
      },
    },
    blanketLoad: {},
  };
}

function getEquipmentLoad() {
  return {
    directLoad: {
      emptyLoad: {
        pointLoad: {},
      },
      testingLoad: {
        pointLoad: {},
      },
      operatingLoad: {
        pointLoad: {},
      },
    },
  };
}

function getBlanketLoad(
  bls: BlanketLoad[],
  model: PipeRack,
  members: Member[]
) {
  const blanketLoads = bls.reduce((acc, el, i) => {
    const fromPortal = model.portals.findIndex(
      (portal) => portal.name === el.fromPortal
    );
    const toPortal = model.portals.findIndex(
      (portal) => portal.name === el.toPortal
    );
    if (fromPortal === -1 || toPortal === -1) return { ...acc };
    const portalBeams: any[] = [];
    model.portals.forEach((portal, i, arr) => {
      if (i >= fromPortal && i <= toPortal) {
        model.beams
          .filter(
            (beam) =>
              beam.parent === portal.name &&
              beam.direction === "Z" &&
              beam.tier === el.tier
          )
          .forEach((beam) => {
            const member = members.find((member) => member.name === beam.name);
            if (member) {
              const spacing =
                (i > fromPortal && i < toPortal
                  ? (arr[i - 1]?.length ?? 0) + portal.length
                  : i === fromPortal
                  ? portal.length
                  : arr[i - 1]?.length ?? 0) / 2;
              portalBeams.push({ label: member.label, length: spacing });
            }
          });
      }
    });
    const load = {
      areaNumber: el.areaNo,
      fromPortal: fromPortal + 1,
      toPortal: toPortal + 1,
      tier: (el.tier ?? 0) + 1,
      portalBeams,
      load: {
        fy: el.intensity,
        alongPipeDirection:
          model.direction === "+X" || model.direction === "-X" ? "X" : "Z",
        alongPipePercent: el.alongPercent,
        acrossPipeDirection:
          model.direction === "+X" || model.direction === "-X" ? "Z" : "X",
        acrossPipePercent: el.acrossPercent,
      },
    };
    return { ...acc, [i + 1]: load };
  }, {});
  return blanketLoads;
}

function parseLoadCombinations(arr: LoadCombination[]) {
  return arr.map(
    (item) =>
      ({
        number: item.LC_No,
        limitState: item.LC_Type,
        loadCondition: item.CONDITION,
        deadLoad: fixValueToNumber(item.DL, "float"),
        liveLoad: fixValueToNumber(item.LL, "float"),
        temperatureLoad: fixValueToNumber(item.TL, "float"),
        pipingEmptyLoad: fixValueToNumber(item.PE, "float"),
        pipingTestingLoad: fixValueToNumber(item.PT, "float"),
        pipingOperatingLoad: fixValueToNumber(item.PO, "float"),
        pipingThermalAnchorLoad: fixValueToNumber(item.TA, "float"),
        pipingThermalFrictionLoad: fixValueToNumber(item.TF, "float"),
        equipmentEmptyLoad: fixValueToNumber(item.EE, "float"),
        equipmentTestingLoad: fixValueToNumber(item.ET, "float"),
        equipmentOperatingLoad: fixValueToNumber(item.EO, "float"),
        windLoadPlusX0Deg: fixValueToNumber(item.WLpX, "float"),
        windLoadPlusXMinusZ45Deg: fixValueToNumber(item.WLmZpX, "float"),
        windLoadMinusZ90Deg: fixValueToNumber(item.WLmZ, "float"),
        windLoadMinusZMinusX135Deg: fixValueToNumber(item.WLmXmZ, "float"),
        windLoadMinusX180Deg: fixValueToNumber(item.WLmX, "float"),
        windLoadMinusXPlusZ225Deg: fixValueToNumber(item.WLpZmX, "float"),
        windLoadPlusZ270Deg: fixValueToNumber(item.WLpZ, "float"),
        windLoadPlusZPlusX315Deg: fixValueToNumber(item.WLpXpZ, "float"),
        seismicX: fixValueToNumber(item.SX, "float"),
        seismicZ: fixValueToNumber(item.SZ, "float"),
        seismicY: fixValueToNumber(item.SY, "float"),
      } as LoadComb)
  );
}

function getElementsForWindLoads(
  pr: PipeRack,
  loadings: Loadings,
  elements: any[],
  angle = 45
) {
  let minX = 0;
  let maxX = 0;
  let minZ = 0;
  let maxZ = 0;

  elements?.forEach((el) => {
    minX = Math.min(minX, el.startPos.x);
    minX = Math.min(minX, el.endPos.x);

    maxX = Math.max(maxX, el.startPos.x);
    maxX = Math.max(maxX, el.endPos.x);

    minZ = Math.min(minZ, el.startPos.z);
    minZ = Math.min(minZ, el.endPos.z);

    maxZ = Math.max(maxZ, el.startPos.z);
    maxZ = Math.max(maxZ, el.endPos.z);
  });

  const minV = new Vector2(minX, minZ);
  const maxV = new Vector2(maxX, maxZ);

  const center = new Vector2().addVectors(minV, maxV).divideScalar(2);

  const radius = minV.distanceTo(maxV) / 2;

  const vector45 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    45
  );
  const vector45x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    45
  );
  const vector135 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    135
  );
  const vector135x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    135
  );
  const vector225 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    225
  );
  const vector225x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    225
  );
  const vector315 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    315
  );
  const vector315x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    315
  );

  let modelsElements: any = {};
  elements?.forEach((el) => {
    if (modelsElements[el.modelName]) {
      modelsElements = {
        ...modelsElements,
        [el.modelName]: [
          ...modelsElements[el.modelName],
          { ...el, index: modelsElements[el.modelName].length + 1 },
        ],
      };
    } else {
      modelsElements = {
        ...modelsElements,
        [el.modelName]: [{ ...el, index: 1 }],
      };
    }
  });

  const getLength = (
    model: PipeRack | undefined,
    items: any[],
    deg: Orientation
  ) => {
    if (!model || !items.length) return 0;

    let minItemX: number;
    let maxItemX: number;
    let minItemZ: number;
    let maxItemZ: number;

    items.forEach((item) => {
      minItemX =
        minItemX !== undefined
          ? Math.min(minItemX, item.startPos.x)
          : item.startPos.x;
      minItemX = Math.min(minItemX, item.endPos.x);

      maxItemX =
        maxItemX !== undefined
          ? Math.max(maxItemX, item.startPos.x)
          : item.startPos.x;
      maxItemX = Math.max(maxItemX, item.endPos.x);

      minItemZ =
        minItemZ !== undefined
          ? Math.min(minItemZ, item.startPos.z)
          : item.startPos.z;
      minItemZ = Math.min(minItemZ, item.endPos.z);

      maxItemZ =
        maxItemZ !== undefined
          ? Math.max(maxItemZ, item.startPos.z)
          : item.startPos.z;
      maxItemZ = Math.max(maxItemZ, item.endPos.z);
    });

    if (deg === 0 || deg === 180) {
      return maxItemZ! - minItemZ!;
    } else if (deg === 90 || deg === 270) {
      return maxItemX! - minItemX!;
    } else if (deg === 45 || deg === 225) {
      return new Vector2(minItemX!, minItemZ!).distanceTo(
        new Vector2(maxItemX!, maxItemZ!)
      );
    } else {
      return new Vector2(minItemX!, maxItemZ!).distanceTo(
        new Vector2(maxItemX!, minItemZ!)
      );
    }
  };

  const dir45Elements = getElementsForWindDirection(
    modelsElements[pr.name] ?? [],
    vector45,
    fixVectorByOrientation(vector45, vector225x2, angle),
    fixVectorByOrientation(vector45, vector225x2, -angle)
  );

  const dir135Elements = getElementsForWindDirection(
    modelsElements[pr.name] ?? [],
    vector135,
    fixVectorByOrientation(vector135, vector315x2, angle),
    fixVectorByOrientation(vector135, vector315x2, -angle)
  );

  const dir225Elements = getElementsForWindDirection(
    modelsElements[pr.name] ?? [],
    vector225,
    fixVectorByOrientation(vector225, vector45x2, angle),
    fixVectorByOrientation(vector225, vector45x2, -angle)
  );

  const dir315Elements = getElementsForWindDirection(
    modelsElements[pr.name] ?? [],
    vector315,
    fixVectorByOrientation(vector315, vector135x2, angle),
    fixVectorByOrientation(vector315, vector135x2, -angle)
  );

  const tiers = pr.portals[0]?.tiers ?? [];

  const createPipeTiers = (elements: any[]) => {
    const pipeTiers = tiers.reduce((acc, tier, i) => {
      acc[i] = [];
      return acc;
    }, [] as any[]);
    for (let i = 0, len = elements.length; i < len; ++i) {
      const element = elements[i];
      const elevation = (element.startPos.y + element.endPos.y) / 2;
      if (element.tier !== undefined) {
        pipeTiers[element.tier] = [
          ...(pipeTiers[element.tier] ?? []),
          {
            label: element.index,
            elevation,
          },
        ];
        continue;
      }
      const min = tiers.filter((tier) => tier <= elevation).pop();
      const max = tiers.filter((tier) => tier > elevation).shift();
      if (min === undefined) {
        pipeTiers[0] = [...pipeTiers[0], { label: element.index, elevation }];
      } else if (max === undefined) {
        const index = tiers.indexOf(min);
        pipeTiers[index] = [
          ...pipeTiers[index],
          { label: element.index, elevation },
        ];
      } else {
        const index =
          (max + min) / 2 >= elevation
            ? tiers.indexOf(min)
            : tiers.indexOf(max);
        pipeTiers[index] = [
          ...pipeTiers[index],
          { label: element.index, elevation },
        ];
      }
    }
    return pipeTiers.reduce(
      (acc, item, i) => ({ ...acc, [`${i + 1}`]: item }),
      {}
    );
  };

  const facingMembers = (elements: any[], deg: Orientation): any[] => {
    let selected: any[] = [];
    let filtered: any[] = [];
    switch (deg) {
      case 0:
      case 180:
        filtered = elements.filter((item) => item.startPos.x === item.endPos.x);
        filtered.forEach((el) => {
          if (el.type === "PipeRackColumn") {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y <= el.startPos.y &&
                  el1.endPos.y >= el.endPos.y &&
                  el1.startPos.z === el.startPos.z &&
                  (deg === 0
                    ? el1.startPos.x > el.startPos.x
                    : el1.startPos.x < el.startPos.x)
              )
            ) {
              selected = [...selected, el];
            }
          } else if (
            el.type === "PipeRackBeam" ||
            el.type === "PipeRackCantilever"
          ) {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y === el.startPos.y &&
                  ((el1.startPos.z <= el.startPos.z &&
                    el1.endPos.z >= el.endPos.z) ||
                    (el1.startPos.z <= el.endPos.z &&
                      el1.endPos.z >= el.startPos.z)) &&
                  (deg === 0
                    ? el1.startPos.x > el.startPos.x
                    : el1.startPos.x < el.startPos.x)
              )
            ) {
              selected = [...selected, el];
            }
          } else if (el.type === "PipeRackVBracing") {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y === el.startPos.y &&
                  el1.endPos.y === el.endPos.y &&
                  ((el1.startPos.z <= el.startPos.z &&
                    el1.endPos.z >= el.endPos.z) ||
                    (el1.startPos.z <= el.endPos.z &&
                      el1.endPos.z >= el.startPos.z)) &&
                  (deg === 0
                    ? el1.startPos.x > el.startPos.x
                    : el1.startPos.x < el.startPos.x)
              )
            ) {
              selected = [...selected, el];
            }
          }
        });
        break;
      case 90:
      case 270:
        filtered = elements.filter((item) => item.startPos.z === item.endPos.z);
        filtered.forEach((el) => {
          if (el.type === "PipeRackColumn") {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y <= el.startPos.y &&
                  el1.endPos.y >= el.endPos.y &&
                  el1.startPos.x === el.startPos.x &&
                  (deg === 90
                    ? el1.startPos.z < el.startPos.z
                    : el1.startPos.z > el.startPos.z)
              )
            ) {
              selected = [...selected, el];
            }
          } else if (
            el.type === "PipeRackBeam" ||
            el.type === "PipeRackCantilever"
          ) {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y === el.startPos.y &&
                  ((el1.startPos.x <= el.startPos.x &&
                    el1.endPos.x >= el.endPos.x) ||
                    (el1.startPos.x <= el.endPos.x &&
                      el1.endPos.x >= el.startPos.x)) &&
                  (deg === 90
                    ? el1.startPos.z < el.startPos.z
                    : el1.startPos.z > el.startPos.z)
              )
            ) {
              selected = [...selected, el];
            }
          } else if (el.type === "PipeRackVBracing") {
            if (
              !filtered.some(
                (el1) =>
                  el1.startPos.y === el.startPos.y &&
                  el1.endPos.y === el.endPos.y &&
                  ((el1.startPos.x <= el.startPos.x &&
                    el1.endPos.x >= el.endPos.x) ||
                    (el1.startPos.x <= el.endPos.x &&
                      el1.endPos.x >= el.startPos.x)) &&
                  (deg === 90
                    ? el1.startPos.z < el.startPos.z
                    : el1.startPos.z > el.startPos.z)
              )
            ) {
              selected = [...selected, el];
            }
          }
        });
        break;
      case 45:
        return Array.from(
          new Set([
            ...facingMembers(elements, 0),
            ...facingMembers(elements, 90),
          ])
        ).sort((a, b) => a - b);
      case 135:
        return Array.from(
          new Set([
            ...facingMembers(elements, 90),
            ...facingMembers(elements, 180),
          ])
        ).sort((a, b) => a - b);
      case 225:
        return Array.from(
          new Set([
            ...facingMembers(elements, 180),
            ...facingMembers(elements, 270),
          ])
        ).sort((a, b) => a - b);
      case 315:
        return Array.from(
          new Set([
            ...facingMembers(elements, 270),
            ...facingMembers(elements, 0),
          ])
        ).sort((a, b) => a - b);
    }
    return selected.map((el) => el.index).sort((a, b) => a - b);
  };

  const modelElements = (modelsElements[pr.name] ?? []) as any[];

  const dir0 = {
    length: getLength(pr, modelElements, 0),
    z: modelElements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: [],
    pipeZ: createPipeTiers(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.z !== item.endPos.z
      )
    ),
    pipeX: createPipeTiers([]),
    windFacingMembers: facingMembers(modelElements, 0),
  };

  const dir45 = {
    length: getLength(pr, modelElements, 45),
    z: dir45Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir45Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    windFacingMembers: facingMembers(modelElements, 45),
  };

  const dir90 = {
    length: getLength(pr, modelElements, 90),
    z: [],
    x: modelElements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers([]),
    pipeX: createPipeTiers(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.x !== item.endPos.x
      )
    ),
    windFacingMembers: facingMembers(modelElements, 90),
  };

  const dir135 = {
    length: getLength(pr, modelElements, 135),
    z: dir135Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir135Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    windFacingMembers: facingMembers(modelElements, 135),
  };

  const dir180 = {
    length: getLength(pr, modelElements as any[], 180),
    z: modelElements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: [],
    pipeZ: createPipeTiers(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.z !== item.endPos.z
      )
    ),
    pipeX: createPipeTiers([]),
    windFacingMembers: facingMembers(modelElements, 180),
  };

  const dir225 = {
    length: getLength(pr, modelElements, 225),
    z: dir225Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir225Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    windFacingMembers: facingMembers(modelElements, 225),
  };

  const dir270 = {
    length: getLength(pr, modelElements, 270),
    z: [],
    x: modelElements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers([]),
    pipeX: createPipeTiers(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.x !== item.endPos.x
      )
    ),
    windFacingMembers: facingMembers(modelElements, 270),
  };

  const dir315 = {
    length: getLength(pr, modelElements, 315),
    z: dir315Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.x === item.endPos.x
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir315Elements
      .filter(
        (item) =>
          item.type !== "PipeItem" &&
          item.type !== "PipeConnector" &&
          item.startPos.z === item.endPos.z
      )
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    pipeZ: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeTiers(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    windFacingMembers: facingMembers(modelElements, 315),
  };

  return {
    countryCode: loadings.windLoadingAsPerCode,
    manual:
      loadings.manualWindCode?.map((item) => ({
        height: item.height,
        pressure: item.pressure,
      })) ?? [],
    isWindCode: {
      ...loadings.isWindCode,
      datumElevation: loadings.isWindCode.datumElevation ?? 0,
    },
    usWindCode: {
      ...loadings.usWindCode,
      datumElevation: loadings.usWindCode.datumElevation ?? 0,
    },
    euWindCode: loadings.euWindCode,
    additionalLoad: { udl: {}, pointLoad: {} },
    dir0,
    dir45,
    dir90,
    dir135,
    dir180,
    dir225,
    dir270,
    dir315,
  };
}

function getElementsForWindDirection(
  elements: any[] = [],
  A: Vector3,
  B: Vector3,
  C: Vector3
) {
  console.log("elemnts", elements);
  const selected: any[] = [];
  const square = getSquareByGeron(A, B, C);
  elements?.forEach((el) => {
    if (checkHit(A, B, C, vector3FromPoint(el.startPos), square)) {
      selected.push(el);
    } else {
      if (checkHit(A, B, C, vector3FromPoint(el.endPos), square))
        selected.push(el);
    }
  });
  return selected;
}

// todo change getting square, that is use 3js functions and objects
function checkHit(
  A: Vector3,
  B: Vector3,
  C: Vector3,
  P: Vector3,
  square: number
) {
  const fixP = new Vector3().add(P).setY(0);
  const sum =
    getSquareByGeron(A, B, fixP) +
    getSquareByGeron(A, C, fixP) +
    getSquareByGeron(B, C, fixP);
  return sum.toFixed(5) === square.toFixed(5);
}

function getSquareByGeron(A: Vector3, B: Vector3, C: Vector3) {
  const a = A.distanceTo(B);
  const b = A.distanceTo(C);
  const c = B.distanceTo(C);
  const p = (a + b + c) / 2;
  const square = Math.sqrt(p * (p - a) * (p - b) * (p - c));
  return square ? square : 0;
}

export function getASL_PR(asl?: DataState) {
  const mapped = asl?.profileSectionData.map((profile) => {
    return {
      countryCode: profile.country_code,
      profileName: profile.name,
      profileType: profile.designation,
    };
  });
  return mapped ?? [];
}
