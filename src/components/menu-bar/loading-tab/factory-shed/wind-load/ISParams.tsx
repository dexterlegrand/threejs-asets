import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { terrainCategories, windCodesIS } from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { TerrainCategory } from "../../../../../store/main/types";
import { WindLoadUI } from "../../../../../store/ui/types";

type Props = {
  data: WindLoadUI;
  onChange: (field: string, value: any) => any;
};

export function ISParamsFS({ data, onChange }: Props) {
  function handleChangeData(field: string, value: any) {
    onChange("isWindCode", {
      ...data.isWindCode,
      [field]: value,
    });
  }

  return (
    <div className={"d-flex f-grow bg-dark p-5"}>
      <div className="d-flex f-grow f-column bg-gray">
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Wind Code</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={windCodesIS}
              selected={data.isWindCode.windCode}
              onSelect={(value) => handleChangeData("windCode", value)}
              itemLabel={(item) => item}
              className="fill-select"
              //TODO: user entries
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Basic Wind Speed (Vb), (m/Sec)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={data.isWindCode.basicWindSpeed}
              onChange={(value) => handleChangeData("basicWindSpeed", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Risk Co-efficient (K1)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.riskCoefficient}
              onChange={(value) => handleChangeData("riskCoefficient", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Terrain Category</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<TerrainCategory>
              items={terrainCategories}
              selected={data.isWindCode.terrainCategory}
              onSelect={(value) => handleChangeData("terrainCategory", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Topography Factor (K3)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.topographicFactor}
              onChange={(value) => handleChangeData("topographicFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Importance Factor for Cyclonic region (K4)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.impFactorCyclonic}
              onChange={(value) => handleChangeData("impFactorCyclonic", value)}
            />
          </FormGroup>
        </div>
      </div>
      <div className="d-flex f-grow f-column bg-gray f-ai-end" style={{ paddingRight: 20 }}>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Structure Location</div>
          <FormGroup className="no-m">
            <InputGroup
              fill
              small
              value={data.isWindCode.locationOfStructure}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleChangeData("locationOfStructure", event.target.value)
              }
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Directionality Factor Kd</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.windDirectionalityFactor}
              onChange={(value) => handleChangeData("windDirectionalityFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Area Averaging Factor Ka</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.areaAveragingFactor}
              onChange={(value) => handleChangeData("areaAveragingFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Combination Factor Kc</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={data.isWindCode.combinationFactor}
              onChange={(value) => handleChangeData("combinationFactor", value)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
