import React, { FunctionComponent, useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { CustomDlg } from "../../../../common/CustomDlg";
import { ApplicationState } from "../../../../../store";
import { getElementByName } from "../../../../3d-models/utils";
import { changeLoadings } from "../../../../../store/main/actions";

type Props = { onClose: () => any };

const TempLoad: FunctionComponent<Props> = ({ onClose }) => {
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const loadings = useMemo(() => {
    return project?.loadings;
  }, [project]);

  function handleChangeTemps(field: "maxTemp" | "minTemp", value: number) {
    loadings && dispatch(changeLoadings({ ...loadings, [field]: value }));
  }

  return (
    <CustomDlg
      title={"Temp. Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column bg-dark p-5">
          <div className="d-flex f-grow f-column bg-gray">
            <div className="label-light">
              Design Temperature in <sup>o</sup>C
            </div>
            <div className="d-flex f-ai-center p-5">
              <div className="label-light w-50">Min.</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  max={loadings?.maxTemp}
                  isDecimal={true}
                  value={loadings?.minTemp}
                  onChange={(value) => handleChangeTemps("minTemp", value)}
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center p-5">
              <div className="label-light w-50">Max.</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  min={loadings?.minTemp}
                  isDecimal={true}
                  value={loadings?.maxTemp}
                  onChange={(value) => handleChangeTemps("maxTemp", value)}
                />
              </FormGroup>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
};

export default TempLoad;
