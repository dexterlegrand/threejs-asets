import { MemberStressCheckUI, DeflectionCheckUI } from "../../../store/ui/types";
import { green, red, yellow, gray, deg90InRad, deg180InRad } from "../../../store/main/constants";
import { Vector3, Mesh, Object3D } from "three";
import { ModelItem } from "../../../store/main/types";

export function getColor(
  checks: MemberStressCheckUI | DeflectionCheckUI | undefined,
  min: number,
  max: number
) {
  if (checks) {
    if (checks.actual <= min) return green;
    if (checks.actual >= max) return red;
    return yellow;
  } else return gray;
}

export function getRotation(direction: string) {
  switch (direction.toUpperCase()) {
    case "X":
      return new Vector3(0, 0, -deg90InRad);
    case "+X":
      return new Vector3();
    case "-X":
      return new Vector3(0, deg180InRad);
    case "Z":
      return new Vector3(deg90InRad);
    case "+Z":
      return new Vector3(0, -deg90InRad);
    case "-Z":
      return new Vector3(0, deg90InRad);
    default:
      return new Vector3();
  }
}

export function changeColorOFElement(mesh: Mesh, selectedItem: ModelItem) {
  let materials: any[] = [];

  const mapMaterials = (elements: Object3D[], materials: any[]) => {
    let updated = [...materials];
    for (const el of elements) {
      updated = replaceColor(updated, el);
      if (el.name === "Group" || el.name === "Combined")
      // if(el.children.length>0)
        updated = mapMaterials(el.children, updated);
    }
    return updated;
  };

  const obj = mesh.getObjectByName(selectedItem.name);
  if (obj) materials = mapMaterials(obj.children, replaceColor(materials, obj));
  return materials;
}

export function revertColorOfElement(mesh: Mesh, materials: any[]) {
  materials.forEach((item) => {
    const obj = mesh.getObjectByProperty("uuid", item.uuid);
    if (obj && (obj as Mesh).material) {
      (obj as any).material.color.setRGB(item.color.r, item.color.g, item.color.b);
    }
  });
}

function replaceColor(materials: any[], obj: any) {
  if (obj && obj.material) {
    const newMaterials = [
      ...materials,
      {
        uuid: obj.uuid,
        color: { ...obj.material.color },
      },
    ];
    obj.material.color.set(0x800000);
    return newMaterials;
  }
  return materials;
}