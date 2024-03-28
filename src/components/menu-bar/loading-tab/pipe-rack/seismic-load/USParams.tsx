import React from "react";
import { TSiteClass, TCategory } from "../../../../../store/main/pipeTypes";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { dampingRatios } from "../../../../../store/main/constants";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { getCurrentProject } from "../../../../3d-models/utils";
import { changeLoadings } from "../../../../../store/main/actions";

export function USParamsPR() {
  const loadings = useSelector((state: ApplicationState) => {
    return getCurrentProject(state)?.loadings;
  });

  const dispatch = useDispatch();

  function handleChangeData(field: string, value: any) {
    if (!loadings) return;
    dispatch(
      changeLoadings({
        ...loadings,
        usSeismicCode: { ...loadings.usSeismicCode, [field]: value },
      })
    );
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
                value={loadings?.usSeismicCode.S_S}
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
                value={loadings?.usSeismicCode.S_1}
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
                value={loadings?.usSeismicCode.T_L}
                onChange={(val) => handleChangeData("T_L", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-30">R</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={loadings?.usSeismicCode.R}
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
                value={loadings?.usSeismicCode.timePeriod}
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
                selected={loadings?.usSeismicCode.siteClass}
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
                selected={loadings?.usSeismicCode.category}
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
                selected={loadings?.usSeismicCode.dampingRatio}
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
                value={loadings?.usSeismicCode.importanceFactor}
                onChange={(value) => handleChangeData("importanceFactor", value)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Structure height, m</div>
            <FormGroup className="no-m f-grow">
              <SimpleNumericInput
                isDecimal={true}
                value={loadings?.usSeismicCode.structureHeight}
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
                value={loadings?.usSeismicCode.structureType}
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
