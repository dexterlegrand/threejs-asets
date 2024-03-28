import React, { useMemo } from "react";
import { TSiteClass, TCategory } from "../../../../../store/main/pipeTypes";
import { FormGroup, InputGroup, Button } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { dampingRatios } from "../../../../../store/main/constants";
import { SeismicLoadsUI } from "../../../../../store/ui/types";

type Props = {
  data: SeismicLoadsUI;
  onChange: (field: string, value: any) => any;
};

export function USParamsFS({ data, onChange }: Props) {
  const seismicData = useMemo(() => {
    return data.usSeismicCode;
  }, [data]);

  function handleChangeData(field: string, value: any) {
    onChange("usSeismicCode", { ...seismicData, [field]: value });
  }

  return (
    <div className="d-flex f-grow bg-dark p-5">
      <div className="d-flex f-grow bg-gray" style={{ paddingRight: 10 }}>
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-30">
              S<sub>s</sub>
            </div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.S_S}
                onChange={(val) => handleChangeData("S_S", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-30">
              S<sub>1</sub>
            </div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.S_1}
                onChange={(val) => handleChangeData("S_1", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-30">
              T<sub>L</sub>
            </div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.T_L}
                onChange={(val) => handleChangeData("T_L", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-30">R</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.R}
                onChange={(val) => handleChangeData("R", val)}
              />
            </FormGroup>
          </div>
          {/*NEXT INPUT*/}
        </div>
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Time Period, T</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.timePeriod}
                onChange={(val) => handleChangeData("timePeriod", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Site Class</div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<TSiteClass>
                items={["A", "B", "C", "D", "E", "F"]}
                itemLabel={(val) => val}
                selected={seismicData.siteClass}
                onSelect={(val) => handleChangeData("siteClass", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Category</div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<TCategory>
                items={["I", "II", "III", "IV"]}
                itemLabel={(val) => val}
                selected={seismicData.category}
                onSelect={(val) => handleChangeData("category", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-120">Damping, %</div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector
                items={dampingRatios}
                itemLabel={(val) => `${val}`}
                selected={seismicData.dampingRatio}
                onSelect={(val) => handleChangeData("dampingRatio", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          {/*NEXT INPUT*/}
        </div>
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Importance Factor</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.importanceFactor}
                onChange={(value) => handleChangeData("importanceFactor", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Structure height, m</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={seismicData.structureHeight}
                onChange={(value) => handleChangeData("structureHeight", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Structure Type</div>
            <FormGroup className="no-m f-grow">
              <InputGroup
                fill
                small
                value={seismicData.structureType}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  handleChangeData("structureType", event.currentTarget.value)
                }
              />
            </FormGroup>
          </div>
          {/*NEXT INPUT*/}
        </div>
        {/*NEXT COLUMN*/}
      </div>
    </div>
  );
}
