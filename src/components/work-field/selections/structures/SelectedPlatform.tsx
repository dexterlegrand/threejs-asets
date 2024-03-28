import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { changeOFUIAction, confirmAction } from "../../../../store/ui/actions";
import {
  getCurrentProject,
  getCurrentUI,
  localToGlobal,
  roundVectorM,
} from "../../../3d-models/utils";
import { selectModelPlatform } from "../../../../store/selections/actions";
import { Button, FormGroup, Icon } from "@blueprintjs/core";
import { getOFModels } from "../../../3d-models/openFrame";
import { changeModel } from "../../../../store/main/actions";
import {
  TColorPallete,
  TOpenFrame,
} from "../../../../store/main/openFrameTypes";
import { CustomDlg } from "../../../common/CustomDlg";
import { SketchPicker } from "react-color";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { Vector3 } from "three";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { getLeftDistances } from "../../../menu-bar/3d-modeling/open-frame/platforms/Platforms";
import { getWidths } from "../../../menu-bar/3d-modeling/open-frame/platforms/Platforms";

const DefaultColorPalette: TColorPallete = {
  PLATFORM: "#996600",
};

export default React.memo(function SelectedPlatform() {
  const [isColor, setIsColor] = useState(false);
  const [color, setColor] = useState<string>();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedPlatform
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const model = useMemo(() => {
    if (!selected) return undefined;
    return models.find((m) => m.name === selected.model);
  }, [models, selected]);

  const { globalStart, globalEnd } = useMemo(() => {
    if (!selected)
      return { globalStart: new Vector3(), globalEnd: new Vector3() };
    const globalStart = roundVectorM(
      localToGlobal(selected.modelStart, selected.start, selected.modelDir)
    );
    const globalEnd = roundVectorM(
      localToGlobal(selected.modelStart, selected.end, selected.modelDir)
    );
    return { globalStart, globalEnd };
  }, [selected]);

  const elements = useMemo(() => {
    if (!model) return [];
    return [...model.beams, ...model.cantilevers];
  }, [model?.beams, model?.cantilevers]);

  const from = useMemo(() => {
    if (!selected) return undefined;
    return elements.find((el) => el.name === selected.data.from);
  }, [elements, selected?.data.from]);

  const to = useMemo(() => {
    if (!selected) return undefined;
    return elements.find((el) => el.name === selected.data.to);
  }, [elements, selected?.data.to]);

  const widths = useMemo(() => {
    if (!selected) return [];
    const distances = getLeftDistances(elements, from, to);
    return getWidths(distances, selected.data.distance);
  }, [elements, from, to, selected?.data.distance]);

  useEffect(() => {
    setColor(model?.palette?.PLATFORM ?? DefaultColorPalette.PLATFORM);
  }, [model?.palette?.PLATFORM]);

  if (!ui || !project || !model || !selected) return null;

  function handleRemove() {
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete the selected item?",
        onConfirm: () => {
          dispatch(
            changeModel({
              ...model,
              platforms: model!.platforms.filter(
                (p) => p.id !== selected!.data.id
              ),
            } as TOpenFrame)
          );
          dispatch(
            changeOFUIAction({
              ...ui!.openFrameUI,
              platforms: ui!.openFrameUI.platforms.filter(
                (p) => !(p.model === model!.name && p.id === selected!.data.id)
              ),
            })
          );
          handleClose();
        },
      })
    );
  }

  function handleClose() {
    dispatch(selectModelPlatform());
  }

  function handleChange(
    field: "distance" | "width" | "thickness",
    value: number
  ) {
    dispatch(
      changeModel({
        ...model,
        platforms: model!.platforms.map((p) =>
          p.id === selected!.data.id ? { ...p, [field]: value } : p
        ),
      } as TOpenFrame)
    );
    dispatch(
      changeOFUIAction({
        ...ui!.openFrameUI,
        platforms: ui!.openFrameUI.platforms.map((p) =>
          p.id === selected!.data.id && p.model === selected!.model
            ? {
                ...p,
                [field === "distance" ? "distanceFromLeft" : field]: value,
              }
            : p
        ),
      })
    );
    dispatch(
      selectModelPlatform({
        ...selected!,
        data: { ...selected!.data, [field]: value },
      })
    );
  }

  return (
    <>
      <div className={"model-item-drawer"}>
        <div className={"header"}>
          <div className={"d-flex f-center"}>
            <Icon icon="info-sign" className={"m-5"} />
            <h2 className={"no-m"}>
              Element name: {selected.name} of {selected.model}
            </h2>
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
            <div className={"label-light"}>Color: </div>
          </div>
          <div className="d-flex f-ai-center">
            <div
              className="d-flex f-ai-center"
              style={{ gap: 8 }}
              onClick={() => {
                setIsColor(true);
                setColor(
                  color === "Default" ? DefaultColorPalette.PLATFORM : color
                );
              }}
            >
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 15,
                  // @ts-ignore
                  backgroundColor:
                    color === "Default" ? DefaultColorPalette.PLATFORM : color,
                }}
              />
              <span>{color}</span>
            </div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc t-end">Start Local Position:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              ({selected.start.x}; {selected.start.y}; {selected.start.z})
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc t-end">End Local Position:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              ({selected.end.x}; {selected.end.y}; {selected.end.z})
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc t-end">Start Global Position:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              ({globalStart.x}; {globalStart.y}; {globalStart.z})
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc t-end">End Global Position:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              ({globalEnd.x}; {globalEnd.y}; {globalEnd.z})
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Start Beam:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">{selected.data.from}</FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">End Beam:</div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">{selected.data.to}</FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light t-end"}>Distance from start: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={selected.data.distance}
                onChange={(val) => handleChange("distance", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">Width: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleSelector<number>
                items={widths}
                itemLabel={(val) => `${val}`}
                selected={selected.data.width}
                onSelect={(val) => handleChange("width", val!)}
                className={"fill-select"}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light t-end">Thickness: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                min={1}
                value={selected.data.thickness}
                onChange={(val) => handleChange("thickness", val)}
              />
            </FormGroup>
            <div className="label-light">mm</div>
          </div>
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
                if (!model) return;
                dispatch(
                  changeModel({
                    ...model,
                    palette: {
                      ...(model.palette ?? {}),
                      PLATFORM: color,
                    },
                  } as TOpenFrame)
                );
              }}
            />
          }
        />
      )}
    </>
  );
});
