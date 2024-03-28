import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Icon, FormGroup } from "@blueprintjs/core";
import { changeProjectAction } from "../../../../store/main/actions";
import { strFilter } from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { FreePipe, TSelectedPipeSupport, Project } from "../../../../store/main/types";
import { confirmAction } from "../../../../store/ui/actions";
import { getFullReleases } from "../../../3d-models/pipes/pipesUtils";
import { selectFreePipeSupport } from "../../../../store/selections/actions";

type Props = {
  project: Project | undefined;
};

const types = ["Anchor", "Sliding", "Custom", "Custom+", "Custom-", "Slave Node", "Hanger"];

const directions = ["X", "Y", "Z", "RX", "RY", "RZ"];

const valueTypes = ["K", "δ allow.", "δ appl."];

export function SelectedPipeSupport({ project }: Props) {
  const selected = useSelector((state: ApplicationState) => state.selections.selectedPipeSupport);

  const dispatch = useDispatch();

  const pipe = useMemo(() => {
    return project?.freePipes?.find((p) => p.pipe === selected?.pipe);
  }, [project, selected]);

  const pipeLine = useMemo(() => {
    return pipe && project
      ? project.freePipes?.filter((p) => p.id !== pipe.id && p.line === pipe.line) ?? []
      : [];
  }, [project, pipe]);

  const isCustomOrSlaveNode = useMemo(() => {
    return selected
      ? selected.support.type.includes("Custom") || selected.support.type === "Slave Node"
      : false;
  }, [selected]);

  const isSlave = useMemo(() => {
    return selected?.support.type === "Slave Node";
  }, [selected]);

  const isSliding = useMemo(() => {
    return selected?.support.type === "Sliding";
  }, [selected]);

  const isHanger = useMemo(() => {
    return selected?.support.type === "Hanger";
  }, [selected]);

  const isK = useMemo(() => {
    return selected?.support.valueType === "K";
  }, [selected]);

  const enabled = useMemo(() => {
    if (!selected) return false;
    const isCustom = selected.support.type.includes("Custom");
    // const isPM = selected.support.type === "Custom+" || selected.support.type === "Custom-";
    // const isK = selected.support.valueType === "K";
    // return isPM ? !isK : isCustom;
    return isCustom;
  }, [selected]);

  function handleChangeSelected(freePipes: FreePipe[], selected?: TSelectedPipeSupport) {
    if (!project) return;
    dispatch(changeProjectAction({ ...project, freePipes }));
    dispatch(selectFreePipeSupport(selected));
  }

  function handleChange(field: string, value: any) {
    if (!project || !selected) return;
    let support = { ...selected.support, [field]: value };
    if (field === "type" || field === "direction" || field === "valueType") {
      support = getFullReleases(support);
    }
    if (field === "direction" || field === "distance") {
      const byDir = project.freePipes
        ?.find((p) => p.pipe === selected.pipe)
        ?.params.supportDetails?.find(
          (s) => s.distance === support.distance && s.direction === support.direction
        );
      support = { ...support, Mu: byDir?.Mu ?? support.Mu };
    }
    const freePipes =
      project.freePipes?.map((p) =>
        p.pipe === selected.pipe
          ? {
              ...p,
              params: {
                ...p.params,
                supportDetails: p.params.supportDetails?.map((sp) =>
                  sp.id === support.id
                    ? support
                    : field === "Mu" &&
                      sp.distance === support.distance &&
                      sp.direction === support.direction
                    ? { ...sp, Mu: value }
                    : sp
                ),
              },
            }
          : p
      ) ?? [];
    handleChangeSelected(freePipes, { ...selected, support });
  }

  function handleRemove() {
    if (!project || !selected) return;
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete the selected item?",
        onConfirm: () => {
          const freePipes =
            project.freePipes?.map((p) =>
              p.pipe === selected.pipe
                ? {
                    ...p,
                    params: {
                      ...p.params,
                      numberOfSupports: p.params.numberOfSupports
                        ? p.params.numberOfSupports - 1
                        : 0,
                      supportDetails: p.params.supportDetails?.filter(
                        (sp) => sp.id !== selected.support.id
                      ),
                    },
                  }
                : p
            ) ?? [];
          handleChangeSelected(freePipes);
          handleClose();
        },
      })
    );
  }

  function handleClose() {
    dispatch(selectFreePipeSupport(undefined));
  }

  function getCoordinates() {
    if (!selected) return null;
    return (
      <>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position X: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.x}m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position Y: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.y}m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light t-end">Position Z: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          <div className={"label-light"}>{selected.position.z}m</div>
        </div>
      </>
    );
  }

  return selected ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Element name: {`${selected.pipe} ${selected.support.type} Support`}
          </h2>
        </div>
        <Button large minimal icon={"cross"} onClick={handleClose} intent={"danger"} />
      </div>
      <div className={"body-grid"}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center">
          <div className={"label-light"}>{selected.lineNo}</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Pipe No.: </div>
        </div>
        <div className="d-flex f-ai-center">
          <div className={"label-light"}>{selected.pipe}</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Support Position: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={selected.support.distance}
              onChange={(val) => handleChange("distance", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        {getCoordinates()}
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Support Type: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m" style={{ paddingRight: 10 }}>
            <SimpleSelector<string>
              items={types}
              itemLabel={(item) => item}
              selected={selected.support.type}
              onSelect={(value) => handleChange("type", value)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Direction: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m" style={{ paddingRight: 10 }}>
            <SimpleSelector<string>
              items={directions}
              itemLabel={(item) => item}
              selected={selected.support.direction}
              disabled={
                selected.support.type === "Anchor" || selected.support.type === "Slave Node"
              }
              onSelect={(value) => handleChange("direction", value)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>K / δ: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m" style={{ paddingRight: 10 }}>
            <SimpleSelector<string>
              items={valueTypes}
              itemLabel={(item) => item}
              selected={selected.support.valueType}
              disabled={!selected.support.type.includes("Custom")}
              onSelect={(value) => handleChange("valueType", value)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}x: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.x}
              disabled={!((enabled && selected.support.direction === "X") || isSlave || isHanger)}
              onSelect={(val) => handleChange("x", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}y: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.y}
              disabled={!((enabled && selected.support.direction === "Y") || isSlave || isHanger)}
              onSelect={(val) => handleChange("y", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}z: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.z}
              disabled={!((enabled && selected.support.direction === "Z") || isSlave || isHanger)}
              onSelect={(val) => handleChange("z", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">N/m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Rx: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.Rx}
              disabled={!((enabled && selected.support.direction === "RX") || isSlave || isHanger)}
              onSelect={(val) => handleChange("Rx", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Ry: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.Ry}
              disabled={!((enabled && selected.support.direction === "RY") || isSlave || isHanger)}
              onSelect={(val) => handleChange("Ry", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>{selected.support.valueType}Rz: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={isSlave ? ["Released"] : []}
              itemLabel={(val) => val}
              selected={selected.support.Rz}
              disabled={!((enabled && selected.support.direction === "RZ") || isSlave || isHanger)}
              onSelect={(val) => handleChange("Rz", val)}
              onCreate={(val) => `${Math.abs(Number(val) || 0)}`}
              filter={strFilter}
              clearable={true}
              className={"fill-select"}
            />
          </FormGroup>
          <div className="label-light">Nm/deg</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>µ: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={isK && !isSliding ? 0 : undefined}
              max={isK && !isSliding ? 0 : undefined}
              isDecimal={true}
              disabled={isK && !isSliding}
              value={selected.support.Mu}
              onChange={(val) => handleChange("Mu", val)}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Master Node at Pipe: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={pipeLine.map((p) => p.pipe)}
              itemLabel={(val) => val}
              selected={selected.support.masterNodePipe}
              disabled={!isSlave}
              onSelect={(val) => handleChange("masterNodePipe", val)}
              filter={strFilter}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Master Node at Dist from start: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={0}
              max={pipe?.length}
              isDecimal={true}
              value={selected.support.masterNodeDist}
              disabled={!isSlave}
              onChange={(val) => handleChange("masterNodeDist", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
      </div>
      <Button large fill text={"Remove"} intent={"danger"} onClick={handleRemove} />
    </div>
  ) : null;
}
