import React, { FunctionComponent, useState, useMemo } from "react";
import { FormGroup, Button } from "@blueprintjs/core";
import {
  Direction2,
  SupportType,
  Project,
} from "../../../../../store/main/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  changeOFUIAction,
  addEventAction,
  confirmAction,
} from "../../../../../store/ui/actions";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { directions2, supportTypes } from "../../../../../store/main/constants";
import {
  setModelTypeAndMaterial,
  createModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import { getIndexName, getCurrentUI } from "../../../../3d-models/utils";
import { OpenFrameUI } from "../../../../../store/ui/types";
import {
  createOFModel,
  getOFModels,
  removeOFModel,
  createFramesParameters,
} from "../../../../3d-models/openFrame";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { Vector3 } from "three";
import { Section, Material } from "../../../../../store/data/types";

type Props = {
  profiles: Section[];
  materials: Material[];
  libs: string[];
};

const FramesGeometry: FunctionComponent<Props> = (props) => {
  const { profiles, materials, libs } = props;

  const [display, setDisplay] = useState<boolean>(true);

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );
  const materialProgress = useSelector(
    (state: ApplicationState) => state.ui.requests?.material
  );
  const profilesProgress = useSelector(
    (state: ApplicationState) => state.ui.requests?.profiles
  );
  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find(
      (project) => project.name === state.main.currentProject
    )
  );
  const dispatch = useDispatch();

  const frames = useMemo(() => openFrameUI?.frames, [openFrameUI]);
  const material = useMemo(() => project?.selectedMaterial, [project]);

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((section) => section.country_code === frames?.library),
    [profiles, frames?.library]
  );

  function handleChangeState(field: string, value: any) {
    if (!openFrameUI || !frames) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        frames: { ...frames, [field]: value },
      })
    );
  }

  function showWarning(msg: string) {
    dispatch(addEventAction(msg, "warning"));
  }

  function handleAddGeometry() {
    if (!project) {
      showWarning("Add Geometry: Create or select a project");
      return;
    }
    if (!openFrameUI || !frames) return;
    if (!frames.material) {
      showWarning("Add Geometry: Select any material");
      return;
    }
    if (!frames.frameColProfile) {
      showWarning("Add Geometry: Select any column profile");
      return;
    }
    if (!frames.frameBeamProfile) {
      showWarning("Add Geometry: Select any beam profile");
      return;
    }
    if (!frames.frameTieProfile) {
      showWarning("Add Geometry: Select any tie profile");
      return;
    }
    if (
      project.models.some((model) => {
        return (model as TOpenFrame).startPos.equals(
          new Vector3(frames.x, frames.y, frames.z)
        );
      })
    ) {
      dispatch(
        confirmAction({
          message:
            "Warning! You already have a model with the same position. After creating a new model, the old model will be overwritten. Create?",
          onConfirm: () => recreatingModel(project, openFrameUI),
        })
      );
    } else creatingModel(project, openFrameUI);
  }

  function recreatingModel(project: Project, ui: OpenFrameUI) {
    const modelName = `OF${getIndexName(
      getOFModels(project).filter(
        (model) =>
          !(model as TOpenFrame).startPos.equals(
            new Vector3(ui.frames.x, ui.frames.y, ui.frames.z)
          )
      ),
      "OF"
    )}`;
    const changed = removeOFModel(project, ui, modelName);
    const newUI: OpenFrameUI = {
      ...changed.newUI,
      frames: {
        ...changed.newUI.frames,
        parameters: [
          ...changed.newUI.frames.parameters,
          ...createFramesParameters(modelName, ui.frames),
        ],
      },
    };
    dispatch(
      changeProjectAction({
        ...changed.newProject,
        models: [
          ...changed.newProject.models,
          createOFModel(modelName, project.name, newUI),
        ],
      })
    );
    dispatch(changeOFUIAction(newUI));
    if (newUI.frames.material) {
      dispatch(setModelTypeAndMaterial(newUI.frames.material, "Open Frame"));
    }
  }

  function creatingModel(project: Project, ui: OpenFrameUI) {
    const modelName = `OF${getIndexName(
      project.models.filter((model) => model.type === "Open Frame"),
      "OF"
    )}`;
    const newUI: OpenFrameUI = {
      ...ui,
      frames: {
        ...ui.frames,
        parameters: [
          ...ui.frames.parameters,
          ...createFramesParameters(modelName, ui.frames),
        ],
      },
    };
    dispatch(createModel(createOFModel(modelName, project.name, newUI)));
    dispatch(changeOFUIAction(newUI));
    if (ui.frames.material) {
      dispatch(setModelTypeAndMaterial(ui.frames.material, "Open Frame"));
    }
  }

  return (
    <>
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
          minimal
          small
        />
        Geometry
      </div>
      <div className="hr" />
      <div className={"p-5"} style={{ display: display ? "flex" : "none" }}>
        <div className="d-flex f-grow f-column bg-gray">
          <div
            className="d-flex f-grow f-jc-between"
            style={{ paddingRight: 10 }}
          >
            {/* ---------- COLUMN 1 ---------- */}
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">No of Tiers</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={frames?.noOfTiers}
                    onChange={(value) => handleChangeState("noOfTiers", value)}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">No of Columns</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={frames?.noOfColumns}
                    onChange={(value) =>
                      handleChangeState("noOfColumns", value)
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Frame Width</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={0}
                    value={frames?.frameWidth}
                    onChange={(value) => handleChangeState("frameWidth", value)}
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Frame Height</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={0}
                    value={frames?.frameHeight}
                    onChange={(value) =>
                      handleChangeState("frameHeight", value)
                    }
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Pedestal Height</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={0}
                    value={frames?.pedestalHeight}
                    onChange={(value) =>
                      handleChangeState("pedestalHeight", value)
                    }
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
            </div>
            {/* ---------- COLUMN 2 ---------- */}
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-170">
                  No. of similar Frames
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={frames?.noOfSimilarFrames}
                    onChange={(value) =>
                      handleChangeState("noOfSimilarFrames", value)
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-170">Spacing of Frames</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={0}
                    value={frames?.spacingOfFrames}
                    onChange={(value) =>
                      handleChangeState("spacingOfFrames", value)
                    }
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-170">
                  Direction to replicate
                </div>
                <FormGroup className="no-m">
                  <SimpleSelector<Direction2>
                    items={directions2}
                    selected={frames?.directionToReplicate}
                    onSelect={(value) =>
                      handleChangeState("directionToReplicate", value)
                    }
                    itemLabel={(item) => item}
                    className="fill-select w-155"
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-170">Support Type</div>
                <FormGroup className="no-m">
                  <SimpleSelector<SupportType>
                    items={supportTypes}
                    selected={frames?.supportType}
                    onSelect={(value) =>
                      handleChangeState("supportType", value)
                    }
                    itemLabel={(item) => item}
                    className="fill-select w-155"
                  />
                </FormGroup>
              </div>
            </div>
            {/* ---------- COLUMN 3 ---------- */}
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">C/S Library</div>
                <FormGroup className="no-m">
                  <SimpleSelector<string>
                    items={libs}
                    selected={frames?.library}
                    onSelect={(value) => handleChangeState("library", value)}
                    itemLabel={(item) => item}
                    className="fill-select w-155"
                    loading={profilesProgress}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">
                  Frame Col. Profile
                </div>
                <FormGroup className="no-m">
                  <SimpleSelector<Section>
                    items={filteredProfiles}
                    selected={frames?.frameColProfile}
                    onSelect={(value) =>
                      handleChangeState("frameColProfile", value)
                    }
                    itemLabel={(item) => item.designation}
                    className="fill-select w-155"
                    filter={(q, item) =>
                      !q ||
                      item.designation.toLowerCase().includes(q.toLowerCase())
                    }
                    loading={profilesProgress}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">
                  Frame Beam Profile
                </div>
                <FormGroup className="no-m">
                  <SimpleSelector<Section>
                    items={filteredProfiles}
                    selected={frames?.frameBeamProfile}
                    onSelect={(value) =>
                      handleChangeState("frameBeamProfile", value)
                    }
                    itemLabel={(item) => item.designation}
                    className="fill-select w-155"
                    filter={(q, item) =>
                      !q ||
                      item.designation.toLowerCase().includes(q.toLowerCase())
                    }
                    loading={profilesProgress}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Frame Tie Profile</div>
                <FormGroup className="no-m">
                  <SimpleSelector<Section>
                    items={filteredProfiles}
                    selected={frames?.frameTieProfile}
                    onSelect={(value) =>
                      handleChangeState("frameTieProfile", value)
                    }
                    itemLabel={(item) => item.designation}
                    className="fill-select w-155"
                    filter={(q, item) =>
                      !q ||
                      item.designation.toLowerCase().includes(q.toLowerCase())
                    }
                    loading={profilesProgress}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Material</div>
                <FormGroup className="no-m">
                  <SimpleSelector<Material>
                    items={materials}
                    itemLabel={(item) => item.material_name}
                    disabled={!!material}
                    selected={frames?.material}
                    onSelect={(value) => handleChangeState("material", value)}
                    className="fill-select w-155"
                    loading={materialProgress}
                  />
                </FormGroup>
              </div>
            </div>
          </div>
          {/* ---------- COLUMN END ---------- */}
          <div
            className="d-flex f-grow f-ai-center bg-gray"
            style={{ padding: "0 10px" }}
          >
            <Button
              text="Add Geometry"
              intent="danger"
              onClick={handleAddGeometry}
            />
            <div className="d-flex f-ai-center">
              <div className="label-light">
                1st Frame Base Mid Position X(m):
              </div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={frames?.x}
                  onChange={(value) => handleChangeState("x", value)}
                  className={"w-80"}
                />
              </FormGroup>
              <div className="label-light">Y(m):</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={frames?.y}
                  onChange={(value) => handleChangeState("y", value)}
                  className={"w-80"}
                />
              </FormGroup>
              <div className="label-light">Z(m):</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={frames?.z}
                  onChange={(value) => handleChangeState("z", value)}
                  className={"w-80"}
                />
              </FormGroup>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FramesGeometry;
