import React, { FunctionComponent, useState } from "react";
import { FormGroup, Button } from "@blueprintjs/core";
import TPostTab from "./TPostTab";
import CTTab from "./CTTab";
import FPostTab from "./FPostTab";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { PipeRack } from "../../../../../store/main/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { AdditionalLoads } from "../AdditionalLoads";
import { changeLoadings } from "../../../../../store/main/actions";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = {
  onClose: () => any;
};

const w220: React.CSSProperties = { width: 220 };

const DeadLoad: FunctionComponent<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("T-Post");

  const loadings = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject)
      ?.loadings;
  });

  const dispatch = useDispatch();

  function handleChangeLoadings(field: string, value: any) {
    loadings && dispatch(changeLoadings({ ...loadings, [field]: value }));
  }

  const models = useSelector((state: ApplicationState) => {
    return state.main.projects
      .find((project) => project.name === state.main.currentProject)
      ?.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
  });

  function getTab(tab: string, models: PipeRack[]) {
    switch (tab) {
      case "T-Post":
        return <TPostTab models={models} />;
      case "F-Post":
        return <FPostTab models={models} />;
      case "Christmas Tree":
        return <CTTab models={models} />;
      default:
        return null;
    }
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
                    <div className="label-light" style={w220}>
                      Structural Selfweight Factor
                    </div>
                    <FormGroup className="no-m">
                      <SimpleNumericInput
                        min={0}
                        isDecimal={true}
                        value={loadings?.SWF ?? 0}
                        disabled={!loadings}
                        onChange={(value) => handleChangeLoadings("SWF", value)}
                      />
                    </FormGroup>
                  </div>
                  <div className="d-flex f-ai-center">
                    <div className="label-light" style={w220}>
                      Platform Dead Load intensity
                    </div>
                    <FormGroup className="no-m">
                      <SimpleNumericInput
                        min={0}
                        value={loadings?.DLI}
                        disabled={!loadings}
                        onChange={(value) => handleChangeLoadings("DLI", value)}
                      />
                    </FormGroup>
                    <div className="label-light">
                      kg/m<sup>2</sup>
                    </div>
                  </div>
                </div>
                <div className="d-flex f-jc-between bg-dark always">
                  <Button
                    className={`f-grow c-light ${activeTab === "T-Post" ? "active" : ""}`}
                    onClick={() => setActiveTab("T-Post")}
                    text="T-Post"
                    outlined
                  />
                  <Button
                    className={`f-grow c-light ${activeTab === "F-Post" ? "active" : ""}`}
                    onClick={() => setActiveTab("F-Post")}
                    text="F-Post"
                    outlined
                  />
                  <Button
                    className={`f-grow c-light ${activeTab === "Christmas Tree" ? "active" : ""}`}
                    onClick={() => setActiveTab("Christmas Tree")}
                    text="Christmas Tree"
                    outlined
                  />
                </div>
              </div>
              <div className="d-flex f-grow f-column">
                <div className="d-flex f-ai-center">
                  <div className="label-light" style={w220}>
                    Fire Proofing material Density
                  </div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      min={0}
                      value={loadings?.FPd}
                      disabled={!loadings}
                      onChange={(value) => handleChangeLoadings("FPd", value)}
                    />
                  </FormGroup>
                  <div className="label-light">
                    kg/m<sup>3</sup>
                  </div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light" style={w220}>
                    Fire Proofing Thickness
                  </div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={loadings?.FPt}
                      disabled={!loadings}
                      onChange={(value) => handleChangeLoadings("FPt", value)}
                    />
                  </FormGroup>
                  <div className="label-light">mm</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light" style={w220}>
                    Fire Proofing up to height
                  </div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={loadings?.FPh}
                      disabled={!loadings}
                      onChange={(value) => handleChangeLoadings("FPh", value)}
                    />
                  </FormGroup>
                  <div className="label-light">m</div>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light" style={w220}>
                    Fire Proofing applicable to
                  </div>
                  <FormGroup className="no-m w-155">
                    <SimpleSelector<string>
                      items={["All elements", "Only Columns and Beams"]}
                      selected={loadings?.FPto}
                      disabled={!loadings}
                      onSelect={(value) => handleChangeLoadings("FPto", value)}
                      itemLabel={(item) => item}
                      className="fill-select"
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light" style={w220}>
                    Fire Proofing Depth Limit for Boxed Fire Proofing
                  </div>
                  <FormGroup className="no-m w-160">
                    <SimpleNumericInput
                      value={loadings?.FPdl}
                      disabled={!loadings}
                      onChange={(value) => handleChangeLoadings("FPdl", value)}
                    />
                  </FormGroup>
                  <div className="label-light">mm</div>
                </div>
              </div>
            </div>
          </div>
          {getTab(activeTab, models)}
          <div className="hr" />
          <AdditionalLoads models={models} load={"deadLoad"} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default DeadLoad;
