import { Dispatch } from "redux";
import { action } from "typesafe-actions";
import {
  MainActionTypes,
  Model,
  Loadings,
  LadderParams,
  LoadedProject,
  IndianDesignCode,
  AmericanDesignCode,
  Project,
  TReactionSupport,
  TMemberEndForce,
  TMemberStressCheck,
  TNodeDisplacement,
  PipeRack,
  ModelType,
  TSeismicLoad,
  TProjectMode,
  FreePipe,
  TLoadToStructure,
  TLoadToStructureElement,
  TDeflectionCheck,
  TWorkMode,
  TDashboard,
  FreeCable,
} from "./types";
import axios, { AxiosResponse } from "axios";
import { getJSONForDesignCodesAndParameters } from "../../components/3d-models/designCodeAndParameters";
import { Scene } from "three";
import {
  addEventAction,
  changeProjectRequestProgressAction,
  changeModelAnalysisUIAction,
} from "../ui/actions";
import { TOpenFrame } from "./openFrameTypes";
import { getJSONForDesignCodesAndParametersOF } from "../../components/3d-models/designCodeAndParametersOF";
import { getPipeAnalysisJSON } from "../../components/3d-models/freePipes";
import {
  ReactionSupportUI,
  MemberEndForceUI,
  NodeDisplacementUI,
  MemberStressCheckUI,
  ProjectUI,
  PipeThicknessCheckUI,
  DeflectionCheckUI,
  NodalStressCheckUI,
} from "../ui/types";
import {
  Section,
  RolledSection,
  Material,
  CombinedSection,
  TPipingElbow,
  TClash,
} from "../data/types";
import {
  TPipeAnalysis,
  TPipeCheckParams,
  TPipeSeismicLoad,
  TFlangeCheck,
  TAccessoryMTO,
  TPipeMTO,
  TPipeLoadCombination,
} from "./pipeTypes";
import { baseUrl } from "./constants";
import {
  replaceSplitNumber,
  getUnicuesArray,
  roundM,
  openFile,
} from "../../components/3d-models/utils";
import { TProcessImport } from "../process/types";
import { API_ROOT } from "../../pages/utils/agent";
import { parse } from "papaparse";
import { TFlare, TInitFlare } from "./types/flare";
import saveAs from "file-saver";
import { batch } from "react-redux";

export const jsonOptions = {
  headers: { "Content-Type": "application/json" },
};

export const setProductsAction = (products: string[]) =>
  action(MainActionTypes.SET_PRODUCTS, { products });

export const changeWorkModeAction = (mode: TWorkMode) =>
  action(MainActionTypes.CHANGE_WORK_MODE, { mode });

export const changeActiveTab = (tabName: string) =>
  action(MainActionTypes.CHANGE_ACTIVE_TAB, { tabName });

export const loadProject = (project: LoadedProject) =>
  action(MainActionTypes.LOAD_PROJECT, { project });

export const createProject = (name: string) =>
  action(MainActionTypes.CREATE_PROJECT, { name });

export const createXCHProject = (
  models: PipeRack[],
  ladderParams: LadderParams,
  fSections: Section[],
  rSections: RolledSection[],
  cSections: CombinedSection[],
  loadings: Loadings
) =>
  action(MainActionTypes.CREATE_XCH_PROJECT, {
    models,
    ladderParams,
    fSections,
    rSections,
    cSections,
    loadings,
  });

export const createXCHProjectOF = (
  project: Project,
  fSections: Section[],
  rSections: RolledSection[],
  cSections: CombinedSection[]
) =>
  action(MainActionTypes.CREATE_XCH_PROJECT_OF, {
    project,
    fSections,
    rSections,
    cSections,
  });

export const createXCHProjectPipes = (project: Project, UDEs: TPipingElbow[]) =>
  action(MainActionTypes.CREATE_XCH_PROJECT_PIPES, { project, UDEs });

export const selectProject = (name: string) =>
  action(MainActionTypes.SELECT_PROJECT, { name });

export const removeProject = (name: string) =>
  action(MainActionTypes.REMOVE_PROJECT, { name });

export const renameProject = (oldName: string, newName: string) =>
  action(MainActionTypes.RENAME_PROJECT, { oldName, newName });

export const setModelTypeAndMaterial = (mat: Material, type: ModelType) =>
  action(MainActionTypes.SET_TYPE_AND_MATERIAL, { type, mat });

export const changeFabracatedSections = (sections: Section[]) =>
  action(MainActionTypes.CHANGE_FABRICATED_SECTIONS, { sections });

export const changeRolledSections = (sections: RolledSection[]) =>
  action(MainActionTypes.CHANGE_ROLLED_SECTIONS, { sections });

export const changeCombinedSections = (sections: CombinedSection[]) =>
  action(MainActionTypes.CHANGE_COMBINED_SECTIONS, { sections });

export const changeUserDefinedElbows = (UDEs: TPipingElbow[]) =>
  action(MainActionTypes.CHANGE_USER_DEFINED_ELBOWS, { UDEs });

export const createModel = (model: Model) =>
  action(MainActionTypes.CREATE_MODEL, { model });

export const changeModel = (model: Model) =>
  action(MainActionTypes.CHANGE_MODEL, { model });

export const removeModel = (name: string) =>
  action(MainActionTypes.REMOVE_MODEL, { name });

export const changeLoadings = (loadings: Loadings) =>
  action(MainActionTypes.CHANGE_LOADINGS, { loadings });

export const changeLadderParams = (ladderParams: LadderParams) =>
  action(MainActionTypes.CHANGE_LADDER_PARAMS, { ladderParams });

export const changeIndianDCAction = (data: IndianDesignCode) =>
  action(MainActionTypes.CHANGE_INDIAN_DC, { data });

export const changeAmericanDCAction = (data: AmericanDesignCode) =>
  action(MainActionTypes.CHANGE_AMERICAN_DC, { data });

export const changeProjectAction = (project: Project) =>
  action(MainActionTypes.CHANGE_PROJECT, { project });

export const changeProjectByNameAction = (name: string, params: any) =>
  action(MainActionTypes.CHANGE_PROJECT_BY_NAME, { name, params });

export const setPipesAction = (freePipes: FreePipe[]) =>
  action(MainActionTypes.SET_PIPES, { freePipes });

/*export const setCablesAction = (freeCable: FreeCable[]) =>
  action(MainActionTypes.SET_CABLES, { freeCable });*/

export const changePipeAnalysisAction = (
  project: string,
  analysis: TPipeAnalysis
) => action(MainActionTypes.CHANGE_PIPE_ANALYSIS, { project, analysis });

export const changeStressCheckParamsAction = (params: TPipeCheckParams) =>
  action(MainActionTypes.CHANGE_STRESS_CHECK_PARAMS, { params });

export const changeThicknessCheckParamsAction = (params: TPipeCheckParams) =>
  action(MainActionTypes.CHANGE_THICKNESS_CHECK_PARAMS, { params });

export const changeFlangeCheckParamsAction = (params: TPipeCheckParams) =>
  action(MainActionTypes.CHANGE_FLANGE_CHECK_PARAMS, { params });

export const setReportsAction = (
  projectName: string,
  reactionSupports: TReactionSupport[],
  memberEndForces: TMemberEndForce[],
  nodeDisplacements: TNodeDisplacement[],
  memberStressCheck: TMemberStressCheck[],
  elements: any
) =>
  action(MainActionTypes.GET_REPORTS, {
    projectName,
    reactionSupports,
    memberEndForces,
    nodeDisplacements,
    memberStressCheck,
    elements,
  });

export const getAndMapReports = async (
  dispatch: Dispatch<any>,
  models: PipeRack[],
  scene: Scene,
  project: Project
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  dispatch(changeProjectRequestProgressAction(project.name, "weight"));
  const jsons = models.map((model, i, arr) => ({
    ...getJSONForDesignCodesAndParameters(scene, project, model, arr),
    structuralNaturalFrequency: model.structuralNaturalFrequency ?? 0,
  }));
  let analysisURL = "";
  switch (project.loadings.windLoadingAsPerCode) {
    case "IS Code":
      analysisURL = `${baseUrl}api/v2/piperack/IS875/analyse`;
      break;
    case "US Code":
      analysisURL = `${baseUrl}api/v2/piperack/asce710/analyse`;
      break;
    case "Manual":
      analysisURL = `${baseUrl}api/v2/piperack/manual/analyse`;
  }
  const weightURL = `${baseUrl}api/v2/piperack/calculate/weight`;
  for (const json of jsons) {
    let reactionSupports: TReactionSupport[] = [];
    const memberEndForces: TMemberEndForce[] = [];
    const nodeDisplacements: TNodeDisplacement[] = [];
    const memberStressChecks: TMemberStressCheck[] = [];
    const deflectionChecks: TDeflectionCheck[] = [];
    const model = json.piperackName;
    const str = JSON.stringify(json);
    try {
      const responseA = await axios.post(analysisURL, str, jsonOptions);
      try {
        const storage = localStorage.getItem("analysis");
        if (storage) {
          const obj = JSON.parse(storage);
          localStorage.setItem(
            "analysis",
            JSON.stringify({ ...obj, [json.id]: responseA.data })
          );
        } else {
          localStorage.setItem(
            "analysis",
            JSON.stringify({ [json.id]: responseA.data })
          );
        }
      } catch (e) {
        dispatch(
          addEventAction(
            `Reports${
              model ? ` (${model})` : ""
            }: Error saving to local storage of browser`,
            "danger"
          )
        );
      }

      Object.entries(responseA.data.solverOutputMap).forEach(([key, item]) => {
        (item as any).nodeOutputList &&
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({ ...nodeItem, LCNumber: key, model })
          );

        (item as any).elementOutputList &&
          Object.values(
            (item as any).elementOutputList
          ).forEach((elementItem: any) =>
            memberEndForces.push({ ...elementItem, LCNumber: key, model })
          );

        (item as any).reactionList &&
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.find(
              (rs) =>
                rs.model === model &&
                rs.LCNumber === key &&
                rs.nodeNumber === nodeItem.nodeNumber
            );
            if (reactionSupport) {
              reactionSupports = reactionSupports.map((rs) =>
                rs.LCNumber === reactionSupport.LCNumber &&
                rs.nodeNumber === reactionSupport.nodeNumber
                  ? { ...rs, [nodeItem.type]: nodeItem.value }
                  : rs
              );
            } else {
              reactionSupports.push({
                model,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as TReactionSupport);
            }
          });
      });
      let stressChecks: any;
      switch (project.designCode) {
        case "IS 800 : 2007 LSD":
          stressChecks = responseA.data.piperackMemberCheckIS;
          break;
        case "AISC LRFD":
          stressChecks = responseA.data.piperackMemberCheckUS;
          break;
      }
      if (!stressChecks) stressChecks = responseA.data.memberCheck;
      if (!stressChecks) stressChecks = responseA.data.piperackMemberCheck;
      stressChecks &&
        Object.entries(stressChecks).forEach(([key, item]) => {
          const elementNumber = +key ?? 0;
          memberStressChecks.push({
            model,
            LCNumber: (item as any).loadCombinationNumber,
            actual: (item as any).actualStressRatio,
            allowable: (item as any).allowableStressRatio,
            result: (item as any).result,
            elementNumber,
            elementName:
              json.members.find((member: any) => member.label === elementNumber)
                ?.name ?? "unknown",
          });
        });
      responseA.data.deflectionCheckResults &&
        Object.entries(responseA.data.deflectionCheckResults).forEach(
          ([key, item]) => {
            const elementNumber = +key ?? 0;
            deflectionChecks.push({
              model,
              LCNumber: (item as any).loadCombination,
              actual: (item as any).actualDeflection,
              allowable: (item as any).allowableDeflection,
              utilizationRatio: (item as any).utilizationRatio,
              length: (item as any).deflectionLength,
              result: (item as any).result,
              elementNumber,
              elementName:
                json.members.find(
                  (member: any) => member.label === elementNumber
                )?.name ?? "unknown",
            });
          }
        );
      const responseW = await axios.post(weightURL, str, jsonOptions);
      dispatch(
        changeModelAnalysisUIAction(
          project.name,
          model,
          project.loadings.loadCombinations,
          {
            reactionSupports,
            memberEndForces,
            nodeDisplacements,
            memberStressChecks,
            deflectionChecks,
            nodes: json.nodes,
            beamNodes: json.beamNodes,
            beamElements: json.beamElements,
            members: json.members,
            weightSummary: responseW,
          }
        )
      );
    } catch (error) {
      dispatch(
        addEventAction(
          `Reports${model ? ` (${model})` : ""}: ${error}`,
          "danger"
        )
      );
    }
  }
  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
  dispatch(changeProjectRequestProgressAction(project.name, "weight", false));
};

export const getAndMapReportsOF = async (
  dispatch: Dispatch<any>,
  models: TOpenFrame[],
  scene: Scene,
  project: Project,
  ui: ProjectUI
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  dispatch(changeProjectRequestProgressAction(project.name, "weight"));
  const jsons = models.map((model, i, arr) =>
    getJSONForDesignCodesAndParametersOF(
      ui.openFrameUI,
      ui.designCodeAndParametersUI,
      scene,
      project,
      model,
      arr
    )
  );
  let analysisURL = "";
  switch (ui.openFrameUI.loadingsUI.windLoadUI.windLoadingAsPerCode) {
    case "IS Code":
      analysisURL = `${baseUrl}api/v2/openFrame/IS875/analyse`;
      break;
    case "US Code":
      analysisURL = `${baseUrl}api/v2/openFrame/asce710/analyse`;
      break;
    case "Manual":
      analysisURL = `${baseUrl}api/v2/openFrame/manual/analyse`;
  }
  const weightURL = `${baseUrl}api/v2/openFrame/calculate/weight`;
  for (const json of jsons) {
    let reactionSupports: ReactionSupportUI[] = [];
    const memberEndForces: MemberEndForceUI[] = [];
    const nodeDisplacements: NodeDisplacementUI[] = [];
    const memberStressChecks: MemberStressCheckUI[] = [];
    const deflectionChecks: TDeflectionCheck[] = [];
    const model = json.openFrameName;
    const str = JSON.stringify(json);
    try {
      const responseA = await axios.post(analysisURL, str, jsonOptions);
      try {
        const storage = localStorage.getItem("analysis");
        if (storage) {
          const obj = JSON.parse(storage);
          localStorage.setItem(
            "analysis",
            JSON.stringify({ ...obj, [json.id]: responseA.data })
          );
        } else {
          localStorage.setItem(
            "analysis",
            JSON.stringify({ [json.id]: responseA.data })
          );
        }
      } catch (e) {
        dispatch(
          addEventAction(
            `Reports${
              model ? ` (${model})` : ""
            }: Error saving to local storage of browser`,
            "danger"
          )
        );
      }

      Object.entries(responseA.data.solverOutputMap).forEach(([key, item]) => {
        (item as any).nodeOutputList &&
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({ ...nodeItem, LCNumber: key, model })
          );

        (item as any).elementOutputList &&
          Object.values(
            (item as any).elementOutputList
          ).forEach((elementItem: any) =>
            memberEndForces.push({ ...elementItem, LCNumber: key, model })
          );

        (item as any).reactionList &&
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.find(
              (rs) =>
                rs.model &&
                rs.LCNumber === key &&
                rs.nodeNumber === nodeItem.nodeNumber
            );
            if (reactionSupport) {
              reactionSupports = reactionSupports.map((rs) =>
                rs.LCNumber === reactionSupport.LCNumber &&
                rs.nodeNumber === reactionSupport.nodeNumber
                  ? { ...rs, [nodeItem.type]: nodeItem.value }
                  : rs
              );
            } else {
              reactionSupports.push({
                model,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as TReactionSupport);
            }
          });
      });
      let stressChecks: any;
      switch (ui.designCodeAndParametersUI.designCode) {
        case "IS 800 : 2007 LSD":
          stressChecks = responseA.data.memberCheckIS;
          break;
        case "AISC LRFD":
          stressChecks = responseA.data.memberCheckUS;
          break;
      }
      if (!stressChecks) stressChecks = responseA.data.memberCheck;
      stressChecks &&
        Object.entries(stressChecks).forEach(([key, item]) => {
          const elementNumber = +key ?? 0;
          memberStressChecks.push({
            model,
            LCNumber: (item as any).loadCombinationNumber,
            actual: (item as any).actualStressRatio,
            allowable: (item as any).allowableStressRatio,
            result: (item as any).result,
            elementNumber,
            elementName:
              json.members.find((member: any) => member.label === elementNumber)
                ?.name ?? "unknown",
          });
        });
      responseA.data.deflectionCheckResults &&
        Object.entries(responseA.data.deflectionCheckResults).forEach(
          ([key, item]) => {
            const elementNumber = +key ?? 0;
            deflectionChecks.push({
              model,
              LCNumber: (item as any).loadCombination,
              actual: (item as any).actualDeflection,
              allowable: (item as any).allowableDeflection,
              utilizationRatio: (item as any).utilizationRatio,
              length: (item as any).deflectionLength,
              result: (item as any).result,
              elementNumber,
              elementName:
                json.members.find(
                  (member: any) => member.label === elementNumber
                )?.name ?? "unknown",
            });
          }
        );
      const responseW = await axios.post(weightURL, str, jsonOptions);
      dispatch(
        changeModelAnalysisUIAction(
          project.name,
          model,
          ui.openFrameUI.loadingsUI.loadCombinations.loadCombinations,
          {
            reactionSupports,
            memberEndForces,
            nodeDisplacements,
            memberStressChecks,
            deflectionChecks,
            nodes: json.nodes,
            beamNodes: json.beamNodes,
            beamElements: json.beamElements,
            members: json.members,
            weightSummary: responseW,
          }
        )
      );
    } catch (error) {
      dispatch(
        addEventAction(
          `Reports${model ? ` (${model})` : ""}: ${error}`,
          "danger"
        )
      );
    }
  }

  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
  dispatch(changeProjectRequestProgressAction(project.name, "weight", false));
};

export const importOFReports = (
  dispatch: Dispatch<any>,
  models: TOpenFrame[],
  scene: Scene,
  project: Project,
  ui: ProjectUI
) => {
  openFile(
    [".json"],
    async (files) => {
      const jsons = models.map((model, i, arr) =>
        getJSONForDesignCodesAndParametersOF(
          ui.openFrameUI,
          ui.designCodeAndParametersUI,
          scene,
          project,
          model,
          arr
        )
      );

      const fileJsons: any[] = [];

      for (const file of files) {
        const text = await file.text();
        fileJsons.push(JSON.parse(text) as any);
      }

      for (const json of jsons) {
        let reactionSupports: ReactionSupportUI[] = [];
        const memberEndForces: MemberEndForceUI[] = [];
        const nodeDisplacements: NodeDisplacementUI[] = [];
        const memberStressChecks: MemberStressCheckUI[] = [];
        const deflectionChecks: TDeflectionCheck[] = [];
        const model = json.openFrameName;

        const res = fileJsons.find(
          (fileJson) => fileJson.openFrameId === json.id
        );

        if (!res) continue;

        const storage = localStorage.getItem("analysis") ?? "{}";
        const obj = JSON.parse(storage);
        localStorage.setItem(
          "analysis",
          JSON.stringify({ ...obj, [json.id]: res })
        );
        Object.entries(res.solverOutputMap).forEach(([key, item]) => {
          (item as any).nodeOutputList &&
            Object.values(
              (item as any).nodeOutputList
            ).forEach((nodeItem: any) =>
              nodeDisplacements.push({ ...nodeItem, LCNumber: key, model })
            );

          (item as any).elementOutputList &&
            Object.values(
              (item as any).elementOutputList
            ).forEach((elementItem: any) =>
              memberEndForces.push({ ...elementItem, LCNumber: key, model })
            );

          (item as any).reactionList &&
            Object.values((item as any).reactionList).forEach(
              (nodeItem: any) => {
                const reactionSupport = reactionSupports.find(
                  (rs) =>
                    rs.model &&
                    rs.LCNumber === key &&
                    rs.nodeNumber === nodeItem.nodeNumber
                );
                if (reactionSupport) {
                  reactionSupports = reactionSupports.map((rs) =>
                    rs.LCNumber === reactionSupport.LCNumber &&
                    rs.nodeNumber === reactionSupport.nodeNumber
                      ? { ...rs, [nodeItem.type]: nodeItem.value }
                      : rs
                  );
                } else {
                  reactionSupports.push({
                    model,
                    LCNumber: key,
                    nodeNumber: nodeItem.nodeNumber,
                    [nodeItem.type]: nodeItem.value,
                  } as TReactionSupport);
                }
              }
            );
        });
        let stressChecks: any;
        switch (ui.designCodeAndParametersUI.designCode) {
          case "IS 800 : 2007 LSD":
            stressChecks = res.memberCheckIS;
            break;
          case "AISC LRFD":
            stressChecks = res.memberCheckUS;
            break;
        }
        if (!stressChecks) stressChecks = res.memberCheck;
        stressChecks &&
          Object.entries(stressChecks).forEach(([key, item]) => {
            const elementNumber = +key ?? 0;
            memberStressChecks.push({
              model,
              LCNumber: (item as any).loadCombinationNumber,
              actual: (item as any).actualStressRatio,
              allowable: (item as any).allowableStressRatio,
              result: (item as any).result,
              elementNumber,
              elementName:
                json.members.find(
                  (member: any) => member.label === elementNumber
                )?.name ?? "unknown",
            });
          });
        res.deflectionCheckResults &&
          Object.entries(res.deflectionCheckResults).forEach(([key, item]) => {
            const elementNumber = +key ?? 0;
            deflectionChecks.push({
              model,
              LCNumber: (item as any).loadCombination,
              actual: (item as any).actualDeflection,
              allowable: (item as any).allowableDeflection,
              utilizationRatio: (item as any).utilizationRatio,
              length: (item as any).deflectionLength,
              result: (item as any).result,
              elementNumber,
              elementName:
                json.members.find(
                  (member: any) => member.label === elementNumber
                )?.name ?? "unknown",
            });
          });
        dispatch(
          changeModelAnalysisUIAction(
            project.name,
            model,
            ui.openFrameUI.loadingsUI.loadCombinations.loadCombinations,
            {
              reactionSupports,
              memberEndForces,
              nodeDisplacements,
              memberStressChecks,
              deflectionChecks,
              nodes: json.nodes,
              beamNodes: json.beamNodes,
              beamElements: json.beamElements,
              members: json.members,
              weightSummary: undefined,
            }
          )
        );
      }
    },
    true
  );
};

export const getAndMapSeismicLoads = (
  dispatch: Dispatch<any>,
  models: PipeRack[],
  scene: Scene,
  project: Project
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "seismic"));
  const requests: Promise<AxiosResponse>[] = [];
  const jsons = models
    .filter((model) => {
      if (!model.structuralNaturalFrequency) {
        dispatch(
          addEventAction(
            `Seismic Weight: Calculate the natural frequency for the ${model.name}`,
            "warning"
          )
        );
        return false;
      }
      return true;
    })
    .map((model, i, arr) => ({
      ...getJSONForDesignCodesAndParameters(scene, project, model, arr),
      structuralNaturalFrequency: model.structuralNaturalFrequency ?? 0,
    }));
  jsons.forEach((json) => {
    requests.push(
      axios.post(
        `${baseUrl}api/v2/piperack/IS875/seismic`,
        JSON.stringify(json),
        jsonOptions
      )
    );
  });
  Promise.allSettled(requests).then((responses) => {
    let seismicLoads: TSeismicLoad[] = [];
    for (const response of responses) {
      if (response.status === "fulfilled") {
        Object.values(response.value.data).forEach((item: any) => {
          seismicLoads = [
            ...seismicLoads,
            {
              id: seismicLoads.length,
              prNo: item.pipeRackName,
              tierNo: item.tierNo,
              nodeNo: item.nodeNo,
              seismicWeight: item.seismicWeight,
            },
          ];
        });
      } else {
        const body = JSON.parse(response.reason.config.data ?? "{}");
        dispatch(
          addEventAction(
            `Seismic Weight${
              body.piperackName ? ` (${body.piperackName})` : ""
            }: ${response.reason.message}`,
            "danger"
          )
        );
      }
    }
    dispatch(setSeismicLoads(project.name, seismicLoads));
    dispatch(
      changeProjectRequestProgressAction(project.name, "seismic", false)
    );
  });
};

export const setSeismicLoads = (project: string, loads: TSeismicLoad[]) =>
  action(MainActionTypes.GET_SEISMIC_LOADS, { project, loads });

export const changeNotEditableProjects = (projects: Project[]) =>
  action(MainActionTypes.CHANGE_NOT_EDITABLE_PROJECTS, { projects });

export const changeNotEditableProcesses = (processes: any[]) =>
  action(MainActionTypes.CHANGE_NOT_EDITABLE_PROCESSES, { processes });

export const getAndMapPipeAnalysis = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  lines: FreePipe[][],
  lcs: TPipeLoadCombination[]
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  let url = `${baseUrl}api/v2/piping/IS875/analyse`;
  switch (project.pipeLoadings?.windLoad.windLoadingAsPerCode) {
    case "IS Code":
      url = `${baseUrl}api/v2/piping/IS875/analyse`;
      break;
    case "US Code":
      url = `${baseUrl}api/v2/piping/asce710/analyse`;
      break;
    case "Manual":
      url = `${baseUrl}api/v2/piping/manual/analyse`;
  }

  for (const pipes of lines) {
    const combinationRS = new Map<string, Map<number, ReactionSupportUI>>();
    const memberEndForces: MemberEndForceUI[] = [];
    const memberStressChecks: MemberStressCheckUI[] = [];
    const nodalStressChecks: NodalStressCheckUI[] = [];
    const thicknessChecks: PipeThicknessCheckUI[] = [];
    const nodeDisplacements: NodeDisplacementUI[] = [];
    const deflectionChecks: DeflectionCheckUI[] = [];
    const flangeChecks: TFlangeCheck[] = [];
    const pipeMTO: TPipeMTO[] = [];
    const accessoryMTO: TAccessoryMTO[] = [];

    const { json } = getPipeAnalysisJSON(project, pipes, lcs, scene);
    const lineNo = `${json.lineNo}`;
    const members: any[] = json.members ?? [];
    const elements: any = json.beamElements ?? {};
    const nodes: any = json.nodes ?? {};

    try {
      const response = await axios.post(url, JSON.stringify(json), jsonOptions);
      const data = response.data;
      try {
        const storage = localStorage.getItem("analysis");
        if (storage) {
          const obj = JSON.parse(storage);
          localStorage.setItem(
            "analysis",
            JSON.stringify({ ...obj, [json.id]: data })
          );
        } else {
          localStorage.setItem("analysis", JSON.stringify({ [json.id]: data }));
        }
      } catch (e) {
        dispatch(
          addEventAction(
            `Pipe Analysis${
              json.lineNo ? ` (${json.lineNo})` : ""
            }: Error saving to local storage of browser`,
            "danger"
          )
        );
      }

      Object.entries(data.solverOutputMap).forEach(([key, item]) => {
        const reactionSupports =
          combinationRS.get(key) ?? new Map<number, ReactionSupportUI>();
        if ((item as any).nodeOutputList) {
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({
              ...nodeItem,
              model: lineNo,
              LCNumber: key,
            })
          );
        }
        if ((item as any).elementOutputList) {
          Object.values((item as any).elementOutputList).forEach(
            (elementItem: any) => {
              const member = members.find(
                (m: any) => m.label === elementItem.elementNumber
              );
              memberEndForces.push({
                ...elementItem,
                model: lineNo,
                LCNumber: key,
                elementName: member?.name,
              });
            }
          );
        }
        if ((item as any).reactionList) {
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.get(nodeItem.nodeNumber);
            if (reactionSupport) {
              reactionSupports.set(nodeItem.nodeNumber, {
                ...reactionSupport,
                [nodeItem.type]: nodeItem.value,
              });
            } else {
              reactionSupports.set(nodeItem.nodeNumber, {
                model: lineNo,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as ReactionSupportUI);
            }
          });
        }
        combinationRS.set(key, reactionSupports);
      });

      Object.values(data.designCheckResults).forEach((combinations: any) => {
        for (const combination of Object.values(combinations) as any[]) {
          const member = members.find(
            (m: any) => m.label === combination.label
          );
          const element = elements[combination.label];
          const node1 = element ? nodes[element.nodes[0]] : undefined;
          const node2 = element ? nodes[element.nodes[1]] : undefined;
          const common = {
            model: lineNo,
            elementNumber: combination.label,
            elementName: member?.name,
            LCNumber: `${combination.loadCombinationNumber}`,
            x1: node1?.x ?? 0,
            y1: node1?.y ?? 0,
            z1: node1?.z ?? 0,
            x2: node2?.x ?? 0,
            y2: node2?.y ?? 0,
            z2: node2?.z ?? 0,
            od: member?.pipeouterdiameter ?? 0,
            wt: member?.pipewallthickness ?? 1,
          };
          memberStressChecks.push({
            ...common,
            actual: combination.actualStressRatio,
            allowable: combination.allowableStressRatio,
            result: combination.stressResult,
          });
          thicknessChecks.push({
            ...common,
            providedThickness: combination.providedThickness,
            requiredThickness: combination.requiredThickness,
            utilizationRatio: combination.utilizationRatio,
            result: combination.thicknessResult,
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node1?.nodeNumber,
            flexibilityFactor: combination.startNodeFlexibilityFactor,
            outOfPlaneSIF: combination.startNodeOutOfPlaneSIF,
            inPlaneSIF: combination.startNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtStartNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtStartNode),
            result:
              combination.actualStressRatioAtStartNode > 1 ? "Fail" : "Pass",
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node2?.nodeNumber,
            flexibilityFactor: combination.endNodeFlexibilityFactor,
            outOfPlaneSIF: combination.endNodeOutOfPlaneSIF,
            inPlaneSIF: combination.endNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtEndNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtEndNode),
            result:
              combination.actualStressRatioAtEndNode > 1 ? "Fail" : "Pass",
          });
        }
      });

      Object.values(data.flageCheckResults).forEach((val: any) => {
        const check: TFlangeCheck = {
          line: lineNo,
          pipe: json.flangeData[val.element]?.pipe,
          nodeNo: val.node,
          flangeAt: json.flangeData[val.element]?.flangeAt,
          type: val.type,
          material: val.material,
          class: val.class,
          result: val.result,
          allowableLoad: val.allowableLoad,
          criticalLoadDir: val.criticalDirection,
          loadCase: val.loadConditionNumber,
          loadValue: val.loadValue,
          nps: json.flangeData[val.element]?.nps,
          utilizationRatio: val.utilizationRatio,
        };
        flangeChecks.push(check);
      });

      for (const combinations of Object.values(data.deflectionCheckResults)) {
        for (const combination of Object.values(combinations as any) as any[]) {
          deflectionChecks.push({
            model: lineNo,
            elementName: "",
            elementNumber: combination.nodeNumber,
            actual: combination.actualDeflection,
            LCNumber: combination.loadCombination,
            result: combination.result,
            allowable: 0,
            length: 0,
            utilizationRatio: 0,
          });
        }
      }

      if (data.weightSummaryResults) {
        for (const spd of data.weightSummaryResults.straightPipeData ?? []) {
          pipeMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            size: spd.name,
            material: spd.material,
            weight: spd.weight,
            length: spd.length,
          });
        }
        for (const fd of data.weightSummaryResults.flangeData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: fd.type,
            size: fd.nps,
            class: fd.class,
            nos: fd.count,
            weight: fd.weight,
          });
        }
        for (const vd of data.weightSummaryResults.valveData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: (vd as any).type,
            size: (vd as any).nps,
            class: (vd as any).class,
            nos: (vd as any).count,
            weight: (vd as any).weight,
          });
        }
        for (const bd of data.weightSummaryResults.bendsData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: bd.type,
            size: bd.nps,
            schedule: bd.schedule,
            nos: 1,
            weight: bd.weight,
          });
        }
      }

      dispatch(
        changeModelAnalysisUIAction(project.name, lineNo, lcs, {
          reactionSupports: [...combinationRS.values()].reduce((acc, map) => {
            return [...acc, ...map.values()];
          }, [] as ReactionSupportUI[]),
          memberEndForces,
          nodeDisplacements,
          memberStressChecks,
          nodalStressChecks,
          deflectionChecks,
          thicknessChecks,
          flangeChecks,
          pipeMTO,
          accessoryMTO,
          nodes: json.nodes,
          beamNodes: json.beamNodes,
          beamElements: json.beamElements,
          // @ts-ignore
          members: json.members,
        })
      );
    } catch (error) {
      dispatch(
        addEventAction(
          `Pipe Analysis${json.lineNo ? ` (${json.lineNo})` : ""}: ${
            error.message
          }`,
          "danger"
        )
      );
    }
  }
  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
};

// sending all the the pipes together to analyse
/*export const getAndMapPipeAnalysisAll = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  lines: FreePipe[][],
  lcs: TPipeLoadCombination[]
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  let url = `${baseUrl}api/v2/piping/IS875/analyseAll`;

  switch (project.pipeLoadings?.windLoad.windLoadingAsPerCode) {
    case "IS Code":
      url = `${baseUrl}api/v2/piping/IS875/analyseAll`;
      break;
    case "US Code":
      url = `${baseUrl}api/v2/piping/asce710/analyseAll`;
      break;
    case "Manual":
      url = `${baseUrl}api/v2/piping/manual/analyseAll`;
      break;
  }

  const allLinesJsonData = lines.map(pipes => getPipeAnalysisJSON(project, pipes, lcs, scene).json);

  try {
    const response = await axios.post(url, JSON.stringify(allLinesJsonData), jsonOptions);
    const allData: any[] = await response.data;

    allData.forEach((lineData: any, index: number) => {
      // Retrieve the corresponding line's JSON data
      const lineJson = allLinesJsonData[index];
      const lineNo = `${lineJson.lineNo}`;
      const members: any[] = lineJson.members ?? [];
      const elements: any = lineJson.beamElements ?? {};
      const nodes: any = lineJson.nodes ?? {};

      // Initialize variables for storing processed data
      // Similar to what you have in `getAndMapPipeAnalysis`
      const combinationRS = new Map<string, Map<number, ReactionSupportUI>>();
      const memberEndForces: MemberEndForceUI[] = [];
      const memberStressChecks: MemberStressCheckUI[] = [];
      const nodalStressChecks: NodalStressCheckUI[] = [];
      const thicknessChecks: PipeThicknessCheckUI[] = [];
      const nodeDisplacements: NodeDisplacementUI[] = [];
      const deflectionChecks: DeflectionCheckUI[] = [];
      const flangeChecks: TFlangeCheck[] = [];
      const pipeMTO: TPipeMTO[] = [];
      const accessoryMTO: TAccessoryMTO[] = [];

      // Process lineData (analysis results for the line)
      Object.entries(lineData.solverOutputMap).forEach(([key, item]) => {
        const reactionSupports =
          combinationRS.get(key) ?? new Map<number, ReactionSupportUI>();
        if ((item as any).nodeOutputList) {
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({
              ...nodeItem,
              model: lineNo,
              LCNumber: key,
            })
          );
        }
        if ((item as any).elementOutputList) {
          Object.values((item as any).elementOutputList).forEach(
            (elementItem: any) => {
              const member = members.find(
                (m: any) => m.label === elementItem.elementNumber
              );
              memberEndForces.push({
                ...elementItem,
                model: lineNo,
                LCNumber: key,
                elementName: member?.name,
              });
            }
          );
        }
        if ((item as any).reactionList) {
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.get(nodeItem.nodeNumber);
            if (reactionSupport) {
              reactionSupports.set(nodeItem.nodeNumber, {
                ...reactionSupport,
                [nodeItem.type]: nodeItem.value,
              });
            } else {
              reactionSupports.set(nodeItem.nodeNumber, {
                model: lineNo,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as ReactionSupportUI);
            }
          });
        }
        combinationRS.set(key, reactionSupports);
      });

      // Update local storage and dispatch actions
      Object.values(lineData.designCheckResults).forEach((combinations: any) => {
        for (const combination of Object.values(combinations) as any[]) {
          const member = members.find(
            (m: any) => m.label === combination.label
          );
          const element = elements[combination.label];
          const node1 = element ? nodes[element.nodes[0]] : undefined;
          const node2 = element ? nodes[element.nodes[1]] : undefined;
          const common = {
            model: lineNo,
            elementNumber: combination.label,
            elementName: member?.name,
            LCNumber: `${combination.loadCombinationNumber}`,
            x1: node1?.x ?? 0,
            y1: node1?.y ?? 0,
            z1: node1?.z ?? 0,
            x2: node2?.x ?? 0,
            y2: node2?.y ?? 0,
            z2: node2?.z ?? 0,
            od: member?.pipeouterdiameter ?? 0,
            wt: member?.pipewallthickness ?? 1,
          };
          memberStressChecks.push({
            ...common,
            actual: combination.actualStressRatio,
            allowable: combination.allowableStressRatio,
            result: combination.stressResult,
          });
          thicknessChecks.push({
            ...common,
            providedThickness: combination.providedThickness,
            requiredThickness: combination.requiredThickness,
            utilizationRatio: combination.utilizationRatio,
            result: combination.thicknessResult,
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node1?.nodeNumber,
            flexibilityFactor: combination.startNodeFlexibilityFactor,
            outOfPlaneSIF: combination.startNodeOutOfPlaneSIF,
            inPlaneSIF: combination.startNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtStartNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtStartNode),
            result:
              combination.actualStressRatioAtStartNode > 1 ? "Fail" : "Pass",
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node2?.nodeNumber,
            flexibilityFactor: combination.endNodeFlexibilityFactor,
            outOfPlaneSIF: combination.endNodeOutOfPlaneSIF,
            inPlaneSIF: combination.endNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtEndNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtEndNode),
            result:
              combination.actualStressRatioAtEndNode > 1 ? "Fail" : "Pass",
          });
        }
      });

      Object.values(lineData.flageCheckResults).forEach((val: any) => {
        const check: TFlangeCheck = {
          line: lineNo,
          pipe: lineJson.flangeData[val.element]?.pipe,
          nodeNo: val.node,
          flangeAt: lineJson.flangeData[val.element]?.flangeAt,
          type: val.type,
          material: val.material,
          class: val.class,
          result: val.result,
          allowableLoad: val.allowableLoad,
          criticalLoadDir: val.criticalDirection,
          loadCase: val.loadConditionNumber,
          loadValue: val.loadValue,
          nps: lineJson.flangeData[val.element]?.nps,
          utilizationRatio: val.utilizationRatio,
        };
        flangeChecks.push(check);
      });

      for (const combinations of Object.values(lineData.deflectionCheckResults)) {
        for (const combination of Object.values(combinations as any) as any[]) {
          deflectionChecks.push({
            model: lineNo,
            elementName: "",
            elementNumber: combination.nodeNumber,
            actual: combination.actualDeflection,
            LCNumber: combination.loadCombination,
            result: combination.result,
            allowable: 0,
            length: 0,
            utilizationRatio: 0,
          });
        }
      }

      if (lineData.weightSummaryResults) {
        for (const spd of lineData.weightSummaryResults.straightPipeData ?? []) {
          pipeMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            size: spd.name,
            material: spd.material,
            weight: spd.weight,
            length: spd.length,
          });
        }
        for (const fd of lineData.weightSummaryResults.flangeData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: fd.type,
            size: fd.nps,
            class: fd.class,
            nos: fd.count,
            weight: fd.weight,
          });
        }
        for (const vd of lineData.weightSummaryResults.valveData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: (vd as any).type,
            size: (vd as any).nps,
            class: (vd as any).class,
            nos: (vd as any).count,
            weight: (vd as any).weight,
          });
        }
        for (const bd of lineData.weightSummaryResults.bendsData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: bd.type,
            size: bd.nps,
            schedule: bd.schedule,
            nos: 1,
            weight: bd.weight,
          });
        }
      }
      // Dispatch the update for this line
      dispatch(changeModelAnalysisUIAction(project.name, lineNo, lcs, {
        reactionSupports: [...combinationRS.values()].reduce((acc, map) => {
          return [...acc, ...map.values()];
        }, [] as ReactionSupportUI[]),
        memberEndForces,
        nodeDisplacements,
        memberStressChecks,
        nodalStressChecks,
        deflectionChecks,
        thicknessChecks,
        flangeChecks,
        pipeMTO,
        accessoryMTO,
        nodes: lineJson.nodes,
        beamNodes: lineJson.beamNodes,
        beamElements: lineJson.beamElements,
        // @ts-ignore
        members: lineJson.members,
        }
      )
      );
    });

  } catch (error) {
    dispatch(addEventAction(`Pipe Analysis: ${error.message}`, "danger"));
  }

  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
};*/
// old method of dividing and sending ten 10 pipes in a group together
export const getAndMapPipeAnalysisAll = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  lines: FreePipe[][],
  lcs: TPipeLoadCombination[]
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  let url = `${baseUrl}api/v2/piping/IS875/analyseAll`;

  switch (project.pipeLoadings?.windLoad.windLoadingAsPerCode) {
    case "IS Code":
      url = `${baseUrl}api/v2/piping/IS875/analyseAll`;
      break;
    case "US Code":
      url = `${baseUrl}api/v2/piping/asce710/analyseAll`;
      break;
    case "Manual":
      url = `${baseUrl}api/v2/piping/manual/analyseAll`;
      break;
  }

  const chunkArray = <T>(array: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
      array.slice(i * size, i * size + size)
    );
  };

  const lineBatches = chunkArray(lines, 5);

  for (const batch of lineBatches) {

    const allLinesJsonData = batch.map(pipes => getPipeAnalysisJSON(project, pipes, lcs, scene).json);

  try {
    const response = await axios.post(url, JSON.stringify(allLinesJsonData), jsonOptions);
    const allData: any[] = await response.data;

    allData.forEach((lineData: any, index: number) => {
      // Retrieve the corresponding line's JSON data
      const lineJson = allLinesJsonData[index];
      const lineNo = `${lineJson.lineNo}`;
      const members: any[] = lineJson.members ?? [];
      const elements: any = lineJson.beamElements ?? {};
      const nodes: any = lineJson.nodes ?? {};

      // Initialize variables for storing processed data
      const combinationRS = new Map<string, Map<number, ReactionSupportUI>>();
      const memberEndForces: MemberEndForceUI[] = [];
      const memberStressChecks: MemberStressCheckUI[] = [];
      const nodalStressChecks: NodalStressCheckUI[] = [];
      const thicknessChecks: PipeThicknessCheckUI[] = [];
      const nodeDisplacements: NodeDisplacementUI[] = [];
      const deflectionChecks: DeflectionCheckUI[] = [];
      const flangeChecks: TFlangeCheck[] = [];
      const pipeMTO: TPipeMTO[] = [];
      const accessoryMTO: TAccessoryMTO[] = [];

      // Process lineData (analysis results for the line)
      Object.entries(lineData.solverOutputMap).forEach(([key, item]: any) => {
        const reactionSupports =
          combinationRS.get(key) ?? new Map<number, ReactionSupportUI>();
        const lctype = `${item.loadCombinationName}`;
        if ((item as any).nodeOutputList) {
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({
              ...nodeItem,
              model: lineNo,
              LCNumber: key,
              LCType: lctype,
            })
          );
        }
        if ((item as any).elementOutputList) {
          Object.values((item as any).elementOutputList).forEach(
            (elementItem: any) => {
              const member = members.find(
                (m: any) => m.label === elementItem.elementNumber
              );
              memberEndForces.push({
                ...elementItem,
                model: lineNo,
                LCNumber: key,
                LCType: lctype,
                elementName: member?.name,
              });
            }
          );
        }
        if ((item as any).reactionList) {
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.get(nodeItem.nodeNumber);
            if (reactionSupport) {
              reactionSupports.set(nodeItem.nodeNumber, {
                ...reactionSupport,
                [nodeItem.type]: nodeItem.value,
              });
            } else {
              reactionSupports.set(nodeItem.nodeNumber, {
                model: lineNo,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as ReactionSupportUI);
            }
          });
        }
        combinationRS.set(key, reactionSupports);
      });

      // Update local storage and dispatch actions
      Object.values(lineData.designCheckResults).forEach((combinations: any) => {
        for (const combination of Object.values(combinations) as any[]) {
          const member = members.find(
            (m: any) => m.label === combination.label
          );
          const element = elements[combination.label];
          const node1 = element ? nodes[element.nodes[0]] : undefined;
          const node2 = element ? nodes[element.nodes[1]] : undefined;
          const common = {
            model: lineNo,
            elementNumber: combination.label,
            elementName: member?.name,
            LCNumber: `${combination.loadCombinationNumber}`,
            LCType: `${combination.loadCombinationName}`, //new addition for LCType

            x1: node1?.x ?? 0,
            y1: node1?.y ?? 0,
            z1: node1?.z ?? 0,
            x2: node2?.x ?? 0,
            y2: node2?.y ?? 0,
            z2: node2?.z ?? 0,
            od: member?.pipeouterdiameter ?? 0,
            wt: member?.pipewallthickness ?? 1,
          };
          memberStressChecks.push({
            ...common,
            actual: combination.actualStressRatio,      
            allowable: combination.allowableStressRatio,
            result: combination.stressResult,
          });
          thicknessChecks.push({
            ...common,
            providedThickness: combination.providedThickness,
            requiredThickness: combination.requiredThickness,
            utilizationRatio: combination.utilizationRatio,
            result: combination.thicknessResult,
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node1?.nodeNumber,
            LCType: `${combination.loadCombinationName}`,
            flexibilityFactor: combination.startNodeFlexibilityFactor,
            outOfPlaneSIF: combination.startNodeOutOfPlaneSIF,
            inPlaneSIF: combination.startNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtStartNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtStartNode),
            result:
              combination.actualStressRatioAtStartNode > 1 ? "Fail" : "Pass",
          });
        }
      });

      Object.values(lineData.flageCheckResults).forEach((val: any) => {
        const check: TFlangeCheck = {
          line: lineNo,
          pipe: lineJson.flangeData[val.element]?.pipe,
          nodeNo: val.node,
          flangeAt: lineJson.flangeData[val.element]?.flangeAt,
          type: val.type,
          material: val.material,
          class: val.class,
          result: val.result,
          allowableLoad: val.allowableLoad,
          criticalLoadDir: val.criticalDirection,
          loadCase: val.loadConditionNumber,
          loadValue: val.loadValue,
          nps: lineJson.flangeData[val.element]?.nps,
          utilizationRatio: val.utilizationRatio,
        };
        flangeChecks.push(check);
      });

      for (const combinations of Object.values(lineData.deflectionCheckResults)) {
        for (const combination of Object.values(combinations as any) as any[]) {
          deflectionChecks.push({
            model: lineNo,
            elementName: "",
            elementNumber: combination.nodeNumber,
            actual: combination.actualDeflection,
            LCNumber: combination.loadCombination,
            LCType: combination.loadCombinationName,
            result: combination.result,
            allowable: 0,
            length: 0,
            utilizationRatio: 0,
          });
        }
      }

      if (lineData.weightSummaryResults) {
        for (const spd of lineData.weightSummaryResults.straightPipeData ?? []) {
          pipeMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            size: spd.name,
            material: spd.material,
            weight: spd.weight,
            length: spd.length,
          });
        }
        for (const fd of lineData.weightSummaryResults.flangeData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: fd.type,
            size: fd.nps,
            class: fd.class,
            nos: fd.count,
            weight: fd.weight,
          });
        }
        for (const vd of lineData.weightSummaryResults.valveData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: (vd as any).type,
            size: (vd as any).nps,
            class: (vd as any).class,
            nos: (vd as any).count,
            weight: (vd as any).weight,
          });
        }
        for (const bd of lineData.weightSummaryResults.bendsData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: bd.type,
            size: bd.nps,
            schedule: bd.schedule,
            nos: 1,
            weight: bd.weight,
          });
        }
      }
      // Dispatch the update for this line
      dispatch(changeModelAnalysisUIAction(project.name, lineNo, lcs, {
        reactionSupports: [...combinationRS.values()].reduce((acc, map) => {
          return [...acc, ...map.values()];
        }, [] as ReactionSupportUI[]),
        memberEndForces,
        nodeDisplacements,
        memberStressChecks,
        nodalStressChecks,
        deflectionChecks,
        thicknessChecks,
        flangeChecks,
        pipeMTO,
        accessoryMTO,
        nodes: lineJson.nodes,
        beamNodes: lineJson.beamNodes,
        beamElements: lineJson.beamElements,
        // @ts-ignore
        members: lineJson.members,
        }
      )
      );
    });

  } catch (error) {
    dispatch(addEventAction(`Pipe Analysis: ${error.message}`, "danger"));
  }
}

  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
}

// new method of sending all the pipes together in multiple async api calls
 /*export const getAndMapPipeAnalysisAll = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  lines: FreePipe[][],
  lcs: TPipeLoadCombination[]
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "reports"));
  let url = `${baseUrl}api/v2/piping/IS875/analyseAll`;

  switch (project.pipeLoadings?.windLoad.windLoadingAsPerCode) {
    case "IS Code":
      url = `${baseUrl}api/v2/piping/IS875/analyseAll`;
      break;
    case "US Code":
      url = `${baseUrl}api/v2/piping/asce710/analyseAll`;
      break;
    case "Manual":
      url = `${baseUrl}api/v2/piping/manual/analyseAll`;
    break;
  }

  const chunkArray = <T>(array: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
      array.slice(i * size, i * size + size)
    );
  };

  const lineBatches = chunkArray(lines, 10);
  const promises = lineBatches.map(batch => {
    const allLinesJsonData = batch.map(pipes => getPipeAnalysisJSON(project, pipes, lcs, scene).json);
    return axios.post(url, JSON.stringify(allLinesJsonData), jsonOptions)
      .then(response => ({response, allLinesJsonData}))
      .catch(error => ({error}));
  });

  const results = await Promise.all(promises);

  for(const result of results) {
    if('error' in result) {
      dispatch(addEventAction(`Pipe Analysis: ${result.error.message}`, "danger"));
      continue;
    }

  const {response, allLinesJsonData} = result;
  const allData = await response.data;
    allData.forEach((lineData: any, index: number) => {
      // Retrieve the corresponding line's JSON data
      const lineJson = allLinesJsonData[index];
      const lineNo = `${lineJson.lineNo}`;
      const members: any[] = lineJson.members ?? [];
      const elements: any = lineJson.beamElements ?? {};
      const nodes: any = lineJson.nodes ?? {};

      // Initialize variables for storing processed data
      const combinationRS = new Map<string, Map<number, ReactionSupportUI>>();
      const memberEndForces: MemberEndForceUI[] = [];
      const memberStressChecks: MemberStressCheckUI[] = [];
      const nodalStressChecks: NodalStressCheckUI[] = [];
      const thicknessChecks: PipeThicknessCheckUI[] = [];
      const nodeDisplacements: NodeDisplacementUI[] = [];
      const deflectionChecks: DeflectionCheckUI[] = [];
      const flangeChecks: TFlangeCheck[] = [];
      const pipeMTO: TPipeMTO[] = [];
      const accessoryMTO: TAccessoryMTO[] = [];

      // Process lineData (analysis results for the line)
      Object.entries(lineData.solverOutputMap).forEach(([key, item]) => {
        const reactionSupports =
          combinationRS.get(key) ?? new Map<number, ReactionSupportUI>();
        if ((item as any).nodeOutputList) {
          Object.values((item as any).nodeOutputList).forEach((nodeItem: any) =>
            nodeDisplacements.push({
              ...nodeItem,
              model: lineNo,
              LCNumber: key,
            })
          );
        }
        if ((item as any).elementOutputList) {
          Object.values((item as any).elementOutputList).forEach(
            (elementItem: any) => {
              const member = members.find(
                (m: any) => m.label === elementItem.elementNumber
              );
              memberEndForces.push({
                ...elementItem,
                model: lineNo,
                LCNumber: key,
                elementName: member?.name,
              });
            }
          );
        }
        if ((item as any).reactionList) {
          Object.values((item as any).reactionList).forEach((nodeItem: any) => {
            const reactionSupport = reactionSupports.get(nodeItem.nodeNumber);
            if (reactionSupport) {
              reactionSupports.set(nodeItem.nodeNumber, {
                ...reactionSupport,
                [nodeItem.type]: nodeItem.value,
              });
            } else {
              reactionSupports.set(nodeItem.nodeNumber, {
                model: lineNo,
                LCNumber: key,
                nodeNumber: nodeItem.nodeNumber,
                [nodeItem.type]: nodeItem.value,
              } as ReactionSupportUI);
            }
          });
        }
        combinationRS.set(key, reactionSupports);
      });

      // Update local storage and dispatch actions
      Object.values(lineData.designCheckResults).forEach((combinations: any) => {
        for (const combination of Object.values(combinations) as any[]) {
          const member = members.find(
            (m: any) => m.label === combination.label
          );
          const element = elements[combination.label];
          const node1 = element ? nodes[element.nodes[0]] : undefined;
          const node2 = element ? nodes[element.nodes[1]] : undefined;
          const common = {
            model: lineNo,
            elementNumber: combination.label,
            elementName: member?.name,
            LCNumber: `${combination.loadCombinationNumber}`,
            x1: node1?.x ?? 0,
            y1: node1?.y ?? 0,
            z1: node1?.z ?? 0,
            x2: node2?.x ?? 0,
            y2: node2?.y ?? 0,
            z2: node2?.z ?? 0,
            od: member?.pipeouterdiameter ?? 0,
            wt: member?.pipewallthickness ?? 1,
          };
          memberStressChecks.push({
            ...common,
            actual: combination.actualStressRatio,
            allowable: combination.allowableStressRatio,
            result: combination.stressResult,
          });
          thicknessChecks.push({
            ...common,
            providedThickness: combination.providedThickness,
            requiredThickness: combination.requiredThickness,
            utilizationRatio: combination.utilizationRatio,
            result: combination.thicknessResult,
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node1?.nodeNumber,
            flexibilityFactor: combination.startNodeFlexibilityFactor,
            outOfPlaneSIF: combination.startNodeOutOfPlaneSIF,
            inPlaneSIF: combination.startNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtStartNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtStartNode),
            result:
              combination.actualStressRatioAtStartNode > 1 ? "Fail" : "Pass",
          });
          nodalStressChecks.push({
            model: lineNo,
            LCNumber: `${combination.loadCombinationNumber}`,
            elementNumber: combination.label,
            nodeNumber: node2?.nodeNumber,
            flexibilityFactor: combination.endNodeFlexibilityFactor,
            outOfPlaneSIF: combination.endNodeOutOfPlaneSIF,
            inPlaneSIF: combination.endNodeInPlaneSIF,
            actualMPa: roundM(combination.actualStressAtEndNode),
            allowableMPa: roundM(combination.allowableStress),
            ratio: roundM(combination.actualStressRatioAtEndNode),
            result:
              combination.actualStressRatioAtEndNode > 1 ? "Fail" : "Pass",
          });
        }
      });

      Object.values(lineData.flageCheckResults).forEach((val: any) => {
        const check: TFlangeCheck = {
          line: lineNo,
          pipe: lineJson.flangeData[val.element]?.pipe,
          nodeNo: val.node,
          flangeAt: lineJson.flangeData[val.element]?.flangeAt,
          type: val.type,
          material: val.material,
          class: val.class,
          result: val.result,
          allowableLoad: val.allowableLoad,
          criticalLoadDir: val.criticalDirection,
          loadCase: val.loadConditionNumber,
          loadValue: val.loadValue,
          nps: lineJson.flangeData[val.element]?.nps,
          utilizationRatio: val.utilizationRatio,
        };
        flangeChecks.push(check);
      });

      for (const combinations of Object.values(lineData.deflectionCheckResults)) {
        for (const combination of Object.values(combinations as any) as any[]) {
          deflectionChecks.push({
            model: lineNo,
            elementName: "",
            elementNumber: combination.nodeNumber,
            actual: combination.actualDeflection,
            LCNumber: combination.loadCombination,
            result: combination.result,
            allowable: 0,
            length: 0,
            utilizationRatio: 0,
          });
        }
      }

      if (lineData.weightSummaryResults) {
        for (const spd of lineData.weightSummaryResults.straightPipeData ?? []) {
          pipeMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            size: spd.name,
            material: spd.material,
            weight: spd.weight,
            length: spd.length,
          });
        }
        for (const fd of lineData.weightSummaryResults.flangeData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: fd.type,
            size: fd.nps,
            class: fd.class,
            nos: fd.count,
            weight: fd.weight,
          });
        }
        for (const vd of lineData.weightSummaryResults.valveData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: (vd as any).type,
            size: (vd as any).nps,
            class: (vd as any).class,
            nos: (vd as any).count,
            weight: (vd as any).weight,
          });
        }
        for (const bd of lineData.weightSummaryResults.bendsData ?? []) {
          accessoryMTO.push({
            line: lineNo,
            tag: "",
            structure: "",
            type: bd.type,
            size: bd.nps,
            schedule: bd.schedule,
            nos: 1,
            weight: bd.weight,
          });
        }
      }
      // Dispatch the update for this line
      dispatch(changeModelAnalysisUIAction(project.name, lineNo, lcs, {
        reactionSupports: [...combinationRS.values()].reduce((acc, map) => {
          return [...acc, ...map.values()];
        }, [] as ReactionSupportUI[]),
        memberEndForces,
        nodeDisplacements,
        memberStressChecks,
        nodalStressChecks,
        deflectionChecks,
        thicknessChecks,
        flangeChecks,
        pipeMTO,
        accessoryMTO,
        nodes: lineJson.nodes,
        beamNodes: lineJson.beamNodes,
        beamElements: lineJson.beamElements,
        // @ts-ignore
        members: lineJson.members,
        }
      )
      );
    });
    dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
  }
  dispatch(changeProjectRequestProgressAction(project.name, "reports", false));
}*/


export const getAndMapPipeWeights = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  lines: FreePipe[][]
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "weight"));
  const url = `${baseUrl}api/v2/piping/calculate/weight`;

  for (const pipes of lines) {
    const { json } = getPipeAnalysisJSON(
      project,
      pipes,
      project.pipeLoadings.loadCombinations.loads,
      scene
    );
    const lineNo = `${json.lineNo}`;
    try {
      const response = await axios.post(url, JSON.stringify(json), jsonOptions);

      const flangeChecks: TFlangeCheck[] = [];
      const pipeMTO: TPipeMTO[] = [];
      const accessoryMTO: TAccessoryMTO[] = [];

      for (const spd of response.data.straightPipeData ?? []) {
        pipeMTO.push({
          line: lineNo,
          tag: "",
          structure: "",
          size: spd.name,
          material: spd.material,
          weight: spd.weight,
          length: spd.length,
        });
      }
      for (const fd of response.data.flangeData ?? []) {
        accessoryMTO.push({
          line: lineNo,
          tag: "",
          structure: "",
          type: fd.type,
          size: fd.nps,
          class: fd.class,
          nos: fd.count,
          weight: fd.weight,
        });
      }
      for (const vd of response.data.valveData ?? []) {
        accessoryMTO.push({
          line: lineNo,
          tag: "",
          structure: "",
          type: vd.type,
          size: vd.nps,
          class: vd.class,
          nos: vd.count,
          weight: vd.weight,
        });
      }
      for (const bd of response.data.bendsData ?? []) {
        accessoryMTO.push({
          line: lineNo,
          tag: "",
          structure: "",
          type: bd.type,
          size: bd.nps,
          schedule: bd.schedule,
          nos: 1,
          weight: bd.weight,
        });
      }

      dispatch(
        changeModelAnalysisUIAction(
          project.name,
          lineNo,
          project.pipeLoadings.loadCombinations.loads,
          {
            flangeChecks,
            pipeMTO,
            accessoryMTO,
          } as any
        )
      );
    } catch (error) {
      dispatch(
        addEventAction(
          `Pipe Wieght${json.lineNo ? ` (${json.lineNo})` : ""}: ${
            error.message
          }`,
          "danger"
        )
      );
    }
  }
  dispatch(changeProjectRequestProgressAction(project.name, "weight", false));
};

function createTransferLC(project: Project) {
  const init = {
    empty: [] as number[],
    operating: [] as number[],
    test: [] as number[],
    thermal: [] as number[],
    windX: [] as number[],
    windZ: [] as number[],
    psvRelaseOrSurge: [] as number[],
    snowOrIce: [] as number[],
  };
  return (
    project.pipeLoadings?.loadCombinations.loads.reduce((acc, lc) => {
      const changed = {
        empty: lc.isEmpties ? [...acc.empty, lc.LC_No ?? 0] : acc.empty,
        operating: lc.isOperatings
          ? [...acc.operating, lc.LC_No ?? 0]
          : acc.operating,
        test: lc.isTests ? [...acc.test, lc.LC_No ?? 0] : acc.test,
        thermal: lc.isThermals ? [...acc.thermal, lc.LC_No ?? 0] : acc.thermal,
        windX: lc.isWX ? [...acc.windX, lc.LC_No ?? 0] : acc.windX,
        windZ: lc.isWZ ? [...acc.windZ, lc.LC_No ?? 0] : acc.windZ,
        psvRelaseOrSurge: lc.isPSV
          ? [...acc.psvRelaseOrSurge, lc.LC_No ?? 0]
          : acc.psvRelaseOrSurge,
        snowOrIce: lc.isIce ? [...acc.snowOrIce, lc.LC_No ?? 0] : acc.snowOrIce,
      };
      return changed;
    }, init) ?? init
  );
}

export const changeLoadsToStructureAction = (
  project: string,
  loads: TLoadToStructure
) => action(MainActionTypes.CHANGE_PIPE_LOADS_TO_STRUCTURE, { project, loads });

/*export const getAndMapPipeAnalysisToSending = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene
) => {
  dispatch(
    changeProjectRequestProgressAction(project.name, "loadsToStructure")
  );
  const map = new Map<number, FreePipe[]>();
  for (const pipe of project.freePipes ?? []) {
    const pipes = map.get(pipe.line);
    map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
  }
  const url = `${baseUrl}api/v2/piping/IS875/transfer`;

  const sent: TLoadToStructureElement[] = project.loadsToStructure?.sent ?? [];
  let news: TLoadToStructureElement[] = [];
  let deleted: TLoadToStructureElement[] = [...sent];

  for (const pipes of Array.from(map.values())) {
    const json = {
      ...getPipeAnalysisJSON(
        project,
        pipes,
        project.pipeLoadings.loadCombinations.loads,
        scene
      )//, loadTransfer: createTransferLC(project),
    } as any;
    json.json.loadTransfer=createTransferLC(project);
    try {
      const response = await axios.post(url, JSON.stringify(json.json), jsonOptions);

      const data = response.data;
      const line = `${data.lineNo}`;
      for (const item of Object.values(
        data.pipingLoadTransferOutput
      ) as any[]) {
        let newItem: TLoadToStructureElement = {
          id: news.length,
          line,
          pipe: getUnicuesArray(
            `${item.pipeNo}`.split(",").map((p) => replaceSplitNumber(p))
          ).join(", "),
          restraint: item.node,
          type: item.supportType,
          emptyFy: item.emptyFy ? -item.emptyFy : item.emptyFy,
          operatingFy: item.operatingFy ? -item.operatingFy : item.operatingFy,
          testFy: item.testFy ? -item.testFy : item.testFy,
          taFy: item.thermalAnchorFy
            ? -item.thermalAnchorFy
            : item.thermalAnchorFy,
          tfFx: item.thermalFrictionFx,
          tfFz: item.thermalFrictionFz,
          wxFx: item.windXFx,
          wxFy: item.windXFy ? -item.windXFy : item.windXFy,
          wxFz: item.windXFz,
          wzFx: item.windZFx,
          wzFy: item.windZFx ? -item.windZFx : item.windZFx,
          wzFz: item.windZFx,
          psvSurgeFx: item.psvRelaseOrSurgeFx,
          psvSurgeFy: item.psvRelaseOrSurgeFy
            ? -item.psvRelaseOrSurgeFy
            : item.psvRelaseOrSurgeFy,
          psvSurgeFz: item.psvRelaseOrSurgeFz,
          iceSnow: item.snowOrIceFy,
          revision: 0,
          status: "No issued",
        };
        const prev = sent.find(
          (val) =>
            val.line === newItem.line &&
            val.pipe === newItem.pipe &&
            val.restraint === newItem.restraint
        );
        if (prev) {
          deleted = deleted.filter((val) => val.id !== prev.id);
          if (
            prev.type !== newItem.type ||
            prev.emptyFy !== newItem.emptyFy ||
            prev.operatingFy !== newItem.operatingFy ||
            prev.testFy !== newItem.testFy ||
            prev.taFy !== newItem.taFy ||
            prev.tfFx !== newItem.tfFx ||
            prev.tfFz !== newItem.tfFz ||
            prev.wxFx !== newItem.wxFx ||
            prev.wxFy !== newItem.wxFy ||
            prev.wxFz !== newItem.wxFz ||
            prev.wzFx !== newItem.wzFx ||
            prev.wzFy !== newItem.wzFy ||
            prev.wzFz !== newItem.wzFz ||
            prev.psvSurgeFx !== newItem.psvSurgeFx ||
            prev.psvSurgeFy !== newItem.psvSurgeFy ||
            prev.psvSurgeFz !== newItem.psvSurgeFz ||
            prev.iceSnow !== newItem.iceSnow
          ) {
            newItem = {
              ...newItem,
              revision: prev.revision + 1,
              status: "Revised",
            };
          } else {
            newItem = {
              ...newItem,
              revision: prev.revision,
              status: prev.status,
            };
          }
        }
        news.push(newItem);
      }
      // @ts-ignore
      news = [
        ...news,
        ...deleted
          .filter((val) => `${val.line}` === line)
          .map((val) => ({ ...val, status: "Deleted" })),
      ]
        .sort((a, b) => {
          const lines = Number(a.line) - Number(b.line);
          return lines ? lines : Number(a.restraint) - Number(b.restraint);
        })
        .map((val, id) => ({ ...val, id }));
      dispatch(
        changeLoadsToStructureAction(project.name, { sent, last: news })
      );
    } catch (error) {
      dispatch(
        addEventAction(
          `Loads To Structure${json.lineNo ? ` (${json.lineNo})` : ""}: ${
            error.message
          }`,
          "danger"
        )
      );
    }
  }
  dispatch(
    changeProjectRequestProgressAction(project.name, "loadsToStructure", false)
  );
};*/

//New function to perfrom the load transfer top structure
export const getAndMapPipeAnalysisToSending = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene
) => {
  dispatch(
    changeProjectRequestProgressAction(project.name, "loadsToStructure")
  );

  const map = new Map<number, FreePipe[]>();
  for (const pipe of project.freePipes ?? []) {
    const pipes = map.get(pipe.line);
    map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
  }

  const url = `${baseUrl}api/v2/piping/IS875/transferAll`;

  const allPipes = Array.from(map.values());
  const pipeDataList = <any>[];
  const sent: TLoadToStructureElement[] = project.loadsToStructure?.sent ?? [];
  let news: TLoadToStructureElement[] = [];
  let deleted: TLoadToStructureElement[] = [...sent];
  const batchPipes = allPipes.slice(0, allPipes.length);
  batchPipes.forEach(pipes => {
    const pipeData = {
        ...getPipeAnalysisJSON(
          project,
          pipes, 
          project.pipeLoadings.loadCombinations.loads,
          scene
        )
      }.json as any;
      pipeData.loadTransfer = createTransferLC(project); 

      pipeDataList.push(pipeData);
    });

  const chunkyArray = <T>(array: T[], size: number): T[][] => {
    return Array.from({length: Math.ceil(array.length/ size)},(v,i)=>
      array.slice(i * size, i* size + size)
    );
  };

  const lineBatches = chunkyArray(pipeDataList,10);

  for (const batch of lineBatches) {
    try {
      const response = await axios.post(url, JSON.stringify(batch), jsonOptions);
      const allData: any[] = await response.data;
      console.log(allData);
      for(let i = 0; i < allData.length; i++){
        const line = `${allData[i].lineNo}`;
        for (const item of Object.values(
          allData[i].pipingLoadTransferOutput
        ) as any[]) {
          let newItem: TLoadToStructureElement = {
            id: news.length,
            line,
            pipe: getUnicuesArray(
              `${item.pipeNo}`.split(",").map((p) => replaceSplitNumber(p))
            ).join(", "),
            restraint: item.node,
            type: item.supportType,
            emptyFy: item.emptyFy ? -item.emptyFy : item.emptyFy,
            operatingFy: item.operatingFy ? -item.operatingFy : item.operatingFy,
            testFy: item.testFy ? -item.testFy : item.testFy,
            taFy: item.thermalAnchorFy
              ? -item.thermalAnchorFy
              : item.thermalAnchorFy,
            tfFx: item.thermalFrictionFx,
            tfFz: item.thermalFrictionFz,
            wxFx: item.windXFx,
            wxFy: item.windXFy ? -item.windXFy : item.windXFy,
            wxFz: item.windXFz,
            wzFx: item.windZFx,
            wzFy: item.windZFx ? -item.windZFx : item.windZFx,
            wzFz: item.windZFx,
            psvSurgeFx: item.psvRelaseOrSurgeFx,
            psvSurgeFy: item.psvRelaseOrSurgeFy
              ? -item.psvRelaseOrSurgeFy
              : item.psvRelaseOrSurgeFy,
            psvSurgeFz: item.psvRelaseOrSurgeFz,
            iceSnow: item.snowOrIceFy,
            revision: 0,
            status: "No issued",
          };
          const prev = sent.find(
            (val) =>
              val.line === newItem.line &&
              val.pipe === newItem.pipe &&
              val.restraint === newItem.restraint
          );
          if (prev) {
            deleted = deleted.filter((val) => val.id !== prev.id);
            if (
              prev.type !== newItem.type ||
              prev.emptyFy !== newItem.emptyFy ||
              prev.operatingFy !== newItem.operatingFy ||
              prev.testFy !== newItem.testFy ||
              prev.taFy !== newItem.taFy ||
              prev.tfFx !== newItem.tfFx ||
              prev.tfFz !== newItem.tfFz ||
              prev.wxFx !== newItem.wxFx ||
              prev.wxFy !== newItem.wxFy ||
              prev.wxFz !== newItem.wxFz ||
              prev.wzFx !== newItem.wzFx ||
              prev.wzFy !== newItem.wzFy ||
              prev.wzFz !== newItem.wzFz ||
              prev.psvSurgeFx !== newItem.psvSurgeFx ||
              prev.psvSurgeFy !== newItem.psvSurgeFy ||
              prev.psvSurgeFz !== newItem.psvSurgeFz ||
              prev.iceSnow !== newItem.iceSnow
            ) {
              newItem = {
                ...newItem,
                revision: prev.revision + 1,
                status: "Revised",
              };
            } else {
              newItem = {
                ...newItem,
                revision: prev.revision,
                status: prev.status,
              };
            }
          }
          news.push(newItem);
        }
        // @ts-ignore
        news = [
          ...news,
          ...deleted
            .filter((val) => `${val.line}` === line)
            .map((val) => ({ ...val, status: "Deleted" })),
        ]
          .sort((a, b) => {
            const lines = Number(a.line) - Number(b.line);
            return lines ? lines : Number(a.restraint) - Number(b.restraint);
          })
          .map((val, id) => ({ ...val, id }));
        dispatch(
          changeLoadsToStructureAction(project.name, { sent, last: news })
        );
      }
      
  
    } catch (error) {
      dispatch(
        addEventAction(
          `Error in Loads To Structure Batch: ${error.message}`,
          "danger"
        )
      );
    } 
  }

  dispatch(
    changeProjectRequestProgressAction(project.name, "loadsToStructure", false)
  );
};





export const changePipeNFAction = (
  project: string,
  NFs: { [key: number]: number | undefined }
) => action(MainActionTypes.CHANGE_PIPE_NF, { project, NFs });

export const getAndMapPipeNF = async (
  dispatch: Dispatch<any>,
  project: Project,
  scene: Scene,
  line?: number
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "natfreq"));
  const map = new Map<number, FreePipe[]>();
  for (const pipe of project.freePipes ?? []) {
    if (line !== undefined && line !== pipe.line) continue;
    const pipes = map.get(pipe.line);
    map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
  }

  const NFs: { [key: number]: number | undefined } = {};

  for (const pipes of Array.from(map.values())) {
    const { json } = getPipeAnalysisJSON(
      project,
      pipes,
      project.pipeLoadings.loadCombinations.loads,
      scene
    );
   // alert(`${baseUrl}api/v2/piping/calculate/natfreq`);
    try {
      const response = await axios.post(
        `${baseUrl}api/v2/piping/calculate/natfreq`,
        JSON.stringify(json),
        jsonOptions
      );

      NFs[response.data.lineNo] = response.data.structuralNaturalFrequency;

      dispatch(changePipeNFAction(project.name, NFs));
    } catch (error) {
      NFs[+json.lineNo] = undefined;
      dispatch(changePipeNFAction(project.name, NFs));
      dispatch(
        addEventAction(
          `Pipe Natural Frequency${json.lineNo ? ` (${json.lineNo})` : ""}: ${
            error.message
          }`,
          "danger"
        )
      );
    }
  }
  dispatch(changeProjectRequestProgressAction(project.name, "natfreq", false));
};

export const setWeightSummaryAction = (
  project: string,
  weightSummary: Map<string, any>
) => action(MainActionTypes.SET_WEIGHT_SUMMARY, { project, weightSummary });

export const changeProjectModeAction = (project: string, mode: TProjectMode) =>
  action(MainActionTypes.CHANGE_PROJECT_MODE, { project, mode });

export const getAndMapPipeSeismicLoads = async (
  dispatch: Dispatch,
  project: Project,
  scene: Scene
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "seismic"));
  const map = new Map<number, FreePipe[]>();
  for (const pipe of project.freePipes ?? []) {
    const pipes = map.get(pipe.line);
    map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
  }
  const seismicLoads: TPipeSeismicLoad[] = [];
  for (const pipes of Array.from(map.values())) {
    const { json } = getPipeAnalysisJSON(
      project,
      pipes,
      project.pipeLoadings.loadCombinations.loads,
      scene
    );
    try {
      const response = await axios.post(
        `${baseUrl}api/v2/piping/seismic`,
        JSON.stringify(json),
        jsonOptions
      );
      for (const item of Object.values(response.data) as any) {
        seismicLoads.push({
          id: seismicLoads.length,
          line: `${json.lineNo}`,
          node: item.node,
          weight: item.seismicWeight,
        });
      }
      dispatch(changeSeismicLoadsAction(project.name, seismicLoads));
    } catch (error) {
      dispatch(
        addEventAction(
          `Seismic Loads${json.lineNo ? ` (${json.lineNo})` : ""}: ${
            error.message
          }`,
          "danger"
        )
      );
    }
  }
  dispatch(changeProjectRequestProgressAction(project.name, "seismic", false));
};

export const changeSeismicLoadsAction = (
  project: string,
  loadings: TPipeSeismicLoad[]
) => action(MainActionTypes.CHANGE_PIPE_SEISMIC_LOADS, { project, loadings });

export const changeImportedToProcessAction = (
  project: string,
  imported: TProcessImport[]
) => {
  console.log("this is imported", imported);
  return action(MainActionTypes.CHANGE_IMPORTED_TO_PROCESS, {
    project,
    imported,
  });
};


export const setClashesAction = (clashes: TClash[]) => {
  return action(MainActionTypes.SET_CLASHES, { clashes });
};

export const getCSVFromBE = async (
  dispatch: Dispatch,
  project: Project,
  line: string,
  LC: string,
  callback: (arr: any[]) => any
) => {
  dispatch(changeProjectRequestProgressAction(project.name, "hanger"));

  try {
    const responce = await axios.get(
      `${API_ROOT}/csv_out/admin${project.name.replace(
        /\s/g,
        ""
      )}/Line${line}/${LC}/hanger_stiffness.csv`,
      { headers: { Accept: "text/csv" }, responseType: "text" }
    );

    parse<any>(responce.data, {
      header: true,
      dynamicTyping: true,
      complete: (arr) => callback(arr.data),
    });
  } catch (error) {
    dispatch(addEventAction(error.message, "danger"));
  }

  dispatch(changeProjectRequestProgressAction(project.name, "hanger", false));
};

export const getCII = (
  dispatch: Dispatch,
  project: string,
  key: string,
  model: string | undefined,
  LC: string
) => {
  const url = model
    ? `${API_ROOT}/csv_out/${key}/${model}/${LC}/${key}_${model}_LC${LC}.std`
    : "";
  const fileName = model ? `${key}_${model}_LC${LC}.csv` : "";
  if (!url) return;
  dispatch(changeProjectRequestProgressAction(project, "CII"));
  axios
    .get(url, { responseType: "blob" })
    .then((responce) => saveAs(responce.data, fileName))
    .catch((err) => dispatch(addEventAction("Data not found", "danger")))
    .finally(() =>
      dispatch(changeProjectRequestProgressAction(project, "CII", false))
    );
};

export const createPipeAction = (pipe?: FreePipe) => {
  return action(MainActionTypes.CREATE_PIPE, { pipe });
};

export const changePipesAction = (pipes: FreePipe[]) => {
  return action(MainActionTypes.CHANGE_PIPES, { pipes });
};

export const deletePipesAction = (ids: number[]) => {
  return action(MainActionTypes.DELETE_PIPES, { ids });
};

export const createCableAction = (cable?: FreeCable) => {
  return action(MainActionTypes.CREATE_CABLE, { cable });
};

export const changeCablesAction = (cables: FreeCable[]) => {
  return action(MainActionTypes.CHANGE_CABLES, { cables });
};

export const deleteCablesAction = (ids: number[]) => {
  return action(MainActionTypes.DELETE_CABLES, { ids });
};

export const createFlareAction = (
  params: TInitFlare | undefined,
  model?: TFlare
) => {
  return action(MainActionTypes.CREATE_FLARE, { params, model });
};

export const changeFlareAction = (flare: TFlare) => {
  return action(MainActionTypes.CHANGE_FLARE, { flare });
};

export const deleteFlareAction = (flare: TFlare) => {
  return action(MainActionTypes.DELETE_FLARE, { flare });
};

export const changeDashboardAction = (dashboard: TDashboard) => {
  return action(MainActionTypes.CHANGE_DASHBOARD, { dashboard });
};
