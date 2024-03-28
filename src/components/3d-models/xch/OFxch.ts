import {
  saveToFile,
  getNextId,
  getIndexName,
  getProfileLibrary,
  roundM,
  getSimpleDirection,
} from "../utils";
import {
  RolledSection,
  Section,
  Material,
  CombinedSection,
} from "../../../store/data/types";
import {
  TOpenFrame,
  TRSpliceFlangeOF,
  TCSpliceFlangeOF,
  TRBasePlateOF,
  TCBasePlateOF,
  TPlatformOF,
  TKneeBracingOF,
  THorizontalBracingOF,
  TVerticalBracingOF,
  TCantileverOF,
  TBeamOF,
  TColumnOF,
  TFrameOF,
  TBeamElement,
} from "../../../store/main/openFrameTypes";
import {
  concreteGrade,
  initLadderParams,
  initLoadings,
  initialIndianDesignCode,
  initialAmericanDesignCode,
  initPipeDesignCode,
  initSettings,
  initPipingLoad,
} from "../../../store/main/constants";
import { createXCHProjectOF } from "../../../store/main/actions";
import { createUI_XCH_OF } from "../../../store/ui/actions";
import {
  OFRSpliceFlangeUI,
  OFCSpliceFlangeUI,
  OFRBasePlateUI,
  OFCBasePlateUI,
  OFPlatformUI,
  OFKneeBracingsUI,
  OFPlanBracingsUI,
  OFVerticalBracingsUI,
  OFCantileverUI,
  OFColumnToColumnUI,
  OFColumnToBeamUI,
  OFBeamToBeamUI,
  OFColumnsUI,
  OFFramesColumnRelocationUI,
  OFFramesParametersUI,
  ProjectUI,
} from "../../../store/ui/types";
import { getProfile, getMaterial } from "./xchUtils";
import { Vector3 } from "three";
import {
  Direction2,
  Project,
  SimpleDirection,
} from "../../../store/main/types";
import { initialStateProjectUI } from "../../../store/ui/initialState";
import { Dispatch } from "redux";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { focusTarget } from "../../../store/scene/actions";
import { updateConnections, removeConnections } from "../openFrame";

export function exportOFs(
  controls: OrbitControls | undefined,
  models: TOpenFrame[],
  fabricatedSections: Section[],
  rolledSections: RolledSection[],
  combinedSections: CombinedSection[]
) {
  const xchArr = {
    camera: controls
      ? {
          target: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          },
          position: {
            x: controls.object.position.x,
            y: controls.object.position.y,
            z: controls.object.position.z,
          },
        }
      : undefined,
    type: "Open Frame",
    models: models.map((model) => ({
      name: model.name,
      direction: model.direction,
      baseElevation: model.baseElevation,
      position: {
        x: model.startPos.x,
        y: model.startPos.y,
        z: model.startPos.z,
      },
      library: model.CSLibrary,
      colProfile: model.frameColProfile.designation,
      beamProfile: model.frameBeamProfile.designation,
      tieProfile: model.frameTieProfile.designation,
      material: model.material?.material_name,
      frames: model.frames.map((item) => ({
        id: item.id,
        name: item.name,
        height: item.height,
        width: item.width,
        chainage: item.chainage,
        noOfColumns: item.columns,
        noOfTiers: item.tiers,
        supportType: item.supportType,
      })),
      columns: model.columns.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        secondType: item.secondType,
        profile: item.profile.designation,
        orientation: item.orientation,
        noRelocationPosition: item.pos,
        prev: item.prev,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      beams: model.beams.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        secondType: item.secondType,
        profile: item.profile.designation,
        orientation: item.orientation,
        direction: item.direction,
        prev: item.prev,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      cantilevers: model.cantilevers.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        profile: item.profile.designation,
        orientation: item.orientation,
        direction: item.direction,
        prev: item.prev,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      vbracings: model.verticalBracings.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        secondType: item.secondType,
        profile: item.profile.designation,
        orientation: item.orientation,
        isUp: item.isUp,
        prev: item.prev,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      hbracings: model.horizontalBracings.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        profile: item.profile.designation,
        orientation: item.orientation,
        prev: item.prev,
        connectedTo: item.connectedTo,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      kneeBracings: model.kneeBracings.map((item) => ({
        id: item.id,
        name: item.name,
        frame: item.frame,
        profile: item.profile.designation,
        orientation: item.orientation,
        prev: item.prev,
        startPos: item.startPos,
        startConnected: item.startConnected,
        connected: item.connected,
        endConnected: item.endConnected,
        endPos: item.endPos,
        next: item.next,
      })),
      accessories: model.accessories,
      platforms: model.platforms.map((item) => ({
        id: item.id,
        name: item.name,
        from: item.from,
        to: item.to,
        width: item.width,
        thickness: item.thickness,
        distance: item.distance,
      })),
      roads: model.roads?.map((road) => ({
        id: road.id,
        from: road.from,
        to: road.to,
        segments: road.segments,
        width: road.width,
        thickness: road.thickness,
      })),
      cPlates: model.circularBP.map((item) => ({
        id: item.id,
        name: item.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        boltDiameter: item.anchorBoltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        designMethod: item.dMethod,
        tension: item.tension,
        shear: item.shear,
      })),
      rPlates: model.rectangularBP.map((item) => ({
        id: item.id,
        name: item.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        boltDiameter: item.anchorBoltDiameter,
        boltCountAlongLength: item.countAlongLength,
        boltCountAlongWidth: item.countAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        designMethod: item.dMethod,
        tension: item.tension,
        shear: item.shear,
      })),
      cFlange: model.circularSF.map((item) => ({
        id: item.id,
        name: item.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateDiameter: item.bottomPlateDiameter,
        boltDiameter: item.anchorBoltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        designMethod: item.dMethod,
        tension: item.tension,
        shear: item.shear,
      })),
      rFlange: model.rectangularSF.map((item) => ({
        id: item.id,
        name: item.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateLength: item.bottomPlateLength,
        bottomPlateWidth: item.bottomPlateWidth,
        boltDiameter: item.anchorBoltDiameter,
        boltCountAlongLength: item.countAlongLength,
        boltCountAlongWidth: item.countAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        designMethod: item.dMethod,
        tension: item.tension,
        shear: item.shear,
      })),
    })),
    fabricatedSections,
    rolledSections,
    combinedSections,
  };
  saveToFile(xchArr, "openFrames", "xch");
}

export function importOFs(
  dispatch: Dispatch<any>,
  projects: Project[],
  materials: Material[],
  json: any,
  allProfiles: Section[],
  newFabricatedSections: Section[],
  newRolledSections: RolledSection[],
  newCombinedSections: CombinedSection[]
) {
  const newName = `XCH Project ${getIndexName(projects, "XCH Project")}`;

  let xchProject: Project = {
    name: newName,
    models: [],
    modelType: "Open Frame",
    designCode: "IS 800 : 2007 LSD",
    ladderParams: { ...initLadderParams },
    loadings: { ...initLoadings },
    indianDesignCode: { ...initialIndianDesignCode },
    americanDesignCode: { ...initialAmericanDesignCode },
    pipeDesignCode: { ...initPipeDesignCode },
    settings: { ...initSettings },
    pipeLoadings: { ...initPipingLoad },
  };

  let ui: ProjectUI = {
    ...initialStateProjectUI,
    project: xchProject.name,
  };

  let openFrameUI = ui.openFrameUI;

  const getDirection = (beam: TBeamElement): Direction2 | undefined => {
    if (beam.startPos.x === beam.endPos.x) {
      if (beam.startPos.z > beam.endPos.z) {
        return "-Z";
      } else return "+Z";
    } else if (beam.startPos.z === beam.endPos.z) {
      if (beam.startPos.x > beam.endPos.x) {
        return "-X";
      } else return "+X";
    } else {
      return undefined;
    }
  };

  const getVector = (obj: any) => {
    return new Vector3(obj.x, obj.y, obj.z);
  };

  for (const modelItem of json.models) {
    const parameters: OFFramesParametersUI[] = openFrameUI.frames.parameters;
    const relocations: OFFramesColumnRelocationUI[] =
      openFrameUI.frames.relocations;
    const columns: OFColumnsUI[] = [];
    const beamToBeams: OFBeamToBeamUI[] = [];
    const columnToBeams: OFColumnToBeamUI[] = [];
    const columnToColumns: OFColumnToColumnUI[] = [];
    const cantilevers: OFCantileverUI[] = [];
    const verticalBracings: OFVerticalBracingsUI[] = [];
    const planBracings: OFPlanBracingsUI[] = [];
    const kneeBracings: OFKneeBracingsUI[] = [];
    const platforms: OFPlatformUI[] = [];
    const circularBP: OFCBasePlateUI[] = [];
    const rectangularBP: OFRBasePlateUI[] = [];
    const circularSF: OFCSpliceFlangeUI[] = [];
    const rectangularSF: OFRSpliceFlangeUI[] = [];

    let model: TOpenFrame = {
      name: modelItem.name,
      type: "Open Frame",
      project: xchProject.name,
      direction: modelItem.direction,
      baseElevation: modelItem.baseElevation,
      startPos: getVector(modelItem.position),
      CSLibrary: modelItem.library,
      frameColProfile: getProfile(allProfiles, modelItem.colProfile)!,
      frameBeamProfile: getProfile(allProfiles, modelItem.beamProfile)!,
      frameTieProfile: getProfile(allProfiles, modelItem.tieProfile)!,
      material: getMaterial(materials, modelItem.material),
      frames: [],
      columns: [],
      beams: [],
      cantilevers: [],
      verticalBracings: [],
      horizontalBracings: [],
      kneeBracings: [],
      staircases: [],
      accessories: modelItem.accessories ?? [],
      platforms: [],
      circularBP: [],
      rectangularBP: [],
      circularSF: [],
      rectangularSF: [],
      pipes: [],
    };

    modelItem.frames.forEach((item: any) => {
      const frame: TFrameOF = {
        id: item.id,
        name: item.name,
        model: model.name,
        height: item.height,
        width: item.width,
        chainage: item.chainage,
        columns: item.noOfColumns,
        tiers: item.noOfTiers,
        supportType: item.supportType,
      };
      model = { ...model, frames: [...model.frames, frame] };
      const frameUI: OFFramesParametersUI = {
        id: item.id,
        selected: false,
        frame: item.name,
        model: model.name,
        totalHeight: item.height,
        width: item.width,
        chainage: item.chainage,
        noOfColumns: item.noOfColumns,
        noOfTiers: item.noOfTiers,
        supportType: item.supportType,
      };
      parameters.push(frameUI);
    });

    modelItem.columns.forEach((item: any) => {
      const column: TColumnOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "COLUMN",
        secondType: "ADDITIONAL",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        pos: getVector(item.noRelocationPosition),
        startPos: getVector(item.startPos),
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos: getVector(item.endPos),
      };
      model = { ...model, columns: [...model.columns, column] };
    });

    modelItem.cantilevers.forEach((item: any) => {
      const startPos = getVector(item.startPos);
      const endPos = getVector(item.endPos);
      const cnt: TCantileverOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "CANTILEVER",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        direction: item.direction,
        startPos,
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos,
      };
      cnt.direction = getDirection(cnt)!;
      model = { ...model, cantilevers: [...model.cantilevers, cnt] };
    });

    modelItem.beams.forEach((item: any) => {
      const startPos = getVector(item.startPos);
      const endPos = getVector(item.endPos);
      const beam: TBeamOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "BEAM",
        secondType: "GENERAL",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        direction: getSimpleDirection(startPos, endPos) as SimpleDirection,
        startPos,
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos,
      };
      model = { ...model, beams: [...model.beams, beam] };
    });

    modelItem.vbracings.forEach((item: any) => {
      const startPos = getVector(item.startPos);
      const endPos = getVector(item.endPos);
      const vb: TVerticalBracingOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "VERTICAL-BRACING",
        secondType: startPos.y < endPos.y ? "Diagonal Up" : "Diagonal Down",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        isUp: startPos.y < endPos.y,
        prev: item.prev,
        startPos,
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos,
        next: item.next,
      };
      model = { ...model, verticalBracings: [...model.verticalBracings, vb] };
    });

    modelItem.hbracings.forEach((item: any) => {
      const hb: THorizontalBracingOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "HORIZONTAL-BRACING",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        startPos: getVector(item.startPos),
        connectedTo: item.connectedTo ?? "BEAM",
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos: getVector(item.endPos),
      };
      model = {
        ...model,
        horizontalBracings: [...model.horizontalBracings, hb],
      };
    });

    modelItem.kneeBracings.forEach((item: any) => {
      const kb: TKneeBracingOF = {
        id: item.id,
        name: item.name,
        frame: item.frame,
        type: "KNEE-BRACING",
        profile: getProfile(allProfiles, item.profile)!,
        orientation: item.orientation,
        startPos: getVector(item.startPos),
        startConnected: [],
        connected: [],
        endConnected: [],
        endPos: getVector(item.endPos),
      };
      model = { ...model, kneeBracings: [...model.kneeBracings, kb] };
    });

    modelItem.platforms.forEach((item: any) => {
      const platform: TPlatformOF = {
        id: item.id,
        name: item.name,
        from: item.from,
        to: item.to,
        width: item.width,
        thickness: item.thickness,
        distance: item.distance,
      };
      model = { ...model, platforms: [...model.platforms, platform] };
      const platformUI: OFPlatformUI = {
        id: item.id,
        selected: false,
        model: model.name,
        name: item.name,
        from: item.from,
        to: item.to,
        width: item.width,
        thickness: item.thickness,
        distanceFromLeft: item.distance,
      };
      platforms.push(platformUI);
    });

    modelItem.cPlates.forEach((item: any) => {
      const plate: TCBasePlateOF = {
        id: item.id,
        name: item.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        anchorBoltDiameter: item.boltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      model = { ...model, circularBP: [...model.circularBP, plate] };
      const plateUI: OFCBasePlateUI = {
        id: item.id,
        selected: false,
        model: model.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        anchorBoltDiameter: item.boltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      circularBP.push(plateUI);
    });

    modelItem.rPlates.forEach((item: any) => {
      const plate: TRBasePlateOF = {
        id: item.id,
        name: item.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        anchorBoltDiameter: item.boltDiameter,
        countAlongLength: item.boltCountAlongLength,
        countAlongWidth: item.boltCountAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      model = { ...model, rectangularBP: [...model.rectangularBP, plate] };
      const plateUI: OFRBasePlateUI = {
        id: item.id,
        selected: false,
        model: model.name,
        column: item.column,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        anchorBoltDiameter: item.boltDiameter,
        countAlongLength: item.boltCountAlongLength,
        countAlongWidth: item.boltCountAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      rectangularBP.push(plateUI);
    });

    modelItem.cFlange.forEach((item: any) => {
      const flange: TCSpliceFlangeOF = {
        id: item.id,
        name: item.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateDiameter: item.bottomPlateDiameter,
        anchorBoltDiameter: item.boltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      model = { ...model, circularSF: [...model.circularSF, flange] };
      const flangeUI: OFCSpliceFlangeUI = {
        id: item.id,
        selected: false,
        model: model.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateDiameter: item.plateDiameter,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateDiameter: item.bottomPlateDiameter,
        anchorBoltDiameter: item.boltDiameter,
        boltBCD: item.boltBCD,
        boltNos: item.boltNos,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerNos: item.stiffenerNos,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      circularSF.push(flangeUI);
    });

    modelItem.cFlange.forEach((item: any) => {
      const flange: TRSpliceFlangeOF = {
        id: item.id,
        name: item.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateLength: item.bottomPlateLength,
        bottomPlateWidth: item.bottomPlateWidth,
        anchorBoltDiameter: item.boltDiameter,
        countAlongLength: item.boltCountAlongLength,
        countAlongWidth: item.boltCountAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      model = { ...model, rectangularSF: [...model.rectangularSF, flange] };
      const flangeUI: OFRSpliceFlangeUI = {
        id: item.id,
        selected: false,
        model: model.name,
        column: item.column,
        elevation: item.elevation,
        plateThickness: item.plateThickness,
        plateLength: item.plateLength,
        plateWidth: item.plateWidth,
        bottomPlateThickness: item.bottomPlateThickness,
        bottomPlateLength: item.bottomPlateLength,
        bottomPlateWidth: item.bottomPlateWidth,
        anchorBoltDiameter: item.boltDiameter,
        countAlongLength: item.boltCountAlongLength,
        countAlongWidth: item.boltCountAlongWidth,
        firstRowFromCenter_L: item.firstRowFromCenter_L,
        rowToRow_L: item.rowToRow_L,
        firstRowFromCenter_W: item.firstRowFromCenter_W,
        rowToRow_W: item.rowToRow_W,
        stiffenerThickness: item.stiffenerThickness,
        stiffenerHeight: item.stiffenerHeight,
        stiffenerAlongWeb: item.stiffenerAlongWeb,
        stiffenerAlongFlange: item.stiffenerAlongFlange,
        grade: item.grade,
        dMethod: item.designMethod,
        tension: item.tension,
        shear: item.shear,
      };
      rectangularSF.push(flangeUI);
    });

    for (const item of model.columns) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.beams) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.cantilevers) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.verticalBracings) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.horizontalBracings) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.kneeBracings) {
      model = updateConnections(model, item, () => {});
    }
    for (const item of model.staircases) {
      model = updateConnections(model, item, () => {});
    }

    for (const frame of parameters) {
      for (let i = 0; i < frame.noOfColumns; i++) {
        const columnDistance = frame.width / (frame.noOfColumns - 1);
        const leftZ = frame.width / -2;
        const z = leftZ + columnDistance * i;
        const pos = new Vector3(frame.chainage, model.baseElevation, z);
        for (const el of model.columns) {
          if (el.startPos.equals(pos) && el.endPos.y <= frame.totalHeight) {
            el.secondType = "GENERAL";
          }
        }
      }
    }

    for (const item of model.columns) {
      if (item.secondType !== "ADDITIONAL") continue;
      const lowerBeam = [...model.beams, ...model.cantilevers].find((el) =>
        item.startConnected.includes(el.name)
      );
      if (!lowerBeam) continue;
      const columnUI: OFColumnsUI = {
        id: getNextId(columns),
        selected: false,
        model: model.name,
        lowerBeam: lowerBeam.name,
        distance: roundM(lowerBeam.startPos.distanceTo(item.startPos)),
        height: roundM(item.startPos.distanceTo(item.endPos)),
        library: getProfileLibrary(item.profile),
        profile: item.profile,
        orientation: item.orientation,
      };
      columns.push(columnUI);
      item.uiId = columnUI.id;
    }

    for (const item of model.cantilevers) {
      const column = model.columns.find((el) =>
        item.startConnected.includes(el.name)
      );
      const cntUI: OFCantileverUI = {
        id: getNextId(cantilevers),
        selected: false,
        profile: item.profile,
        direction: getDirection(item),
        elevation: item.startPos.y,
        length: roundM(item.startPos.distanceTo(item.endPos)),
        column: column?.name,
        library: getProfileLibrary(item.profile),
        model: model.name,
      };
      item.uiId = cntUI.id;
      cantilevers.push(cntUI);
    }

    for (const item of model.beams) {
      const from =
        model.columns.find((el) => item.startConnected.includes(el.name)) ??
        [...model.beams, ...model.cantilevers].find((el) =>
          item.startConnected.includes(el.name)
        );
      const to =
        model.columns.find((el) => item.endConnected.includes(el.name)) ??
        [...model.beams, ...model.cantilevers].find((el) =>
          item.endConnected.includes(el.name)
        );
      if (!from) continue;
      if (from.type === "COLUMN") {
        if (to) {
          if (to.type === "COLUMN") {
            const columnToColumn: OFColumnToColumnUI = {
              id: getNextId(columnToColumns),
              selected: false,
              model: model.name,
              elevation: item.startPos.y,
              direction: getDirection(item),
              column: from.name,
              library: getProfileLibrary(item.profile),
              profile: item.profile,
            };
            columnToColumns.push(columnToColumn);
            item.uiId = columnToColumn.id;
            item.secondType = "CtoC";
          } else {
            const columnToBeam: OFColumnToBeamUI = {
              id: getNextId(columnToBeams),
              selected: false,
              model: model.name,
              column: from.name,
              beam: to.name,
              library: getProfileLibrary(item.profile),
              profile: item.profile,
            };
            columnToBeams.push(columnToBeam);
            item.uiId = columnToBeam.id;
            item.secondType = "CtoB";
          }
        } else {
          const cntUI: OFCantileverUI = {
            id: getNextId(cantilevers),
            selected: false,
            profile: item.profile,
            direction: getDirection(item),
            elevation: item.startPos.y,
            length: roundM(item.startPos.distanceTo(item.endPos)),
            column: from.name,
            library: getProfileLibrary(item.profile),
            model: model.name,
          };
          cantilevers.push(cntUI);
          const cnt: TCantileverOF = {
            id: getNextId(model.cantilevers),
            uiId: cntUI.id,
            name: `CNT${getIndexName(model.cantilevers, "CNT")}`,
            frame: item.frame,
            type: "CANTILEVER",
            profile: item.profile,
            orientation: item.orientation,
            direction: getDirection(item)!,
            startPos: item.startPos,
            startConnected: [],
            connected: [],
            endConnected: [],
            endPos: item.endPos,
          };
          model = removeConnections(model, item, true);
          model = updateConnections(model, cnt, () => {});
        }
      } else if (to && to.type !== "COLUMN") {
        const beamToBeam: OFBeamToBeamUI = {
          id: getNextId(beamToBeams),
          selected: false,
          model: model.name,
          from: from.name,
          to: to.name,
          distance: roundM(from.startPos.distanceTo(item.startPos)),
          library: getProfileLibrary(item.profile),
          profile: item.profile,
        };
        beamToBeams.push(beamToBeam);
        item.uiId = beamToBeam.id;
        item.secondType = "BtoB";
      }
    }

    for (const item of model.horizontalBracings) {
      const from = [...model.beams, ...model.cantilevers].find((el) =>
        item.startConnected.includes(el.name)
      );
      const to = [...model.beams, ...model.cantilevers].find((el) =>
        item.endConnected.includes(el.name)
      );
      if (!from || !to) continue;
      const hbUI: OFPlanBracingsUI = {
        id: getNextId(planBracings),
        selected: false,
        model: model.name,
        library: getProfileLibrary(item.profile),
        profile: item.profile,
        fromBeam: from.name,
        fromBeamDFS: roundM(from.startPos.distanceTo(item.startPos)),
        toBeam: to.name,
        toBeamDFS: roundM(to.startPos.distanceTo(item.endPos)),
      };
      item.uiId = hbUI.id;
      planBracings.push(hbUI);
    }

    for (const item of model.kneeBracings) {
      const beam = [...model.beams, ...model.cantilevers].find((el) =>
        item.startConnected.includes(el.name)
      );
      const column = model.columns.find((el) =>
        el.endConnected.includes(el.name)
      );
      if (!beam || !column) continue;
      const kbUI: OFKneeBracingsUI = {
        id: getNextId(kneeBracings),
        selected: false,
        model: model.name,
        profile: item.profile,
        library: getProfileLibrary(item.profile),
        fromBeamJunction: roundM(beam.startPos.distanceTo(item.startPos)),
        fromColumnJunction: roundM(beam.startPos.y - item.endPos.y),
        beam: beam.name,
        column: column.name,
      };
      item.uiId = kbUI.id;
      kneeBracings.push(kbUI);
    }

    for (const item of model.verticalBracings) {
      const from = [...model.columns, ...model.beams].find((el) =>
        item.startConnected.includes(el.name)
      );
      const to = [...model.columns, ...model.beams].find((el) =>
        item.endConnected.includes(el.name)
      );
      if (!from || !to) continue;
      if (from.type === "COLUMN" && to.type === "COLUMN") {
        const vbUI: OFVerticalBracingsUI = {
          id: getNextId(verticalBracings),
          selected: false,
          model: model.name,
          fromColumn: from.name,
          toColumn: to.name,
          profile: item.profile,
          library: getProfileLibrary(item.profile),
          type: item.secondType,
        };
        item.uiId = vbUI.id;
        verticalBracings.push(vbUI);
      } else {
        const kbUI: OFKneeBracingsUI = {
          id: getNextId(kneeBracings),
          selected: false,
          model: model.name,
          profile: item.profile,
          library: getProfileLibrary(item.profile),
          fromBeamJunction: roundM(from.startPos.distanceTo(item.startPos)),
          fromColumnJunction: roundM(from.startPos.y - item.endPos.y),
          beam: from.name,
          column: to.name,
        };
        kneeBracings.push(kbUI);
        const kb: TKneeBracingOF = {
          id: getNextId(model.kneeBracings),
          uiId: kbUI.id,
          name: `KB${getIndexName(model.kneeBracings, "KB")}`,
          frame: item.frame,
          type: "KNEE-BRACING",
          profile: item.profile,
          orientation: item.orientation,
          startPos: item.startPos,
          startConnected: [],
          connected: [],
          endConnected: [],
          endPos: item.endPos,
        };
        model = removeConnections(model, item, true);
        model = updateConnections(model, kb, () => {});
      }
    }

    xchProject = { ...xchProject, models: [...xchProject.models, model] };

    openFrameUI = {
      ...openFrameUI,
      frames: { ...openFrameUI.frames, parameters, relocations },
      additionalBeams: {
        columns,
        beamToBeam: beamToBeams,
        columnToBeam: columnToBeams,
        columnToColumn: columnToColumns,
        cantilever: cantilevers,
        verticalBracings,
        planBracings,
        kneeBracings,
        staircases: [],
      },
      platforms,
      basePlates: {
        concreteGrade: concreteGrade[0],
        circular: circularBP,
        rectangular: rectangularBP,
      },
      spliceFlanges: { circular: circularSF, rectangular: rectangularSF },
    };
  }

  ui = { ...ui, openFrameUI };
  dispatch(
    createXCHProjectOF(
      xchProject,
      newFabricatedSections,
      newRolledSections,
      newCombinedSections
    )
  );
  dispatch(createUI_XCH_OF(ui));
  if (json.camera) {
    dispatch(
      focusTarget(
        new Vector3(
          json.camera.target.x,
          json.camera.target.y,
          json.camera.target.z
        ),
        new Vector3(
          json.camera.position.x,
          json.camera.position.y,
          json.camera.position.z
        )
      )
    );
  }
}
