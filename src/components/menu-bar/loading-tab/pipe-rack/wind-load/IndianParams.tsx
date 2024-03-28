import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { terrainCategories, windCodesIS } from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { TerrainCategory } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeLoadings } from "../../../../../store/main/actions";

export function IndianParams() {
  const loadings = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject)
      ?.loadings;
  });

  const dispatch = useDispatch();

  function handleChangeLoadings(field: string, value: any) {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          isWindCode: { ...loadings.isWindCode, [field]: value },
        })
      );
  }

  return (
    <div className={"d-flex f-grow bg-dark p-5"}>
      <div className="d-flex f-grow f-column bg-gray">
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Wind Code</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={windCodesIS}
              itemLabel={(item) => item}
              selected={loadings?.isWindCode.windCode}
              onSelect={(value) => handleChangeLoadings("windCode", value)}
              className="fill-select"
              //todo user entries
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Basic Wind Speed (Vb), (m/Sec)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={loadings?.isWindCode.basicWindSpeed}
              onChange={(value) => handleChangeLoadings("basicWindSpeed", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Risk Co-efficient (K1)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.riskCoefficient}
              onChange={(value) => handleChangeLoadings("riskCoefficient", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Terrain Category</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<TerrainCategory>
              itemLabel={(item) => item}
              items={terrainCategories}
              selected={loadings?.isWindCode.terrainCategory}
              onSelect={(value) => handleChangeLoadings("terrainCategory", value)}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Topography Factor (K3)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.topographicFactor}
              onChange={(value) => handleChangeLoadings("topographicFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-200">Importance Factor for Cyclonic region (K4)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.impFactorCyclonic}
              onChange={(value) => handleChangeLoadings("impFactorCyclonic", value)}
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
              value={loadings?.isWindCode.locationOfStructure}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleChangeLoadings("locationOfStructure", event.target.value)
              }
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Directionality Factor Kd</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.windDirectionalityFactor}
              onChange={(value) => handleChangeLoadings("windDirectionalityFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Area Averaging Factor Ka</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.areaAveragingFactor}
              onChange={(value) => handleChangeLoadings("areaAveragingFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Combination Factor Kc</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.isWindCode.combinationFactor}
              onChange={(value) => handleChangeLoadings("combinationFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Datum elevation</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={loadings?.isWindCode.datumElevation}
              onChange={(value) => handleChangeLoadings("datumElevation", value)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
