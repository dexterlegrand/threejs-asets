import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import {
  mousePipeCreating,
  TPipeSegmentParams,
} from "../../recoil/atoms/process-atoms";
import { ApplicationState } from "../../store";
import { Material } from "../../store/data/types";
import { TLongWeldType } from "../../store/main/types";
import { EPipeElementType } from "../../store/process/types";
import { getUnicuesArray } from "../3d-models/utils";
import { CustomDlg } from "../common/CustomDlg";
import { SimpleNumericInput } from "../common/SimpleNumericInput";
import { SimpleSelector } from "../common/SimpleSelector";

export function SimplePipeDetails() {
  const resoures = useSelector((state: ApplicationState) => state.data);

  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);

  const params = useMemo(() => {
    return MPCState.pipeSegmentParams;
  }, [MPCState.pipeSegmentParams]);

  useEffect(() => {
    if (params.lib && params.nps && params.schedule) {
      const profile = resoures.pipingSS.find(
        (p) =>
          p.country_code === params.lib &&
          p.nominal_pipe_size_inch === params.nps &&
          p.schedule === params.schedule
      );
      setMPCState({ ...MPCState, pipeSegmentParams: { ...params, profile } });
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

  const materials = useMemo(() => {
    return resoures.materials.filter((m) => m.material_type === "PIPING");
  }, [resoures.materials]);

  useEffect(() => {
    setMPCState((prev) => ({
      ...prev,
      pipeSegmentParams: { ...prev.pipeSegmentParams, nps: undefined },
    }));
  }, [params.lib]);

  useEffect(() => {
    setMPCState((prev) => ({
      ...prev,
      pipeSegmentParams: { ...prev.pipeSegmentParams, schedule: undefined },
    }));
  }, [params.nps]);

  useEffect(() => {
    if (params.schedule) return;
    setMPCState((prev) => ({
      ...prev,
      pipeSegmentParams: { ...prev.pipeSegmentParams, profile: undefined },
    }));
  }, [params.schedule]);

  function handleChangePipeSegmentParams(params: TPipeSegmentParams) {
    setMPCState({
      ...MPCState,
      pipeSegmentParams: { ...params },
    });
  }

  return MPCState.processPipeElement === EPipeElementType.PIPE ? (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      title={"Manual Routing"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
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
                  handleChangePipeSegmentParams({ ...params, lib })
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
                  handleChangePipeSegmentParams({ ...params, nps })
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
              <SimpleSelector<string>
                items={schedules}
                selected={params.schedule}
                onSelect={(schedule) =>
                  handleChangePipeSegmentParams({ ...params, schedule })
                }
                autoFocus={true}
                itemLabel={(val) => val}
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
                  handleChangePipeSegmentParams({ ...params, material })
                }
                autoFocus={true}
                itemLabel={(val) => val.material_name}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Cor. allow
              </div>
              <SimpleNumericInput
                min={0}
                value={params.corAllow}
                onChange={(corAllow) =>
                  handleChangePipeSegmentParams({ ...params, corAllow })
                }
              />
              <div className="label-light w-mc p-start-10">mm</div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Mill toll.
              </div>
              <SimpleNumericInput
                min={0}
                max={100}
                value={params.millToll}
                onChange={(millToll) =>
                  handleChangePipeSegmentParams({ ...params, millToll })
                }
              />
              <div className="label-light w-mc p-start-10">%</div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Long. Weld Type
              </div>
              <SimpleSelector<TLongWeldType>
                items={["S", "EFW", "ERW", "FBW"]}
                selected={params.longWeldType}
                onSelect={(longWeldType) =>
                  longWeldType &&
                  handleChangePipeSegmentParams({ ...params, longWeldType })
                }
                autoFocus={true}
                itemLabel={(val) => val}
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
