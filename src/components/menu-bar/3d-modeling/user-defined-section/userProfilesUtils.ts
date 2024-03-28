import { PipeRack, Project } from "../../../../store/main/types";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import { changeProjectAction } from "../../../../store/main/actions";
import { Dispatch } from "redux";
import {Section, RolledSection, CombinedSection} from "../../../../store/data/types";

export function searchMatches<T>(
  item: T,
  projects: Project[],
  compareSection: (item: T, profile?: Section | RolledSection | CombinedSection) => boolean
) {
  const map = new Map<string, string[]>();
  for (let i = 0, pLen = projects.length; i < pLen; ++i) {
    for (let j = 0, mLen = projects[i].models.length; j < mLen; ++j) {
      if (projects[i].models[j].type === "Pipe Rack") {
        const model = projects[i].models[j] as PipeRack;
        if (
          compareSection(item, model.portalColProfile) ||
          compareSection(item, model.portalBeamProfile) ||
          compareSection(item, model.portalTieProfile) ||
          model.columns.some((mItem) => compareSection(item, mItem.profile)) ||
          model.beams.some((mItem) => compareSection(item, mItem.profile)) ||
          model.cantilevers.some((mItem) => compareSection(item, mItem.profile)) ||
          model.hBracings.some((mItem) => compareSection(item, mItem.profile)) ||
          model.vBracings.some((mItem) => compareSection(item, mItem.profile)) ||
          model.accessories.some((ag) =>
            ag.elements.some(
              (el) => compareSection(item, el.colProfile) || compareSection(item, el.beamProfile)
            )
          )
        ) {
          const mapItem = map.get(model.project);
          map.set(model.project, mapItem ? [...mapItem, model.name] : [model.name]);
        }
      } else {
        const model = projects[i].models[j] as TOpenFrame;
        if (
          compareSection(item, model.frameColProfile) ||
          compareSection(item, model.frameBeamProfile) ||
          compareSection(item, model.frameTieProfile) ||
          model.columns.some((mItem) => compareSection(item, mItem.profile)) ||
          model.beams.some((mItem) => compareSection(item, mItem.profile)) ||
          model.cantilevers.some((mItem) => compareSection(item, mItem.profile)) ||
          model.kneeBracings.some((mItem) => compareSection(item, mItem.profile)) ||
          model.verticalBracings.some((mItem) => compareSection(item, mItem.profile)) ||
          model.horizontalBracings.some((mItem) => compareSection(item, mItem.profile))
        ) {
          const mapItem = map.get(model.project);
          map.set(model.project, mapItem ? [...mapItem, model.name] : [model.name]);
        }
      }
    }
    if (compareSection(item, projects[i].ladderParams.profile)) {
      const mapItem = map.get(projects[i].name);
      map.set(projects[i].name, mapItem ? [...mapItem, "Ladder Params"] : ["Ladder Params"]);
    }
  }
  return map;
}

export function handleReplaceProfile<T>(
  item: T,
  profile: Section,
  projects: Project[],
  map: Map<string, string[]>,
  compareSection: (item: T, profile?: Section | RolledSection | CombinedSection) => boolean,
  dispatch?: Dispatch<any>
) {
  for (const project of projects) {
    const mapItem = map.get(project.name);
    if (!mapItem) continue;
    let changedProject: Project = { ...project };
    project.models.forEach((model) => {
      if (mapItem.includes(model.name)) {
        if (model.type === "Pipe Rack") {
          const typeModel = model as PipeRack;
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === typeModel.name
                ? {
                    ...typeModel,
                    portalColProfile: compareSection(item, typeModel.portalColProfile)
                      ? profile
                      : typeModel.portalColProfile,
                    portalBeamProfile: compareSection(item, typeModel.portalBeamProfile)
                      ? profile
                      : typeModel.portalBeamProfile,
                    portalTieProfile: compareSection(item, typeModel.portalTieProfile)
                      ? profile
                      : typeModel.portalTieProfile,
                    columns: typeModel.columns.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    beams: typeModel.beams.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    cantilevers: typeModel.cantilevers.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    vBracings: typeModel.vBracings.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    hBracings: typeModel.hBracings.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    accessories: typeModel.accessories.map((ag) => ({
                      ...ag,
                      elements: ag.elements.map((el) => ({
                        ...el,
                        colProfile: compareSection(item, el.colProfile) ? profile : el.colProfile,
                        beamProfile: compareSection(item, el.beamProfile)
                          ? profile
                          : el.beamProfile,
                      })),
                    })),
                  }
                : mItem
            ),
          };
        } else {
          const typeModel = model as TOpenFrame;
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === typeModel.name
                ? {
                    ...typeModel,
                    frameColProfile: compareSection(item, typeModel.frameColProfile)
                      ? profile
                      : typeModel.frameColProfile,
                    frameBeamProfile: compareSection(item, typeModel.frameBeamProfile)
                      ? profile
                      : typeModel.frameBeamProfile,
                    frameTieProfile: compareSection(item, typeModel.frameTieProfile)
                      ? profile
                      : typeModel.frameTieProfile,
                    columns: typeModel.columns.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    beams: typeModel.beams.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    cantilevers: typeModel.cantilevers.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    verticalBracings: typeModel.verticalBracings.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    horizontalBracings: typeModel.horizontalBracings.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                    kneeBracings: typeModel.kneeBracings.map((mItem) =>
                      compareSection(item, mItem.profile) ? { ...mItem, profile } : mItem
                    ),
                  }
                : mItem
            ),
          };
        }
      }
    });
    if (mapItem.includes("Ladder Params")) {
      changedProject = {
        ...changedProject,
        ladderParams: {
          ...changedProject.ladderParams,
          profile,
        },
      };
    }
    if (dispatch) {
      dispatch(changeProjectAction(changedProject));
    } else {
      return changedProject;
    }
  }
}
