import React, { useMemo } from "react";
import { FormGroup, Button } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CustomDlg } from "../../../../common/CustomDlg";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { AdditionalLoadsFS } from "../AdditionalLoads";
import { TPostTabFS } from "./TPostTab";
import { FPostTabFS } from "./FPostTab";
import { CTTabFS } from "./CTTab";
import { getFSModels } from "../../../../3d-models/openFrame";
import { getElementByName, getCurrentUI } from "../../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function DeadLoadsFS({ onClose }: Props) {
  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.deadLoadUI;
  }, [openFrameUI]);

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          deadLoadUI: { ...data, [field]: value },
        },
      })
    );
  }

  function getTab(tab: string, models: TOpenFrame[]) {
    if (!openFrameUI || !data) return;
    switch (tab) {
      case "TP":
        return (
          <TPostTabFS
            data={data}
            models={models}
            onChange={handleChangeData}
            onImportError={showImportErrorMsg}
          />
        );
      case "FP":
        return (
          <FPostTabFS
            data={data}
            models={models}
            onChange={handleChangeData}
            onImportError={showImportErrorMsg}
          />
        );
      case "CT":
        return (
          <CTTabFS
            data={data}
            models={models}
            onChange={handleChangeData}
            onImportError={showImportErrorMsg}
          />
        );
      default:
        return null;
    }
  }

  function showImportErrorMsg(loads: string, msg: string) {
    dispatch(addEventAction(`Dead Load (Import of ${loads}): ${msg}`, "danger"));
  }

  return (
    <CustomDlg
      title={"Dead Load"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-grow bg-dark p-5"}>
            <div className="d-flex f-grow bg-gray">
              <div className="d-flex f-grow f-column">
                <div className="d-flex f-grow f-column">
                  <div className="d-flex f-ai-center">
                    <div className="label-light w-220">Structural Selfweight Factor</div>
                    <FormGroup className="no-m">
                      <SimpleNumericInput
                        min={0}
                        isDecimal={true}
                        value={data?.SWF}
                        onChange={(value) => handleChangeData("SWF", value)}
                      />
                    </FormGroup>
                  </div>
                  <div className="d-flex f-ai-center">
                    <div className="label-light w-220">Platform Dead Load intensity</div>
                    <FormGroup className="no-m">
                      <SimpleNumericInput
                        min={0}
                        value={data?.DLI}
                        onChange={(value) => handleChangeData("DLI", value)}
                      />
                    </FormGroup>
                    <div className="label-light">
                      kg/m<sup>2</sup>
                    </div>
                  </div>
                  <div className="d-flex f-ai-center">
                    <div className="label-light w-220">Stair Dead Load intensity</div>
                    <FormGroup className="no-m">
                      <SimpleNumericInput
                        min={0}
                        value={data?.SDLI}
                        onChange={(value) => handleChangeData("SDLI", value)}
                      />
                    </FormGroup>
                    <div className="label-light">
                      kg/m<sup>2</sup>
                    </div>
                  </div>
                </div>
                <div className="d-flex f-jc-between bg-dark always">
                  <Button
                    className={`f-grow c-light ${data?.accessoriesTab === "TP" ? "active" : ""}`}
                    onClick={() => handleChangeData("accessoriesTab", "TP")}
                    text="T-Post"
                    outlined
                  />
                  <Button
                    className={`f-grow c-light ${data?.accessoriesTab === "FP" ? "active" : ""}`}
                    onClick={() => handleChangeData("accessoriesTab", "FP")}
                    text="F-Post"
                    outlined
                  />
                  <Button
                    className={`f-grow c-light ${data?.accessoriesTab === "CT" ? "active" : ""}`}
                    onClick={() => handleChangeData("accessoriesTab", "CT")}
                    text="Christmas Tree"
                    outlined
                  />
                </div>
              </div>
              <div className="d-flex f-grow f-column">
                <div className="d-flex f-ai-center">
                  <div className="label-light w-220">Fire Proofing material Density</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      min={0}
                      value={data?.FPd}
                      onChange={(value) => handleChangeData("FPd", value)}
                    />
                  </FormGroup>
                  <div className="label-light">
                    kg/m<sup>3</sup>
                  </div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light w-220">Fire Proofing Thickness</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={data?.FPt}
                      onChange={(value) => handleChangeData("FPt", value)}
                    />
                  </FormGroup>
                  <div className="label-light">mm</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light w-220">Fire Proofing up to height</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={data?.FPh}
                      onChange={(value) => handleChangeData("FPh", value)}
                    />
                  </FormGroup>
                  <div className="label-light">m</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light w-220">Fire Proofing applicable to</div>
                  <FormGroup className="no-m w-155">
                    <SimpleSelector<string>
                      items={["All elements", "Only Columns and Beams"]}
                      selected={data?.FPto}
                      onSelect={(value) => handleChangeData("FPto", value)}
                      itemLabel={(item) => item}
                      className="fill-select"
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light w-220">
                    Fire Proofing Depth Limit for Boxed Fire Proofing
                  </div>
                  <FormGroup className="no-m w-160">
                    <SimpleNumericInput
                      value={data?.FPdl}
                      onChange={(value) => handleChangeData("FPdl", value)}
                    />
                  </FormGroup>
                  <div className="label-light">mm</div>
                </div>
              </div>
            </div>
          </div>
          {data && getTab(data.accessoriesTab, models)}
          <div className="hr" />
          {data && (
            <AdditionalLoadsFS
              data={data}
              models={models}
              load={"deadLoadUI"}
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
