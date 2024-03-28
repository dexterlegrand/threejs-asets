import React, { FunctionComponent, useMemo } from "react";
import PortalsGeometry from "./PortalsGeometry";
import PortalsParameters from "./PortalsParameters";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { PipeRack } from "../../../../../store/main/types";
import {
  createModel,
  changeModel,
  setModelTypeAndMaterial,
  removeModel,
} from "../../../../../store/main/actions";
import { getIndexName, getCurrentUI } from "../../../../3d-models/utils";
import { PRGeometryUI } from "../../../../../store/ui/types";
import { addEventAction, confirmAction } from "../../../../../store/ui/actions";
import { Vector3 } from "three";
import { Section } from "../../../../../store/data/types";
import { createPipeRack } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type OwnProps = {
  models: PipeRack[];
  libs: string[];
  profiles: Section[];
};

type Props = OwnProps;

const Portals: FunctionComponent<Props> = (props) => {
  const dispatch = useDispatch();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const materials = useSelector((state: ApplicationState) => state.data.materials);
  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((project) => project.name === state.main.currentProject)
  );

  const material = useMemo(() => project?.selectedMaterial, [project]);
  const geometry = useMemo(() => ui?.pipeRackUI.portals.geometry, [ui]);

  function handleAddGeometry() {
    if (!project || !validGeometry(geometry)) return;

    const model = props.models.find((model) =>
      (model as PipeRack).startPos.equals(new Vector3(geometry!.x, geometry!.y, geometry!.z))
    );
    if (model) {
      dispatch(
        confirmAction({
          message:
            "Warning! You already have a model with the same position. After creating a new model, the old model will be overwritten. Create?",
          onConfirm: () => {
            dispatch(removeModel(model.name));
            dispatch(
              createModel(
                createPipeRack(
                  project.name,
                  getIndexName(
                    props.models.filter((item) => item.name !== model.name),
                    "PR"
                  ),
                  "PR",
                  geometry!
                )
              )
            );
          },
        })
      );
    } else
      dispatch(
        createModel(createPipeRack(project.name, getIndexName(props.models, "PR"), "PR", geometry!))
      );
    geometry!.material && dispatch(setModelTypeAndMaterial(geometry!.material, "Pipe Rack"));
  }

  function showWarning(msg: string) {
    dispatch(addEventAction(msg, "warning"));
  }

  function validGeometry(geometry?: PRGeometryUI): boolean {
    if (!geometry) return false;
    if (!geometry.colProfile) {
      showWarning("Add Geometry: Select any column profile");
      return false;
    }
    if (!geometry.beamProfile) {
      showWarning("Add Geometry: Select any beam profile");
      return false;
    }
    if (!geometry.tieProfile) {
      showWarning("Add Geometry: Select any tie profile");
      return false;
    }
    if (!geometry.material) {
      showWarning("Add Geometry: Select any material");
      return false;
    }
    if (!geometry.topTierElevation) {
      showWarning("Add Geometry: Increase the top tier elevation");
      return false;
    }
    if (!geometry.width) {
      showWarning("Add Geometry: Increase the portal width");
      return false;
    }
    if (!geometry.length) {
      showWarning("Add Geometry: Increase the pipe rack length");
      return false;
    }
    return true;
  }

  return (
    <div className="d-flex f-column">
      <PortalsGeometry
        addGeometry={handleAddGeometry}
        libs={props.libs}
        profiles={props.profiles}
        material={material}
        materials={materials}
      />
      <PortalsParameters
        models={props.models}
        onChange={(model) => dispatch(changeModel(model))}
        onDelete={(model) => dispatch(removeModel(model.name))}
        libs={props.libs}
        profiles={props.profiles}
      />
    </div>
  );
};

export default Portals;
