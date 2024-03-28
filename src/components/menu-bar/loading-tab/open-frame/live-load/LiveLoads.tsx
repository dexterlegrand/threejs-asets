import React, { useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../../common/CustomDlg";
import { ApplicationState } from "../../../../../store";
import { getElementByName, getCurrentUI } from "../../../../3d-models/utils";
import { getOFModels } from "../../../../3d-models/openFrame";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { AdditionalLoadsOF } from "../AdditionalLoads";

type Props = { onClose: () => any };

export function LiveLoadsOF({ onClose }: Props) {
  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.liveLoadUI;
  }, [openFrameUI]);

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          liveLoadUI: { ...data, [field]: value },
        },
      })
    );
  }

  function showImportErrorMsg(loads: string, msg: string) {
    dispatch(addEventAction(`Live Load (Import of ${loads}): ${msg}`, "danger"));
  }

  return (
    <CustomDlg
      title={"Live Load"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-grow bg-dark p-5"}>
            <div className="d-flex f-grow f-ai-center bg-gray">
              <div className="label-light">Platform Live Load intensity</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={0}
                  value={data?.intensity}
                  onChange={(value) => handleChangeData("intensity", value)}
                />
              </FormGroup>
              <div className="label-light">
                kg/m<sup>2</sup>
              </div>
            </div>
            <div className="d-flex f-grow f-ai-center bg-gray">
              <div className="label-light">Stair Live Load intensity</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={0}
                  value={data?.stairIntensity}
                  onChange={(value) => handleChangeData("stairIntensity", value)}
                />
              </FormGroup>
              <div className="label-light">
                kg/m<sup>2</sup>
              </div>
            </div>
          </div>
          <div className="hr" />
          {data && (
            <AdditionalLoadsOF
              data={data}
              models={models}
              load={"liveLoadUI"}
              onChange={handleChangeData}
              onImportError={(msg) => showImportErrorMsg("Additional Loads", msg)}
            />
          )}
        </div>
      }
      onClose={onClose}
    />
  );
}
