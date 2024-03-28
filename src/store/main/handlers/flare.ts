import { getNextId, roundM } from "../../../components/3d-models/utils";
import { MainState } from "../types";
import { TFlare, TFlareSegment, TInitFlare } from "../types/flare";

export function handleCreateFlare(
  state: MainState,
  params?: TInitFlare,
  model?: TFlare
) {
  const current = (params || model)?.project;
  if (!current) return state;
  let project = state.projects.find((p) => p.name === current);
  if (!project) return state;
  const flares = project.flares ?? [];
  if (params) {
    const id = getNextId(flares);
    const segments: TFlareSegment[] = [];
    const heightStep_M = roundM(params.height_M / params.numberOfSegments);
    for (let i = 0; i < params.numberOfSegments; i++) {
      const segment: TFlareSegment = {
        id: i + 1,
        name: `FS${i + 1}`,
        thickness_MM: params.thickness_MM,
        bottomElevation_M: heightStep_M * i,
        topElevation_M: heightStep_M * (i + 1),
        bottomInternalDiameter_M: params.diameter_M,
        topInternalDiameter_M: params.diameter_M,
        refractoryThickness_MM: params.refractoryThickness_MM,
        refractoryDensity: params.refractoryDensity,
        corrosionAllowance_MM: params.corrosionAllowance_MM,
        minDesignTemperature: params.minDesignTemperature,
        maxDesignTemperature: params.maxDesignTemperature,
        material: params.material,
      };
      segments.push(segment);
    }
    const flare: TFlare = {
      id,
      name: `FLARE${id}`,
      type: "Flare",
      project: project.name,
      position: { ...params.position },
      segments,
    };
    flares.push(flare);
    project = { ...project, flares };
    return {
      ...state,
      projects: state.projects.map((p) => {
        return p.name === current ? project! : p;
      }),
    };
  } else if (model) {
    flares.push(model);
    project = { ...project, flares };
    return {
      ...state,
      projects: state.projects.map((p) => {
        return p.name === current ? project! : p;
      }),
    };
  } else return state;
}

export function handleChangeFlare(state: MainState, params: TFlare) {
  let project = state.projects.find((p) => p.name === params.project);
  if (!project) return state;
  const flares = (project.flares ?? []).map((f) => {
    return f.id === params.id ? params : f;
  });
  project = { ...project, flares };
  return {
    ...state,
    projects: state.projects.map((p) => {
      return p.name === params.project ? project! : p;
    }),
  };
}

export function handleDeleteFlare(state: MainState, params: TFlare) {
  let project = state.projects.find((p) => p.name === params.project);
  if (!project) return state;
  const flares = (project.flares ?? []).filter((f) => f.id !== params.id);
  project = { ...project, flares };
  return {
    ...state,
    projects: state.projects.map((p) => {
      return p.name === params.project ? project! : p;
    }),
  };
}
