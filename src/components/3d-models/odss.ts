import { Group, Mesh, Vector3 } from "three";
import { DataState } from "../../store/data/types";
import { deg90InRad, gray } from "../../store/main/constants";
import { ODSS, ODSSUserDefinedSection } from "../../store/main/odssTypes";
import { createElementByProfile, getDefaultRotation } from "./profileElement";

export function drawODSS(
  project: string,
  model: ODSS,
  data: DataState,
  customProfiles: ODSSUserDefinedSection[] | undefined
) {
  const modelGroup = new Group();
  modelGroup.name = model.name;
  const sections = Object.values(model.BeamSections);
  const elements = Object.values(model.BeamElements);
  for (const section of sections) {
    const sectionGroup = new Group();
    sectionGroup.name = `ODSS-S${section.Label}`;
    const sectionElements = elements.filter((e) => e.Section === section.Label);
    for (const element of sectionElements) {
      const start = new Vector3()
        .fromArray(model.Nodes[element.Nodes[0]].Coords ?? [])
        .divideScalar(1000);
      const end = new Vector3()
        .fromArray(model.Nodes[element.Nodes[1]].Coords ?? [])
        .divideScalar(1000);
      const profile = data.profileSectionData.find(
        (profile) =>
          profile.designation.toUpperCase() ===
          element.SectionName.toUpperCase()
      );
      const defualtRotationX = getDefaultRotation(profile);
      const mesh = profile
        ? createElementByProfile(
            start.distanceTo(end),
            gray,
            profile,
            false,
            defualtRotationX
          )
        : new Mesh();
      mesh.name = `${sectionGroup.name}-E${element.Label}`;
      mesh.position.add(start);
      mesh.lookAt(end);
      mesh.position.add(end).divideScalar(2);
      mesh.rotateY(-deg90InRad);
      mesh.rotateX(defualtRotationX);
      mesh.userData = {
        project,
        model: model.name,
        isModelItem: true,
        elementData: { ...element },
      };
      sectionGroup.add(mesh);
    }
    modelGroup.add(sectionGroup);
  }
  return modelGroup;
}
