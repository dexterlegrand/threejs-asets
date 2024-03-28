import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeLoadings } from "../../../../../store/main/actions";
import { FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import {
  dampingRatios,
  soilFoundationConditions,
  soilTypes,
  zoneFactors,
} from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";

export function ISParams() {
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
          isSeismicCode: { ...loadings.isSeismicCode, [field]: value },
        })
      );
  }

  return (
    <div className="d-flex f-grow bg-dark p-5">
      <div className="d-flex f-grow bg-gray">
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Zone</div>
            <FormGroup className="no-m w-150">
              <SimpleSelector
                items={zoneFactors}
                selected={loadings?.isSeismicCode?.zoneFactor}
                onSelect={(value) => handleChangeLoadings("zoneFactor", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Damping Ratio</div>
            <FormGroup className="no-m w-150">
              <SimpleSelector
                items={dampingRatios}
                selected={loadings?.isSeismicCode?.dampingRatio}
                onSelect={(value) => handleChangeLoadings("dampingRatio", value)}
                itemLabel={(item) => `${item}%`}
                className="fill-select"
              />
            </FormGroup>
          </div>
        </div>

        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-200">Soil Type</div>
            <FormGroup className="no-m w-150">
              <SimpleSelector
                items={soilTypes}
                selected={loadings?.isSeismicCode?.soilType}
                onSelect={(value) => handleChangeLoadings("soilType", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-200">Soil Foundation Condition</div>
            <FormGroup className="no-m w-150">
              <SimpleSelector<string>
                items={soilFoundationConditions}
                selected={loadings?.isSeismicCode?.soilFoundationCondition}
                onSelect={(value) => handleChangeLoadings("soilFoundationCondition", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
        </div>

        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-200">Response Reduction Factor</div>
            <FormGroup className="no-m">
              <SimpleNumericInput
                value={loadings?.isSeismicCode?.responseReductionFactor}
                onChange={(value) => handleChangeLoadings("responseReductionFactor", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-200">Importance Factor</div>
            <FormGroup className="no-m">
              <SimpleNumericInput
                value={loadings?.isSeismicCode?.importanceFactor}
                isDecimal={true}
                onChange={(value) => handleChangeLoadings("importanceFactor", value)}
              />
            </FormGroup>
          </div>
        </div>

        <div className={"d-flex f-grow f-column"} style={{ marginRight: 10 }}>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">Time Period</div>
            <FormGroup className="no-m">
              <SimpleSelector<string>
                items={["1/Naturalfreq", "0.85ℎ^0.75"]}
                selected={loadings?.isSeismicCode?.timePeriod}
                onSelect={(value) => handleChangeLoadings("timePeriod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
