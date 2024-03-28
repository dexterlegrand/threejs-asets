import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { Material, PipeProfile } from "../../../../store/data/types";
import { TProcessElementPoint } from "../../../../store/process/types";
import { getUnicuesArray } from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { getFlanges } from "./ConnectionFlangeDlg";

type Props = {
  item: TProcessElementPoint;
  onClose: (item: TProcessElementPoint) => any;
};

export function ConnectionPipeDataDlg({ item, onClose }: Props) {
  const [changed, setChanged] = useState<TProcessElementPoint>(item);

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
    if (changed.lib) {
      return getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === changed.lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
    } else return [];
  }, [filteredProfiles, changed.lib]);

  const schedules = useMemo(() => {
    if (changed.nps) {
      return getUnicuesArray(
        filteredProfiles.filter((p) => p.nominal_pipe_size_inch === changed.nps)
      );
    } else return [];
  }, [filteredProfiles, changed.nps]);

  const materials = useMemo(() => {
    return resoures.materials.filter((m) => m.material_type === "PIPING");
  }, [resoures.materials]);

  useEffect(() => {
    if (changed.nps && changed.profile) {
      const flanges = getFlanges(resoures, changed.flangeType) ?? [];
      const flange = flanges.find(
        (f) =>
          f.nps === changed.nps &&
          f.class === changed.flangeClass &&
          f.material === changed.flange?.material
      );
      if (flange) setChanged((prev) => ({ ...prev, flange }));
    } else {
      setChanged((prev) => ({ ...prev, flange: undefined }));
    }
  }, [changed.nps, changed.profile]);

  function handleChangeLib(lib?: string) {
    if (changed.nps && changed.profile && lib) {
      const NPSs = getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
      if (NPSs.includes(changed.nps)) {
        const profile = filteredProfiles.find(
          (p) =>
            p.country_code === lib &&
            p.nominal_pipe_size_inch === changed.nps &&
            p.schedule === changed.profile!.schedule
        );
        setChanged((prev) => ({ ...prev, lib, profile }));
      } else {
        setChanged((prev) => ({
          ...prev,
          lib,
          nps: undefined,
          profile: undefined,
        }));
      }
    } else if (changed.nps && lib) {
      const NPSs = getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
      if (NPSs.includes(changed.nps)) {
        setChanged((prev) => ({ ...prev, lib }));
      } else setChanged((prev) => ({ ...prev, lib, nps: undefined }));
    } else setChanged((prev) => ({ ...prev, lib }));
  }

  function handleChangeNPS(nps?: string) {
    if (nps && changed.profile) {
      const profile = filteredProfiles.find(
        (p) =>
          p.country_code === changed.lib &&
          p.nominal_pipe_size_inch === nps &&
          p.schedule === changed.profile!.schedule
      );
      setChanged((prev) => ({ ...prev, nps, profile }));
    } else setChanged((prev) => ({ ...prev, nps }));
  }

  return (
    <CustomDlg
      title={"Connection Nozzle Data"}
      isMinimize={true}
      zIndex={6}
      position={"center"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                С/S Lib.
              </div>
              <SimpleSelector<string>
                items={libs}
                selected={changed.lib}
                onSelect={handleChangeLib}
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                NPS
              </div>
              <SimpleSelector<string>
                items={NPSs}
                selected={changed.nps}
                onSelect={handleChangeNPS}
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                Schedule
              </div>
              <SimpleSelector<PipeProfile>
                items={schedules}
                selected={changed.profile}
                onSelect={(profile) =>
                  setChanged({
                    ...changed,
                    profile,
                    od_MM: profile?.outside_diameter_global ?? changed.od_MM,
                    wt_MM: profile?.wall_thickness_global ?? changed.wt_MM,
                  })
                }
                autoFocus={true}
                itemLabel={(val) => val.schedule}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                Outer Diameter
              </div>
              <SimpleNumericInput
                min={1}
                value={changed.od_MM}
                disabled={!!changed.profile}
                onChange={(od_MM) => setChanged({ ...changed, od_MM })}
              />
              <div className="label-light p-start-10">mm</div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                Wall Thickness
              </div>
              <SimpleNumericInput
                min={1}
                value={changed.wt_MM}
                disabled={!!changed.profile}
                onChange={(wt_MM) => setChanged({ ...changed, wt_MM })}
              />
              <div className="label-light p-start-10">mm</div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div
                className="label-light p-start-10 t-end"
                style={{ minWidth: 150 }}
              >
                Material
              </div>
              <SimpleSelector<Material>
                items={materials}
                selected={changed.material}
                onSelect={(material) => setChanged({ ...changed, material })}
                autoFocus={true}
                itemLabel={(val) => val.material_name}
                className={`fill-select w-150`}
              />
            </div>
          </div>
        </div>
      }
      onClose={() => onClose(changed)}
    />
  );
}
