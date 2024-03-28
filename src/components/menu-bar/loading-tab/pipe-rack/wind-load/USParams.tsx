import React from "react";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { FormGroup } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeLoadings } from "../../../../../store/main/actions";
import { exposures, windCodesUS } from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";

export function USParams() {
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
          usWindCode: { ...loadings.usWindCode, [field]: value },
        })
      );
  }

  return (
    <div className="d-flex f-grow bg-dark p-5">
      <div className="d-flex f-grow f-column bg-gray">
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Code</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={windCodesUS}
              selected={loadings?.usWindCode.windCode}
              onSelect={(value) => handleChangeLoadings("windCode", value)}
              itemLabel={(item) => item}
              className="fill-select"
              //todo user entries
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Basic Wind Speed (V) m/s</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.usWindCode.basicWindSpeed}
              isDecimal={true}
              onChange={(value) => handleChangeLoadings("basicWindSpeed", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Exposure</div>
          <FormGroup className="no-m w-155">
            <SimpleSelector<string>
              items={exposures}
              selected={loadings?.usWindCode.exposure}
              onSelect={(value) => handleChangeLoadings("exposure", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Wind Directionality Factor Kd</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.usWindCode.windDirectionalityFactor}
              onChange={(value) => handleChangeLoadings("windDirectionalityFactor", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Topography Details (Kzt)</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.usWindCode.topographyDetails}
              isDecimal={true}
              onChange={(value) => handleChangeLoadings("topographyDetails", value)}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-220">Importance Factor</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              value={loadings?.usWindCode.importanceFactor}
              onChange={(value) => handleChangeLoadings("importanceFactor", value)}
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
              selected={loadings?.usWindCode.flexibleStructure}
              onSelect={(value) => handleChangeLoadings("flexibleStructure", value)}
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
              selected={loadings?.usWindCode.structuralCategory}
              onSelect={(value) => handleChangeLoadings("structuralCategory", value)}
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
              selected={loadings?.usWindCode.crossSectionShape}
              onSelect={(value) => handleChangeLoadings("crossSectionShape", value)}
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
              selected={loadings?.usWindCode.structureType}
              onSelect={(value) => handleChangeLoadings("structureType", value)}
              itemLabel={(item) => item}
              className="fill-select"
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center">
          <div className="label-light t-end w-170">Datum elevation</div>
          <FormGroup className="no-m w-155">
            <SimpleNumericInput
              min={0}
              isDecimal={true}
              value={loadings?.usWindCode.datumElevation}
              onChange={(value) => handleChangeLoadings("datumElevation", value)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
