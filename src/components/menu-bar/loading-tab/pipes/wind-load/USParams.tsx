import React from "react";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { FormGroup } from "@blueprintjs/core";
import { exposures, windCodesUS } from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { TPipeWindLoad } from "../../../../../store/main/pipeTypes";

type Props = {
  data: TPipeWindLoad;
  onChange: (field: string, value: any) => any;
};

export function USParamsPP({ data, onChange }: Props) {
  function handleChangeData(field: string, value: any) {
    onChange("usWindCode", { ...data.usWindCode, [field]: value });
  }

  return (
    <div className="d-flex f-grow bg-dark p-5">
      <div className="d-flex f-grow f-column bg-gray">
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Code</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={windCodesUS}
              selected={data.usWindCode.windCode}
              onSelect={(value) => handleChangeData("windCode", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Basic Wind Speed (V) m/s</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.usWindCode.basicWindSpeed}
              isDecimal={true}
              onChange={(value) => handleChangeData("basicWindSpeed", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Exposure</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={exposures}
              selected={data.usWindCode.exposure}
              onSelect={(value) => handleChangeData("exposure", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Directionality Factor Kd</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.usWindCode.windDirectionalityFactor}
              onChange={(value) => handleChangeData("windDirectionalityFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Topography Details (Kzt)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.usWindCode.topographyDetails}
              isDecimal={true}
              onChange={(value) => handleChangeData("topographyDetails", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Importance Factor</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.usWindCode.importanceFactor}
              onChange={(value) => handleChangeData("importanceFactor", value)}
            />
          </FormGroup>
        </div>
      </div>

      <div className="d-flex f-grow f-column bg-gray" style={{ paddingRight: 20 }}>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-170">Flexible Structure</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={["Yes", "No"]}
              selected={data.usWindCode.flexibleStructure}
              onSelect={(value) => handleChangeData("flexibleStructure", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-170">Structural Category</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={[
                "I - Simplified Method",
                "II – Complete Analysis",
                "III - Flexible Structure",
              ]}
              selected={data.usWindCode.structuralCategory}
              onSelect={(value) => handleChangeData("structuralCategory", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-170">Cross Section (Shape)</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={[
                "Square (Wind normal to Face)",
                "Square (Wind along the Diagonal)",
                "Hexagonal or Octagonal",
                "Round (D> 20.25 ft)",
                "Round (D<= 20.25ft)",
              ]}
              selected={data.usWindCode.crossSectionShape}
              onSelect={(value) => handleChangeData("crossSectionShape", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-170">Type of Structure</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={["Moderately smooth", "Routh", "Very rough"]}
              selected={data.usWindCode.structureType}
              onSelect={(value) => handleChangeData("structureType", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Shape Factor</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={data.usWindCode.shapeFactor}
              onChange={(value) => handleChangeData("shapeFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Datum Elevation</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={data.usWindCode.datumElevation}
              onChange={(value) => handleChangeData("datumElevation", value)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Limiting Size</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={data.usWindCode.limitingSize}
              onChange={(value) => handleChangeData("limitingSize", value)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
