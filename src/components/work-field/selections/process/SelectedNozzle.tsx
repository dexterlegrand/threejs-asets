import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Icon, Button, FormGroup } from "@blueprintjs/core";
import { ApplicationState } from "../../../../store";
import {
  changeProcessElementConnections,
  selectProcessElementNozzleAction,
} from "../../../../store/process/actions";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import {
  round,
  roundM,
  getNextId,
  getUnicuesArray,
  strFilter,
  degToRad,
  roundVectorM,
  MMtoM,
  fixVectorByOrientation,
  getPosByDistance,
} from "../../../3d-models/utils";
import {
  TProcessElement,
  EProcessElementType,
  TProcessElementPoint,
  EInstrumentationElementType,
  TInstrumentationLine,
  TInstrumentationElement,
  TProcessState,
} from "../../../../store/process/types";
import { Vector3 } from "three";
import {
  ConnectionDetailsDlg,
  getInclination,
  getTheta,
} from "./ConnectionDetailsDlg";
import { PipeProfile, TPipingFlange } from "../../../../store/data/types";
import { SimpleInput } from "../../../common/SimpleInput";
import { Dispatch } from "redux";
import { getFlanges } from "./ConnectionFlangeDlg";
import { TFlangeType } from "../../../../store/main/types";
import { flangeTypes } from "../../../../store/main/constants";

type Props = {
  current: string;
  processState: TProcessState;
  profiles: PipeProfile[];
  disabled: boolean;
};

export function SelectedNozzle({
  current,
  processState,
  profiles,
  disabled,
}: Props) {
  const item = useSelector(
    (state: ApplicationState) => state.process.selectedNozzle
  );

  const dispatch = useDispatch();

  const processes = useMemo(() => {
    return processState.processes;
  }, [processState]);

  const length = useMemo(() => {
    return item
      ? roundM(item.point.startPosition.distanceTo(item.point.generalPosition))
      : 0;
  }, [item?.point.startPosition, item?.point.generalPosition]);

  const elevation = useMemo(() => {
    return item ? item.point.startPosition.y : 0;
  }, [item?.point.startPosition.y]);

  const theta = useMemo(() => {
    return item ? getTheta(item.point) : 0;
  }, [item?.point]);

  const inclination = useMemo(() => {
    return item ? getInclination(item.point) : 0;
  }, [item?.point]);

  function handleClose() {
    dispatch(selectProcessElementNozzleAction(undefined));
  }

  function handleChange(field: string, val: any) {
    if (!item) return;
    const point = { ...item.point, [field]: val };
    dispatch(selectProcessElementNozzleAction({ ...item, point }));
    dispatch(
      changeProcessElementConnections(
        current,
        {
          ...item.el,
          points: item.el.points.map((p) =>
            p.id === item.point.id ? point : p
          ),
        },
        []
      )
    );
  }

  function handleChangeByParams(params: any) {
    if (!item) return;
    const point = { ...item.point, ...params };
    dispatch(selectProcessElementNozzleAction({ ...item, point }));
    dispatch(
      changeProcessElementConnections(
        current,
        {
          ...item.el,
          points: item.el.points.map((p) =>
            p.id === item.point.id ? point : p
          ),
        },
        []
      )
    );
  }

  function handleChangeStartPosition(field: "x" | "y" | "z", val: number) {
    if (!item) return;
    const startPosition = item.point.startPosition.clone();
    if (field === "x") {
      startPosition.setX(val);
    } else if (field === "y") {
      startPosition.setY(val);
    } else startPosition.setZ(val);
    const point: TProcessElementPoint = {
      ...item.point,
      startPosition: startPosition.clone(),
    };
    dispatch(selectProcessElementNozzleAction({ ...item, point }));
    dispatch(
      changeProcessElementConnections(
        current,
        {
          ...item.el,
          points: item.el.points.map((p) =>
            p.id === item.point.id ? point : p
          ),
        },
        []
      )
    );
  }

  function handleChangeEndPosition(field: "x" | "y" | "z", val: number) {
    if (!item) return;
    const generalPosition = item.point.generalPosition.clone();
    if (field === "x") {
      generalPosition.setX(val);
    } else if (field === "y") {
      generalPosition.setY(val);
    } else generalPosition.setZ(val);
    const point: TProcessElementPoint = {
      ...item.point,
      generalPosition: generalPosition.clone(),
    };
    dispatch(selectProcessElementNozzleAction({ ...item, point }));
    dispatch(
      changeProcessElementConnections(
        current,
        {
          ...item.el,
          points: item.el.points.map((p) =>
            p.id === item.point.id ? point : p
          ),
        },
        []
      )
    );
  }

  function changeLength(value: number) {
    if (!item) return;
    handleChange(
      "generalPosition",
      getPosByDistance(
        value,
        item.point.startPosition,
        item.point.generalPosition
      )
    );
  }

  function changeElevation(value: number) {
    if (!item) return;
    const point = {
      ...item.point,
      startPosition: item.point.startPosition.clone().setY(value),
      generalPosition: item.point.generalPosition.clone().setY(value),
    };
    dispatch(selectProcessElementNozzleAction({ ...item, point }));
    dispatch(
      changeProcessElementConnections(
        current,
        {
          ...item.el,
          points: item.el.points.map((p) =>
            p.id === item.point.id ? point : p
          ),
        },
        []
      )
    );
  }

  function changeTheta(value: number) {
    if (!item) return;
    handleChange(
      "generalPosition",
      fixVectorByOrientation(
        item.point.startPosition,
        fixVectorByOrientation(
          item.point.startPosition,
          item.point.generalPosition,
          theta
        ),
        -value
      )
    );
  }

  function changeInclination(value: number) {
    if (!item) return;
    const v = fixVectorByOrientation(
      item.point.startPosition,
      item.point.generalPosition,
      theta
    );
    v.copy(
      fixVectorByOrientation(item.point.startPosition, v, -inclination, "z")
    );
    v.copy(fixVectorByOrientation(item.point.startPosition, v, value, "z"));
    v.copy(fixVectorByOrientation(item.point.startPosition, v, -theta));
    handleChange("generalPosition", v.clone());
  }

  const resoures = useSelector((state: ApplicationState) => state.data);

  const filteredProfiles = useMemo(() => {
    return resoures.pipingSS.filter(
      (p) => p.outside_diameter_global && p.wall_thickness_global
    );
  }, [resoures.pipingSS]);

  const libs = useMemo(() => {
    return getUnicuesArray(
      filteredProfiles.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [filteredProfiles]);

  const NPSs = useMemo(() => {
    if (item?.point.lib) {
      return getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === item?.point.lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
    } else return [];
  }, [filteredProfiles, item?.point.lib]);

  const schedules = useMemo(() => {
    if (item?.point.nps) {
      return getUnicuesArray(
        filteredProfiles.filter(
          (p) => p.nominal_pipe_size_inch === item?.point.nps
        )
      );
    } else return [];
  }, [filteredProfiles, item?.point.nps]);

  const materials = useMemo(() => {
    return resoures.materials.filter((m) => m.material_type === "PIPING");
  }, [resoures.materials]);

  useEffect(() => {
    if (item?.point.nps && item?.point.profile) {
      const flanges = getFlanges(resoures, item?.point.flangeType);
      const flange = flanges.find(
        (f) =>
          f.nps === item?.point.nps &&
          f.class === item?.point.flangeClass &&
          f.material === item?.point.flange!.material
      );
      handleChange("flange", flange);
    } else handleChange("flange", undefined);
  }, [item?.point.nps, item?.point.profile]);

  function handleChangeLib(lib?: string) {
    if (item?.point.nps && item?.point.profile && lib) {
      const NPSs = getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
      if (NPSs.includes(item?.point.nps)) {
        const profile = filteredProfiles.find(
          (p) =>
            p.country_code === lib &&
            p.nominal_pipe_size_inch === item?.point.nps &&
            p.schedule === item?.point.profile!.schedule
        );
        handleChangeByParams({ lib, profile });
      } else {
        handleChangeByParams({ lib, nps: undefined, profile: undefined });
      }
    } else if (item?.point.nps && lib) {
      const NPSs = getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
      if (NPSs.includes(item?.point.nps)) {
        handleChangeByParams({ lib });
      } else handleChangeByParams({ lib, nps: undefined });
    } else handleChangeByParams({ lib });
  }

  function handleChangeNPS(nps?: string) {
    if (nps && item?.point.profile) {
      const profile = filteredProfiles.find(
        (p) =>
          p.country_code === item?.point.lib &&
          p.nominal_pipe_size_inch === nps &&
          p.schedule === item?.point.profile!.schedule
      );
      handleChangeByParams({ nps, profile });
    } else handleChangeByParams({ nps });
  }

  const classes = useMemo(() => {
    return item?.point.flangeType
      ? getUnicuesArray(
          getFlanges(resoures, item?.point.flangeType).map(
            (f: TPipingFlange) => f.class
          )
        )
      : [];
  }, [item?.point.flangeType, filteredProfiles]);

  function handleChangeType(flangeType?: TFlangeType) {
    if (item?.point.flangeClass && item?.point.flange && flangeType) {
      const flanges = getFlanges(resoures, flangeType);
      const classes = getUnicuesArray(
        flanges.map((f: TPipingFlange) => f.class)
      );
      if (classes.includes(item?.point.flangeClass)) {
        const flange = flanges.find(
          (f) =>
            f.nps === item?.point.nps &&
            f.class === item?.point.flangeClass &&
            f.material === item?.point.flange!.material
        );
        handleChangeByParams({ flangeType, flange });
      } else {
        handleChangeByParams({
          flangeType,
          flangeClass: undefined,
          flange: undefined,
        });
      }
    } else if (item?.point.flangeClass && flangeType) {
      const classes = getUnicuesArray(
        getFlanges(resoures, item?.point.flangeType).map(
          (f: TPipingFlange) => f.class
        )
      );
      if (classes.includes(item?.point.flangeClass)) {
        handleChangeByParams({ flangeType });
      } else {
        handleChangeByParams({ flangeType, flangeClass: undefined });
      }
    } else handleChangeByParams({ flangeType });
  }

  function handleChangeClass(flangeClass?: number) {
    if (flangeClass && item?.point.flange) {
      const flanges = getFlanges(resoures, item?.point.flangeType);
      const flange = flanges.find(
        (f) =>
          f.nps === item?.point.nps &&
          f.class === flangeClass &&
          f.material === item?.point.flange!.material
      );
      handleChangeByParams({ flangeClass, flange });
    } else handleChangeByParams({ flangeClass });
  }

  return item ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Element name: Conn. {item.point.id} of {item.el.name}
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
      <div
        className={"body-grid"}
        style={{
          gridTemplateColumns: "105px 1fr",
        }}
      >
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Fixed: </div>
        </div>
        <div className="d-flex f-ai-center">
          <span
            onClick={() => handleChange("isFixed", !item.point.isFixed)}
            style={{ cursor: "pointer" }}
          >{`${item.point.isFixed ?? "false"}`}</span>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Connection Type: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<"START" | "END">
              items={["START", "END"]}
              itemLabel={(val) => val}
              selected={item.point.connectionType}
              onSelect={(val) => handleChange("connectionType", val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        {item.point.element ? (
          <>
            <div className="d-flex f-ai-center f-jc-end">
              <div className="label-light w-mc t-end">Connected Element: </div>
            </div>
            <div className="d-flex f-ai-center">{item.point.element}</div>
          </>
        ) : null}

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Start Position X: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.startPosition.x}
              onChange={(val) => handleChangeStartPosition("x", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Start Position Y: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.startPosition.y}
              onChange={(val) => handleChangeStartPosition("y", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Start Position Z: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.startPosition.z}
              onChange={(val) => handleChangeStartPosition("z", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">End Position X: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.generalPosition.x}
              onChange={(val) => handleChangeEndPosition("x", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">End Position Y: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.generalPosition.y}
              onChange={(val) => handleChangeEndPosition("y", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">End Position Z: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.point.generalPosition.z}
              onChange={(val) => handleChangeEndPosition("z", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Length: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={length}
              onChange={(val) => changeLength(val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Elevation: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={elevation}
              onChange={(val) => changeElevation(val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Theta: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={-180}
              max={180}
              value={theta}
              onChange={(val) => changeTheta(val)}
            />
          </FormGroup>
          <div className="label-light">deg</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Inclination: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={-90}
              max={90}
              value={inclination}
              onChange={(val) => changeInclination(val)}
            />
          </FormGroup>
          <div className="label-light">deg</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">С/S Lib.: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={libs}
              itemLabel={(val) => val}
              selected={item.point.lib}
              onSelect={(val) => handleChangeLib(val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">NPS: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<string>
              items={NPSs}
              itemLabel={(val) => val}
              selected={item.point.nps}
              onSelect={(val) => handleChangeNPS(val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Schedule: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<PipeProfile>
              items={schedules}
              itemLabel={(val) => val.schedule}
              selected={item.point.profile}
              onSelect={(val) =>
                handleChangeByParams({
                  val,
                  od_MM: val?.outside_diameter_global ?? item.point.od_MM,
                  wt_MM: val?.wall_thickness_global ?? item.point.wt_MM,
                })
              }
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Outer Diameter: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={0}
              value={item.point.od_MM}
              disabled={!!item.point.profile}
              onChange={(val) => handleChange("od_MM", val)}
            />
          </FormGroup>
          <div className="label-light">mm</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Wall Thickness: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              min={0}
              value={item.point.wt_MM}
              disabled={!!item.point.profile}
              onChange={(val) => handleChange("wt_MM", val)}
            />
          </FormGroup>
          <div className="label-light">mm</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Flange Type: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<TFlangeType>
              items={flangeTypes}
              itemLabel={(val) => val}
              selected={item.point.flangeType}
              onSelect={(val) => handleChangeType(val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Flange Class: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<number>
              items={classes}
              itemLabel={(val) => `${val}`}
              selected={item.point.flangeClass}
              onSelect={(val) => handleChangeClass(val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Flange Material: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleSelector<TPipingFlange>
              items={getFlanges(resoures, item.point.flangeType).filter(
                (f) =>
                  f.nps === item.point.nps && f.class === item.point.flangeClass
              )}
              itemLabel={(val) => val.material}
              selected={item.point.flange}
              onSelect={(val) => handleChange("flange", val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  ) : null;
}
