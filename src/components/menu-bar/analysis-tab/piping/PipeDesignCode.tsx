import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../common/CustomDlg";
import { ApplicationState } from "../../../../store";
import { FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { changeProjectAction } from "../../../../store/main/actions";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { pipeDesignCodes } from "../../../../store/data/constants";

type Props = {
  onClose: () => any;
};

export function PipeDesignCode({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((project) => project.name === state.main.currentProject)
  );

  const dispatch = useDispatch();

  function handleChange(field: string, value: any) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeDesignCode: {
          ...project.pipeDesignCode,
          [field]: value,
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Design Code & Parameters"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always" style={{ paddingRight: 10 }}>
            <div className="label-light t-end w-120">Design Code</div>
          </div>
          <div className={"hr"} />
          <div className="d-flex f-grow bg-dark p-5">
            <div className="d-flex f-grow bg-gray">
              <div className="d-flex f-grow f-column" style={{ paddingRight: 10 }}>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-130">Discretization length limit (m)</div>
                  <FormGroup className="no-m f-grow">
                    <SimpleNumericInput
                      min={0.001}
                      isDecimal={true}
                      value={project?.pipeDesignCode?.discretizationLengthLimit}
                      onChange={(value) => handleChange("discretizationLengthLimit", value)}
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-130">Design Code</div>
                  <FormGroup className="no-m f-grow">
                    <SimpleSelector<string>
                      items={pipeDesignCodes}
                      selected={project?.pipeDesignCode?.designCode}
                      itemLabel={(item) => item}
                      onSelect={(value) => handleChange("designCode", value)}
                      className="fill-select"
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-130">Deflection Limit</div>
                  <FormGroup className="no-m f-grow">
                    <SimpleNumericInput
                      min={0}
                      value={project?.pipeDesignCode?.deflectionLimit}
                      onChange={(value) => handleChange("deflectionLimit", value)}
                    />
                  </FormGroup>
                  <div className="label-light w-50">mm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
