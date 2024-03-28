import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { DataState, TPipingFlange } from "../../../../store/data/types";
import { flangeTypes } from "../../../../store/main/constants";
import { TFlangeType } from "../../../../store/main/types";
import { TProcessElementPoint } from "../../../../store/process/types";
import { getUnicuesArray } from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import { SimpleSelector } from "../../../common/SimpleSelector";

type Props = {
  item: TProcessElementPoint;
  onClose: (item: TProcessElementPoint) => any;
};

export function ConnectionFlangeDlg({ item, onClose }: Props) {
  const [changed, setChanged] = useState<TProcessElementPoint>(item);

  const resoures = useSelector((state: ApplicationState) => state.data);

  const filteredProfiles = useMemo(() => {
    return resoures.pipingSS.filter(
      (p) => p.outside_diameter_global && p.wall_thickness_global
    );
  }, [resoures.pipingSS]);

  const classes = useMemo(() => {
    return changed.flangeType
      ? getUnicuesArray(
          getFlanges(resoures, changed.flangeType).map(
            (f: TPipingFlange) => f.class
          )
        )
      : [];
  }, [changed.flangeType, filteredProfiles]);

  function handleChangeType(flangeType?: TFlangeType) {
    if (changed.flangeClass && changed.flange && flangeType) {
      const flanges = getFlanges(resoures, flangeType);
      const classes = getUnicuesArray(
        flanges.map((f: TPipingFlange) => f.class)
      );
      if (classes.includes(changed.flangeClass)) {
        const flange = flanges.find(
          (f) =>
            f.nps === changed.nps &&
            f.class === changed.flangeClass &&
            f.material === changed.flange!.material
        );
        setChanged((prev) => ({ ...prev, flangeType, flange }));
      } else {
        setChanged((prev) => ({
          ...prev,
          flangeType,
          flangeClass: undefined,
          flange: undefined,
        }));
      }
    } else if (changed.flangeClass && flangeType) {
      const classes = getUnicuesArray(
        getFlanges(resoures, changed.flangeType).map(
          (f: TPipingFlange) => f.class
        )
      );
      if (classes.includes(changed.flangeClass)) {
        setChanged((prev) => ({ ...prev, flangeType }));
      } else {
        setChanged((prev) => ({ ...prev, flangeType, flangeClass: undefined }));
      }
    } else setChanged((prev) => ({ ...prev, flangeType }));
  }

  function handleChangeClass(flangeClass?: number) {
    if (flangeClass && changed.flange) {
      const flanges = getFlanges(resoures, changed.flangeType);
      const flange = flanges.find(
        (f) =>
          f.nps === changed.nps &&
          f.class === flangeClass &&
          f.material === changed.flange!.material
      );
      setChanged((prev) => ({ ...prev, flangeClass, flange }));
    } else setChanged((prev) => ({ ...prev, flangeClass }));
  }

  return (
    <CustomDlg
      title={"Connection Flange Data"}
      isMinimize={true}
      zIndex={6}
      position={"center"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Flange Type
              </div>
              <SimpleSelector<TFlangeType>
                items={flangeTypes}
                selected={changed.flangeType}
                onSelect={handleChangeType}
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
                selected={changed.flangeClass}
                onSelect={handleChangeClass}
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
                items={getFlanges(resoures, changed.flangeType).filter(
                  (f) =>
                    f.nps === changed.nps && f.class === changed.flangeClass
                )}
                selected={changed.flange}
                onSelect={(flange) => setChanged({ ...changed, flange })}
                autoFocus={true}
                itemLabel={(val) => val.material}
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

export function getFlanges(
  resoures: DataState,
  type?: TFlangeType
): TPipingFlange[] {
  switch (type) {
    case "Blind":
      return resoures.pipingFlangesBlind;
    case "Lapped":
      return resoures.pipingFlangesLapped;
    // case "Ring Joint Facing":
    // return resoures.pipingFlangesRingJointFacing;
    case "Slip On":
      return resoures.pipingFlangesSlipon.filter((f) => f.class !== 2500);
    case "Socket Welding":
      return resoures.pipingFlangesSocketWelding;
    case "Threaded":
      return resoures.pipingFlangesThreaded;
    case "Welding Neck":
      return resoures.pipingFlangesWeldingneck;
    default:
      return [];
  }
}
