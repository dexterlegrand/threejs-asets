import { PipeProfile, Section, Material } from "../../../store/data/types";
import { getElementByField } from "../utils";

export function getPipeProfile(
  profiles: PipeProfile[],
  lib: string | undefined,
  nps: string | undefined,
  schedule: string | undefined
) {
  const founded = profiles.find(
    (profile) =>
      profile.country_code.trim() === lib &&
      profile.nominal_pipe_size_inch === nps &&
      profile.schedule === schedule
  );
  return founded;
}

export function getProfile(profiles: Section[], profile: string, canEmpty?: boolean) {
  const founded = getElementByField(profiles, "designation", profile);
  if (!canEmpty && !founded) {
    return profiles[0];
  }
  return founded;
}

export function getMaterial(materials: Material[], material: string | undefined) {
  return getElementByField(materials, "material_name", material) ?? materials[0];
}
