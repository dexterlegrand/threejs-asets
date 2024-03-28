import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Icon, FormGroup } from "@blueprintjs/core";
import {
  changeProjectAction,
  deletePipesAction,
} from "../../../../store/main/actions";
import {
  roundM,
  roundVectorM,
  getPosByDistance,
  getUnicuesArray,
  getRGB,
} from "../../../3d-models/utils";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { ApplicationState } from "../../../../store";
import { Vector3 } from "three";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { PipeProfile, Material } from "../../../../store/data/types";
import { FreePipe, TSelectedPipe, Project } from "../../../../store/main/types";
import { confirmAction } from "../../../../store/ui/actions";
import {
  selectFreePipe,
  unselectFreePipes,
} from "../../../../store/selections/actions";
import { SimpleInput } from "../../../common/SimpleInput";
import { changePipeLineTag } from "../../../../services/pipe-services/pipe-service";
import { CustomDlg } from "../../../common/CustomDlg";
import { SketchPicker } from "react-color";
import { pipeColorRGB } from "../../../../store/main/constants";

type Props = {
  project: Project | undefined;
};

export function SelectedPipe({ project }: Props) {
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedPipes
  );
  const resoures = useSelector((state: ApplicationState) => state.data);

  const dispatch = useDispatch();

  const selectedPipe = useMemo(() => {
    return selected?.length === 1 ? selected[0] : undefined;
  }, [selected]);

  const libs = useMemo(() => {
    return getUnicuesArray(
      resoures.pipingSS.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [resoures]);

  const profiles = useMemo(() => {
    if (!selectedPipe?.pipe) return [];
    return resoures.pipingSS.filter(
      (profile) =>
        profile.country_code === selectedPipe.pipe!.params.lib &&
        profile.outside_diameter_global &&
        profile.wall_thickness_global
    );
  }, [resoures, selectedPipe]);

  const NPSs = useMemo(() => {
    return getUnicuesArray(
      profiles.map((profile) => profile.nominal_pipe_size_inch)
    );
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    if (!selectedPipe?.pipe) return [];
    return profiles.filter(
      (profile) =>
        profile.nominal_pipe_size_inch === selectedPipe.pipe!.params.nps
    );
  }, [profiles, selectedPipe]);

  const nexts = useMemo(() => {
    if (!project || !selectedPipe?.pipe) return false;
    return (
      project.freePipes?.some((r) => r.preceding === selectedPipe.pipe!.pipe) ??
      false
    );
  }, [project, selectedPipe]);

  const prevs = useMemo(() => {
    if (!project || !selectedPipe?.pipe) return false;
    return (
      project.freePipes?.some((r) => r.pipe === selectedPipe.pipe!.preceding) ??
      false
    );
  }, [project, selectedPipe]);

  function handleChangeSelected(
    freePipes: FreePipe[],
    selected?: TSelectedPipe
  ) {
    if (!project) return;
    dispatch(changeProjectAction({ ...project, freePipes }));
    selected && dispatch(selectFreePipe(selected));
  }

  function handleChangeAxesHelper() {
    if (!project || !selectedPipe?.pipe) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          models: {
            ...project.settings.models,
            axesHelper: selectedPipe.isAxesHelper
              ? undefined
              : selectedPipe.pipe!.pipe,
          },
        },
      })
    );
    dispatch(
      selectFreePipe({
        ...selectedPipe,
        isAxesHelper: !selectedPipe.isAxesHelper,
      })
    );
  }

  function handleChange(field: string, value: any) {
    if (!project || !selectedPipe?.pipe) return;
    let freePipes = [...(project.freePipes ?? [])];
    let changed = { ...selectedPipe.pipe, [field]: value };
    const start = new Vector3(changed.x1, changed.y1, changed.z1);
    const end = new Vector3(changed.x2, changed.y2, changed.z2);
    if (changed.preceding !== "START") {
      changed = {
        ...changed,
        x1: start.x,
        y1: start.y,
        z1: start.z,
        x2: end.x,
        y2: end.y,
        z2: end.z,
      };
    }
    if (field === "tag") {
      freePipes = changePipeLineTag(freePipes, changed.pipe, value);
    }
    changed = { ...changed, length: roundM(start.distanceTo(end)) };
    freePipes = freePipes.map((item) =>
      item.id === selectedPipe.pipe!.id ? changed : item
    );
    handleChangeSelected(freePipes, {
      ...selectedPipe,
      pipe: changed,
      start,
      end,
    });
  }

  function handleChangeLength(length: number) {
    if (!project || !selectedPipe?.pipe) return;
    const start = new Vector3(
      selectedPipe.pipe.x1,
      selectedPipe.pipe.y1,
      selectedPipe.pipe.z1
    );
    const end = new Vector3(
      selectedPipe.pipe.x2,
      selectedPipe.pipe.y2,
      selectedPipe.pipe.z2
    );
    const newEnd = new Vector3().copy(end);
    if (start.distanceTo(end)) {
      newEnd.copy(roundVectorM(getPosByDistance(length, start, end)));
    } else {
      newEnd.setX(start.x + length);
    }
    const changed = {
      ...selectedPipe.pipe,
      length,
      x2: newEnd.x,
      y2: newEnd.y,
      z2: newEnd.z,
    };
    const freePipes =
      project.freePipes?.map((item) =>
        item.id === selectedPipe.pipe!.id ? changed : item
      ) ?? [];
    handleChangeSelected(freePipes, {
      ...selectedPipe,
      pipe: changed,
      start,
      end,
    });
  }

  function handleChangeEndPoint(field: "x2" | "y2" | "z2", value: number) {
    if (!project || !selectedPipe?.pipe) return;
    let changed =
      field === "y2"
        ? {
            ...selectedPipe.pipe,
            [field]: value,
            elevation: (selectedPipe.pipe.y1 + value) / 2,
          }
        : { ...selectedPipe.pipe, [field]: value };
    const start = new Vector3(changed.x1, changed.y1, changed.z1);
    const end = new Vector3(changed.x2, changed.y2, changed.z2);
    changed = { ...changed, length: roundM(start.distanceTo(end)) };
    const freePipes =
      project.freePipes?.map((item) =>
        item.id === selectedPipe.pipe!.id ? changed : item
      ) ?? [];
    handleChangeSelected(freePipes, {
      ...selectedPipe,
      pipe: changed,
      start,
      end,
    });
  }

  function handleChangeParamsRow(field: string, value: any) {
    if (!project || !selectedPipe?.pipe) return;
    let changed = {
      ...selectedPipe.pipe,
      params: { ...selectedPipe.pipe.params, [field]: value },
    };
    if (field === "nps") {
      changed = {
        ...changed,
        params: {
          ...changed.params,
          profile: undefined,
          endConnector: undefined,
          endConnectorDetails: undefined,
          startFlange: undefined,
          endFlange: undefined,
        },
      };
    } else if (field === "profile") {
      changed = {
        ...changed,
        params: {
          ...changed.params,
          profile: value,
          od: value?.outside_diameter_global ?? 0,
          thickness: value?.wall_thickness_global ?? 0,
        },
      };
    }
    const freePipes =
      project.freePipes?.map((item) =>
        item.id === selectedPipe.pipe!.id ? changed : item
      ) ?? [];
    handleChangeSelected(freePipes, { ...selectedPipe, pipe: changed });
  }

  function getBody() {
    return selected?.map((s) => {
      return (
        <h3 key={s.pipeName} className={"no-m"} style={{ paddingLeft: 10 }}>
          Element name: {s.pipeName}
        </h3>
      );
    });
  }

  function handleRemove() {
    if (!selected) return;
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete the selected item?",
        onConfirm: () => {
          dispatch(
            deletePipesAction(
              selected.filter((s) => s.pipe).map((s) => s.pipe!.id)
            )
          );
          handleClose();
        },
      })
    );
  }

  function handleClose() {
    dispatch(unselectFreePipes());
  }

  function getSupports() {
    if (!selectedPipe?.pipe) return null;
    const supps = selectedPipe?.pipe?.params.supportDetails ?? [];
    return supps.map((sup) => {
      const pos = roundVectorM(
        getPosByDistance(sup.distance, selectedPipe.start, selectedPipe.end)
      );
      return (
        <React.Fragment key={`${sup.id}-${sup.type}`}>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">
              ({sup.type}) {sup.id}:
            </div>
          </div>
          <div className={"d-flex f-ai-center"}>
            X: {pos.x}m; Y: {pos.y}m; Z: {pos.z}m
          </div>
        </React.Fragment>
      );
    });
  }

  function getLength(pipe?: FreePipe) {
    if (!pipe) return 0;
    const start = new Vector3(pipe.x1, pipe.y1, pipe.z1);
    const end = new Vector3(pipe.x2, pipe.y2, pipe.z2);
    return roundM(start.distanceTo(end));
  }

  const [color, setColor] = useState<string | undefined>(
    selectedPipe?.pipe?.color
  );

  React.useEffect(() => {
    setColor(selectedPipe?.pipe?.color);
  }, [selectedPipe?.pipe?.color]);
  const [isColor, setIsColor] = React.useState(false);

  return selectedPipe ? (
    <>
      (
      <div className={"model-item-drawer"}>
        <div className={"header"}>
          <div className={"d-flex f-center"}>
            <Icon icon="info-sign" className={"m-5"} />
            <h2 className={"no-m"}>Element name: {selectedPipe.pipe?.pipe}</h2>
          </div>
          <Button
            large
            minimal
            icon={"cross"}
            onClick={handleClose}
            intent={"danger"}
          />
        </div>
        <div className={"body-grid"}>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Color: </div>
          </div>
          <div
            className="d-flex f-ai-center"
            style={{ gap: 8 }}
            onClick={() => {
              setIsColor(true);
              // setColor(color === "Default" ? DefaultColorPalette[type] : color);
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 15,
                // @ts-ignore
                backgroundColor: color ?? getRGB(pipeColorRGB),
              }}
            />
            <span>{color}</span>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light"}>Line No.: </div>
          </div>
          <div className="d-flex f-ai-center">{selectedPipe.pipe?.line}</div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light"}>Tag: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleInput
                value={selectedPipe.pipe?.tag}
                disabled={prevs}
                onChange={(val) => handleChange("tag", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light t-end"}>Supporting Structure: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleSelector<string>
                items={[
                  ...(project?.models ?? []),
                  ...(project?.flares ?? []),
                ].map((m) => m.name)}
                itemLabel={(val) => val}
                selected={selectedPipe.pipe?.structure}
                onSelect={(val) => handleChangeParamsRow("structure", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light"}>Axes Helper:</div>
          </div>
          <div className="d-flex f-ai-center">
            <span
              onClick={handleChangeAxesHelper}
              style={{ cursor: "pointer" }}
            >{`${selectedPipe.isAxesHelper}`}</span>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Start Position X:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.x1}
                /*disabled={nexts || prevs}*/
                onChange={(val) => handleChange("x1", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Start Position Y:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.y1}
                /*disabled={nexts || prevs}*/
                onChange={(val) => handleChange("y1", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Start Position Z:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.z1}
                /*disabled={nexts || prevs}*/
                onChange={(val) => handleChange("z1", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">End Position X:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.x2}
                /*disabled={nexts}*/
                onChange={(val) => handleChangeEndPoint("x2", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">End Position Y:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.y2}
                /*disabled={nexts}*/
                onChange={(val) => handleChangeEndPoint("y2", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">End Position Z:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={selectedPipe.pipe?.z2}
                /*disabled={nexts}*/
                onChange={(val) => handleChangeEndPoint("z2", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light"}>Length: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={getLength(selectedPipe.pipe)}
                /*disabled={nexts}*/
                onChange={handleChangeLength}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light">C/S Library: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleSelector<string>
                items={libs}
                itemLabel={(val) => `${val}`}
                selected={selectedPipe.pipe?.params.lib}
                onSelect={(val) => handleChangeParamsRow("lib", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light">NPS: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleSelector<string>
                items={NPSs}
                itemLabel={(val) => `${val}`}
                selected={selectedPipe.pipe?.params.nps}
                onSelect={(val) => handleChangeParamsRow("nps", val)}
                filter={(query, item) =>
                  query
                    ? item
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase())
                    : true
                }
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light">Schedule: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleSelector<PipeProfile>
                items={filteredProfiles}
                itemLabel={(item) => item.schedule}
                selected={selectedPipe.pipe?.params.profile}
                onSelect={(val) => handleChangeParamsRow("profile", val)}
                filter={(query, item) =>
                  query
                    ? item.schedule
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase())
                    : true
                }
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light">Standard: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            {selectedPipe.pipe?.params.profile?.material}
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light">Material: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <SimpleSelector<Material>
              items={resoures.materials.filter(
                (m) => m.material_type === "PIPING"
              )}
              itemLabel={(item) => item.material_name}
              selected={selectedPipe.pipe?.params.material}
              onSelect={(value) => handleChangeParamsRow("material", value)}
              filter={(query, item) =>
                query
                  ? item.material_name
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  : true
              }
              className={"fill-select"}
            />
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">Outer Diameter: </div>
          </div>
          <div className="d-flex f-ai-center">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={selectedPipe.pipe?.params.od}
              disabled={!!selectedPipe.pipe?.params.profile}
              onChange={(value) => handleChangeParamsRow("od", value)}
            />
            <div className="label-light">mm</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">Wall Thickness: </div>
          </div>
          <div className="d-flex f-ai-center">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={selectedPipe.pipe?.params.thickness}
              disabled={!!selectedPipe.pipe?.params.profile}
              onChange={(value) => handleChangeParamsRow("thickness", value)}
            />
            <div className="label-light">mm</div>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light">Supports: </div>
          </div>
          <div className={"d-flex f-ai-center"} />
          {getSupports()}
        </div>
        <Button
          large
          fill
          text={"Remove"}
          intent={"danger"}
          onClick={handleRemove}
        />
      </div>
      {isColor && (
        <CustomDlg
          zIndex={3}
          title="Color"
          onClose={() => setIsColor(false)}
          body={
            <SketchPicker
              color={color}
              disableAlpha={true}
              onChange={(color) => setColor(color.hex)}
            />
          }
          actions={
            <Button
              text={"Save"}
              intent={"primary"}
              onClick={() => {
                handleChange("color", color);
                setIsColor(false);
                // if (!model || !type) return;
                // dispatch(
                //   changeModel({
                //     ...model,
                //     palette: {
                //       ...((model as TOpenFrame).palette ?? {}),
                //       [type]: color,
                //     },
                //   } as TOpenFrame)
                // );
              }}
            />
          }
        />
      )}
      )
    </>
  ) : selected?.length ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Selected Elements:</h2>
        </div>
        <Button
          large
          minimal
          icon={"cross"}
          onClick={handleClose}
          intent={"danger"}
        />
      </div>
      <div className={"body"}>
        <div className={"d-flex f-column"}>{getBody()}</div>
      </div>
      <Button
        large
        fill
        text={"Remove"}
        intent={"danger"}
        onClick={handleRemove}
      />
    </div>
  ) : null;
}
