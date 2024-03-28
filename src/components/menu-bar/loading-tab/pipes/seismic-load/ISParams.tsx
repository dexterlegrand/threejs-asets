import React, { useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import {
  dampingRatios,
  soilFoundationConditions,
  soilTypes,
  zoneFactors,
} from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { TPipeSeismicLoads, TPipeWindLoad } from "../../../../../store/main/pipeTypes";

type Props = {
  data: TPipeSeismicLoads;
  windData?: TPipeWindLoad;
  onChange: (field: string, value: any) => any;
};

export function ISParamsPP({ data, windData, onChange }: Props) {
  const seismicData = useMemo(() => {
    return data.isSeismicCode;
  }, [data]);

  function handleChangeData(field: string, value: any) {
    onChange("isSeismicCode", { ...seismicData, [field]: value });
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
                selected={seismicData.zoneFactor}
                onSelect={(value) => handleChangeData("zoneFactor", value)}
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
                selected={seismicData.dampingRatio}
                onSelect={(value) => handleChangeData("dampingRatio", value)}
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
                selected={seismicData.soilType}
                onSelect={(value) => handleChangeData("soilType", value)}
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
                selected={seismicData.soilFoundationCondition}
                onSelect={(value) => handleChangeData("soilFoundationCondition", value)}
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
                value={seismicData.responseReductionFactor}
                onChange={(value) => handleChangeData("responseReductionFactor", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-200">Importance Factor</div>
            <FormGroup className="no-m">
              <SimpleNumericInput
                value={seismicData.importanceFactor}
                isDecimal={true}
                onChange={(value) => handleChangeData("importanceFactor", value)}
              />
            </FormGroup>
          </div>
        </div>

        <div className={"d-flex f-grow f-column"} style={{ marginRight: 10 }}>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-130">Time Period</div>
            <FormGroup className="no-m">
              <SimpleSelector<string>
                items={["1/Naturalfreq", "0.85ℎ^0.75"]}
                selected={seismicData.timePeriod}
                onSelect={(value) => handleChangeData("timePeriod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-130">Datum Elevation</div>
            <FormGroup className="no-m">{windData?.isWindCode.datumElevation ?? 0}m</FormGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
