import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { mousePipeCreating } from "../../recoil/atoms/process-atoms";
import { getFlanges } from "../../services/pipe-services/pipe-service";
import { ApplicationState } from "../../store";
import { TPipingFlange } from "../../store/data/types";
import { flangeTypes } from "../../store/main/constants";
import { TFlangeType } from "../../store/main/types";
import { EPipeElementType } from "../../store/process/types";
import { getUnicuesArray } from "../3d-models/utils";
import { CustomDlg } from "../common/CustomDlg";
import { SimpleSelector } from "../common/SimpleSelector";

export function SimpleFlangeDetails() {
  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);

  const resoures = useSelector((state: ApplicationState) => state.data);

  const classes = useMemo(() => {
    return MPCState.pipeFlangeParams?.type
      ? getUnicuesArray(
          getFlanges(MPCState.pipeFlangeParams?.type, resoures).map(
            (f: TPipingFlange) => f.class
          )
        )
      : [];
  }, [MPCState.pipeFlangeParams?.type]);

  return MPCState.processPipeElement === EPipeElementType.FLANGE ? (
    <CustomDlg
      title={"Flange Params"}
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
          </div>
        </div>
      }
      onClose={() =>
        setMPCState({ ...MPCState, processPipeElement: undefined })
      }
    />
  ) : null;
}
