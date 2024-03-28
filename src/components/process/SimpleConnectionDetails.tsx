import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import {
  mousePipeCreating,
  TConnectionSegmentParams,
} from "../../recoil/atoms/process-atoms";
import { ApplicationState } from "../../store";
import { Material, PipeProfile, TPipingFlange } from "../../store/data/types";
import { TFlangeType, TLongWeldType } from "../../store/main/types";
import {
  EConnectionElementType,
  EPipeElementType,
  TProcessElementPoint,
} from "../../store/process/types";
import { getUnicuesArray } from "../3d-models/utils";
import { CustomDlg } from "../common/CustomDlg";
import { SimpleNumericInput } from "../common/SimpleNumericInput";
import { SimpleSelector } from "../common/SimpleSelector";
import { flangeTypes } from "../../store/main/constants";
import { getFlanges as getFlangesByResource } from "../work-field/selections/process/ConnectionFlangeDlg";
import { getFlanges } from "../../services/pipe-services/pipe-service";

export function SimpleConnectionDetails() {
  const resoures = useSelector((state: ApplicationState) => state.data);

  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);

  const params = useMemo(() => {
    return MPCState.connectionSegmentParams;
  }, [MPCState.connectionSegmentParams]);

  useEffect(() => {
    if (params.lib && params.nps && params.schedule) {
      const profile = resoures.pipingSS.find(
        (p) =>
          p.country_code === params.lib &&
          p.nominal_pipe_size_inch === params.nps &&
          p.schedule === params.schedule
      );
      setMPCState({
        ...MPCState,
        connectionSegmentParams: { ...params, profile },
      });
    }
  }, [params.lib, params.nps, params.schedule, resoures.pipingSS]);

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
    if (params.lib) {
      return getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === params.lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
    } else return [];
  }, [filteredProfiles, params.lib]);

  const schedules = useMemo(() => {
    if (params.nps) {
      return getUnicuesArray(
        filteredProfiles
          .filter((p) => p.nominal_pipe_size_inch === params.nps)
          .map((profile) => profile.schedule)
      );
    } else return [];
  }, [filteredProfiles, params.nps]);

  const profiles = useMemo(() => {
    if (params.nps) {
      return getUnicuesArray(
        filteredProfiles.filter((p) => p.nominal_pipe_size_inch === params.nps)
      );
    } else return [];
  }, [filteredProfiles, params.nps]);

  const materials = useMemo(() => {
    return resoures.materials.filter((m) => m.material_type === "PIPING");
  }, [resoures.materials]);

  useEffect(() => {
    setMPCState((prev) => ({
      ...prev,
      connectionSegmentParams: {
        ...prev.connectionSegmentParams,
        nps: undefined,
      },
    }));
  }, [params.lib]);

  useEffect(() => {
    setMPCState((prev) => ({
      ...prev,
      connectionSegmentParams: {
        ...prev.connectionSegmentParams,
        schedule: undefined,
      },
    }));
  }, [params.nps]);

  useEffect(() => {
    if (params.schedule) return;
    setMPCState((prev) => ({
      ...prev,
      connectionSegmentParams: {
        ...prev.connectionSegmentParams,
        profile: undefined,
      },
    }));
  }, [params.schedule]);

  function handleChangeConnectionSegmentParams(
    params: TConnectionSegmentParams
  ) {
    setMPCState({
      ...MPCState,
      connectionSegmentParams: { ...params },
    });
  }

  const classes = useMemo(() => {
    return MPCState.pipeFlangeParams?.type
      ? getUnicuesArray(
          getFlanges(MPCState.pipeFlangeParams?.type, resoures).map(
            (f: TPipingFlange) => f.class
          )
        )
      : [];
  }, [MPCState.pipeFlangeParams?.type]);

  return MPCState.processPipeElement === EConnectionElementType.NOZZLE ? (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      idText="nozzle-connection-parameter-dialog"
      title={"Connection Parameters"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className={"d-flex f-ai-center bg-gray p-end-10"}>
            <div className="label-light p-start-10" style={{ minWidth: 100 }}>
              Connection Type
            </div>
            <SimpleSelector<string>
              items={["START", "END"]}
              selected={params.connectionType}
              onSelect={(connectionType: any) =>
                handleChangeConnectionSegmentParams({
                  ...params,
                  connectionType,
                })
              }
              autoFocus={true}
              itemLabel={(val) => val}
              className={`fill-select w-150`}
            />
          </div>
          <div className={"d-flex f-ai-center bg-gray p-end-10"}>
            <div className="label-light p-start-10" style={{ minWidth: 100 }}>
              Starting point at:
            </div>
            <SimpleSelector<string>
              items={["Center", "Surface"]}
              selected={params.startingAt}
              onSelect={(startingAt: any) =>
                handleChangeConnectionSegmentParams({
                  ...params,
                  startingAt,
                })
              }
              autoFocus={true}
              itemLabel={(val) => val}
              className={`fill-select w-150`}
            />
          </div>
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                С/S Lib.
              </div>
              <SimpleSelector<string>
                items={libs}
                selected={params.lib}
                onSelect={(lib) =>
                  handleChangeConnectionSegmentParams({ ...params, lib })
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                NPS
              </div>
              <SimpleSelector<string>
                items={NPSs}
                selected={params.nps}
                onSelect={(nps) =>
                  handleChangeConnectionSegmentParams({ ...params, nps })
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Schedule
              </div>
              <SimpleSelector<PipeProfile>
                items={profiles}
                selected={params.profile}
                onSelect={(profile) =>
                  handleChangeConnectionSegmentParams({
                    ...params,
                    profile: profile,
                    od_MM: profile?.outside_diameter_global ?? params.od_MM,
                    wt_MM: profile?.wall_thickness_global ?? params.wt_MM,
                  })
                }
                autoFocus={true}
                itemLabel={(val) => val.schedule}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Material
              </div>
              <SimpleSelector<Material>
                items={materials}
                selected={params.material}
                onSelect={(material) =>
                  handleChangeConnectionSegmentParams({ ...params, material })
                }
                autoFocus={true}
                itemLabel={(val) => val.material_name}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Outer Diameter
              </div>
              <SimpleNumericInput
                min={0}
                value={params.od_MM}
                onChange={(od_MM) =>
                  handleChangeConnectionSegmentParams({ ...params, od_MM })
                }
              />
              <div className="label-light w-mc p-start-10">mm</div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Wall Thickness
              </div>
              <SimpleNumericInput
                min={0}
                value={params.wt_MM}
                onChange={(wt_MM) =>
                  handleChangeConnectionSegmentParams({ ...params, wt_MM })
                }
              />
              <div className="label-light w-mc p-start-10">mm</div>
            </div>
            {/* <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Long. Weld Type
              </div>
              <SimpleSelector<TLongWeldType>
                items={["S", "EFW", "ERW", "FBW"]}
                selected={params.longWeldType}
                onSelect={(longWeldType) =>
                  longWeldType &&
                  handleChangeConnectionSegmentParams({
                    ...params,
                    longWeldType,
                  })
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div> */}
          </div>
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Flange Type
              </div>
              <SimpleSelector<TFlangeType>
                items={flangeTypes}
                selected={MPCState.pipeFlangeParams?.type}
                onSelect={(flangeType) =>
                  setMPCState({
                    ...MPCState,
                    pipeFlangeParams: {
                      type: flangeType,
                      class: undefined,
                    },
                  })
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Flange Class
              </div>
              <SimpleSelector<number>
                items={classes}
                selected={MPCState.pipeFlangeParams?.class}
                onSelect={(flangeClass) =>
                  setMPCState({
                    ...MPCState,
                    pipeFlangeParams: {
                      ...(MPCState.pipeFlangeParams || {}),
                      class: flangeClass,
                    },
                  })
                }
                autoFocus={true}
                itemLabel={(val) => `${val}`}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Flange Material
              </div>
              <SimpleSelector<TPipingFlange>
                items={getFlangesByResource(
                  resoures,
                  MPCState.pipeFlangeParams?.type
                ).filter(
                  (f) =>
                    f.nps === params.nps &&
                    f.class === MPCState.pipeFlangeParams?.class
                )}
                selected={MPCState.pipeFlangeParams?.material}
                onSelect={(flangeMaterial) =>
                  setMPCState({
                    ...MPCState,
                    pipeFlangeParams: {
                      ...(MPCState.pipeFlangeParams || {}),
                      material: flangeMaterial,
                    },
                  })
                }
                autoFocus={true}
                itemLabel={(val) => val.material}
                className={`fill-select w-150`}
              />
            </div>
          </div>
        </div>
      }
      onClose={() =>
        setMPCState({ ...MPCState, processPipeElement: undefined })
      }
    />
  ) : null;
}
