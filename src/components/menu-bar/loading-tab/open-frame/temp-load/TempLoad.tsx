import React, { useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { CustomDlg } from "../../../../common/CustomDlg";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction } from "../../../../../store/ui/actions";
import { getCurrentUI } from "../../../../3d-models/utils";

type Props = { onClose: () => any };

export function TempLoadOF({ onClose }: Props) {
  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.tempLoadUI;
  }, [openFrameUI]);

  const dispatch = useDispatch();

  function handleChangeData(field: "maxTemp" | "minTemp", value: number) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          tempLoadUI: { ...data, [field]: value },
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Temp. Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column bg-dark p-5">
          <div className="d-flex f-grow f-column bg-gray">
            <div className="label-light">
              Design Temperature in <sup>o</sup>C
            </div>
            <div className="d-flex f-ai-center p-5">
              <div className="label-light w-50">Min.</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  max={data?.maxTemp}
                  isDecimal={true}
                  value={data?.minTemp}
                  onChange={(value) => handleChangeData("minTemp", value)}
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center p-5">
              <div className="label-light w-50">Max.</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={data?.minTemp}
                  isDecimal={true}
                  value={data?.maxTemp}
                  onChange={(value) => handleChangeData("maxTemp", value)}
                />
              </FormGroup>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
