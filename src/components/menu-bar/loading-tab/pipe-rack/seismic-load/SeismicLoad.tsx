import React, { FunctionComponent, useMemo, useState, useEffect } from "react";
import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  LoadingAsPerCode,
  PipeRack,
  TSeismicLoad,
  TSpectralPoint,
} from "../../../../../store/main/types";
import {
  loadingAsPerCodes,
  initLoadings,
  siteClasses1,
  siteClassesA,
  dampingRatioData,
  soilTypeData,
} from "../../../../../store/main/constants";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { changeLoadings, getAndMapSeismicLoads } from "../../../../../store/main/actions";
import { MultiSelector } from "../../../../common/MultiSelector";
import { CustomDlg } from "../../../../common/CustomDlg";
import { NumericCell } from "../../../../common/NumericCell";
import { Paginator } from "../../../../common/Paginator";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { Line } from "react-chartjs-2";
import { getNextId, getCurrentUI, checkRange, roundM } from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { ISParams } from "./ISParams";
import { USParamsPR } from "./USParams";
import { TSiteClass } from "../../../../../store/main/pipeTypes";

type Props = { onClose: () => any };

const SeismicLoad: FunctionComponent<Props> = ({ onClose }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<TSeismicLoad[]>([]);

  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const project = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject);
  });
  const inProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.seismic
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return project?.models.filter((model) => model.type === "Pipe Rack") as PipeRack[];
  }, [project]);

  const loadings = useMemo(() => {
    return project?.loadings;
  }, [project]);

  const fRows = useMemo(() => {
    if (!loadings || !loadings.seismicLoads) return [];
    return loadings.seismicLoads.filter((item) => selected.includes(item.prNo));
  }, [loadings, selected]);

  const points = useMemo(() => {
    const points: TSpectralPoint[] =
      loadings?.spectralsPoints?.filter(
        (item) => item.timePeriod !== undefined && item.acceleration !== undefined
      ) ?? [];
    return points.sort((a, b) => a.timePeriod - b.timePeriod);
  }, [loadings?.spectralsPoints]);

  useEffect(() => {
    if (!project) return;
    if (
      project.loadings.spectralMode &&
      project.loadings.spectralsPoints &&
      project.loadings.seismicAnalysisMethod
    )
      return;
    const spectralMode = project.loadings.spectralMode ?? initLoadings.spectralMode;
    const spectralsPoints = project.loadings.spectralsPoints ?? initLoadings.spectralsPoints;
    const seismicAnalysisMethod =
      project.loadings.seismicAnalysisMethod ?? initLoadings.seismicAnalysisMethod;
    dispatch(
      changeLoadings({
        ...project.loadings,
        spectralMode,
        spectralsPoints,
        seismicAnalysisMethod,
      })
    );
  }, [project]);

  useEffect(() => {
    setSelected([models[0]?.name]);
  }, [models]);

  function handleChangeField(field: string, value: any) {
    if (!loadings) return;
    if (field === "spectralMode" && value === "Code") {
      dispatch(
        changeLoadings({
          ...loadings,
          [field]: value,
          spectralsPoints: handleCodeSpectralPoints(),
        })
      );
      return;
    } else if (field === "spectralsPoints" && loadings.spectralMode === "Code") {
      dispatch(changeLoadings({ ...loadings, [field]: value, spectralMode: "Manual" }));
      return;
    }
    dispatch(changeLoadings({ ...loadings, [field]: value }));
  }

  function handleCodeSpectralPoints() {
    if (!loadings) return [];
    const points: TSpectralPoint[] = [];
    if (loadings.seismicLoadingAsPerCode === "IS Code") {
      // @ts-ignore
      const dmf = dampingRatioData[loadings.isSeismicCode.dampingRatio];
      // @ts-ignore
      const soilType = soilTypeData[loadings.isSeismicCode.soilType];
      let tp = 0;
      while (tp <= 4) {
        let acceleration = 0;
        if (tp < 0.2) {
          acceleration = roundM((1 + 15 * tp) * dmf);
        } else if (tp < 0.5) {
          acceleration = roundM(2.5 * dmf);
        } else if (tp < 0.7) {
          if (soilType === 1) {
            acceleration = roundM((1 / tp) * dmf);
          } else if (soilType === 2) {
            acceleration = roundM((1.36 / tp) * dmf);
          } else if (soilType === 3) {
            acceleration = roundM(2.5 * dmf);
          }
        } else {
          if (soilType === 1) {
            acceleration = roundM((1 / tp) * dmf);
          } else if (soilType === 2) {
            acceleration = roundM((1.36 / tp) * dmf);
          } else if (soilType === 3) {
            acceleration = roundM((1.67 / tp) * dmf);
          }
        }
        points.push({
          id: points.length,
          selected: false,
          timePeriod: tp,
          acceleration,
        });
        tp = Math.round((tp + 0.1) * 10) / 10;
      }
    } else if (loadings.seismicLoadingAsPerCode === "US Code") {
      const coef = 9.81;
      const T_L = loadings.usSeismicCode.T_L;
      const S_S = loadings.usSeismicCode.S_S;
      const S_1 = loadings.usSeismicCode.S_1;
      const F_A = getF_A(loadings.usSeismicCode.siteClass, S_S);
      const F_V = getF_V(loadings.usSeismicCode.siteClass, S_1);
      const S_MS = F_A * S_S;
      const S_M1 = F_V * S_1;
      const S_DS = (2 / 3) * S_MS;
      const S_D1 = (2 / 3) * S_M1;
      const T_0 = 0.2 * S_DS;
      const T_S = S_DS ? S_D1 / S_DS : 0;
      let tp = 0;
      while (tp <= 4) {
        let acceleration = 0;
        if (tp < T_0) {
          acceleration = coef * (S_DS * (0.4 + (T_0 ? (0.6 * tp) / T_0 : 0)));
        } else if (tp >= T_0 && tp <= T_S) {
          acceleration = coef * S_DS;
        } else if (tp > T_S && tp <= T_L) {
          acceleration = tp ? coef * (S_D1 / tp) : 0;
        } else if (tp > T_L) {
          acceleration = tp ? coef * ((S_D1 * T_L) / Math.pow(tp, 2)) : 0;
        }
        points.push({
          id: points.length,
          selected: false,
          timePeriod: tp,
          acceleration: roundM(acceleration),
        });
        tp = Math.round((tp + 0.1) * 10) / 10;
      }
    }
    return points;
  }

  function getF_A(siteClass: TSiteClass, S_S: number) {
    const numbers = siteClassesA[siteClass];
    if (S_S <= 0.25) {
      return numbers[0.25];
    } else if (S_S >= 1.25) {
      return numbers[1.25];
    } else {
      const keys = Object.keys(numbers)
        .map((k) => +k)
        .sort((a, b) => a - b);
      for (let i = 1, len = keys.length; i < len; i++) {
        if (S_S === keys[i]) return numbers[keys[i]];
        if (checkRange(S_S, keys[i - 1], keys[i])) {
          const from = numbers[keys[i - 1]];
          const to = numbers[keys[i]];
          return (from + to) / 2;
        }
      }
    }
    return 0;
  }

  function getF_V(siteClass: TSiteClass, S_1: number) {
    const numbers = siteClasses1[siteClass];
    if (S_1 <= 0.1) {
      return numbers[0.1];
    } else if (S_1 >= 0.5) {
      return numbers[0.5];
    } else {
      const keys = Object.keys(numbers)
        .map((k) => +k)
        .sort((a, b) => a - b);
      for (let i = 1, len = keys.length; i < len; i++) {
        if (S_1 === keys[i]) return numbers[keys[i]];
        if (checkRange(S_1, keys[i - 1], keys[i])) {
          const from = numbers[keys[i - 1]];
          const to = numbers[keys[i]];
          return (from + to) / 2;
        }
      }
    }
    return 0;
  }

  function handleGenerate() {
    if (!project) return;
    getAndMapSeismicLoads(dispatch, models, scene, project);
  }

  function handleChangePoint(old: TSpectralPoint, field: string, value: any) {
    if (!loadings) return;
    const changed = { ...old, [field]: value };
    if (
      field === "timePeriod" &&
      loadings.spectralsPoints?.some(
        (item) => item.timePeriod !== undefined && item.timePeriod === value
      )
    ) {
      dispatch(
        addEventAction("Seismic Loads: You already have a point with the same period!", "danger")
      );
      return;
    }
    handleChangeField(
      "spectralsPoints",
      loadings.spectralsPoints?.map((item) => (item.id === changed.id ? changed : item)) ?? []
    );
  }

  function handleAdd() {
    if (!loadings) return;
    handleChangeField("spectralsPoints", [
      ...(loadings.spectralsPoints ?? []),
      {
        id: getNextId(loadings.spectralsPoints ?? []),
        selected: false,
      },
    ]);
  }

  function handleDelete() {
    if (!loadings) return;
    handleChangeField(
      "spectralsPoints",
      loadings.spectralsPoints?.filter((item) => !item.selected) ?? []
    );
  }

  function handleExport() {}

  function handleImport() {}

  function getPoint(point: TSpectralPoint) {
    return (
      <tr key={point.id}>
        <CheckBoxCell
          key={point.id}
          value={point.selected}
          onChange={(value) => handleChangePoint(point, "selected", value)}
        />
        <NumericCell
          isDecimal={true}
          value={point.timePeriod}
          onChange={(value) => handleChangePoint(point, "timePeriod", value)}
          className={"w-50p"}
        />
        <NumericCell
          isDecimal={true}
          value={point.acceleration}
          onChange={(value) => handleChangePoint(point, "acceleration", value)}
          className={"w-50p"}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Seismic Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className={"d-flex f-ai-center bg-dark always"}>
            <div className="label-light t-end w-180">Seismic Loading as per</div>
            <FormGroup className="no-m w-150" style={{ marginRight: 50 }}>
              <SimpleSelector<LoadingAsPerCode>
                items={loadingAsPerCodes}
                selected={loadings?.seismicLoadingAsPerCode}
                onSelect={(value) => handleChangeField("seismicLoadingAsPerCode", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>

            <div className="label-light t-end w-180">Seismic Analysis Method:</div>
            <FormGroup className="no-m w-200">
              <SimpleSelector<"Equivalent Static" | "Response Spectrum">
                items={["Equivalent Static", "Response Spectrum"]}
                selected={loadings?.seismicAnalysisMethod}
                onSelect={(value) => handleChangeField("seismicAnalysisMethod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>

            <div className="label-light t-end w-180">Modal Combination Method:</div>
            <FormGroup className="no-m w-200">
              <SimpleSelector<"ABS-SUM" | "SRSS" | "CQC">
                items={["ABS-SUM", "SRSS", "CQC"]}
                selected={loadings?.modalCombinationMethod}
                onSelect={(value) => handleChangeField("modalCombinationMethod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {loadings?.seismicLoadingAsPerCode === "IS Code" && <ISParams />}
          {loadings?.seismicLoadingAsPerCode === "US Code" && <USParamsPR />}
          {loadings?.seismicLoadingAsPerCode === "EU Code" && <></>}
          <div className={"hr"} />
          {loadings?.seismicAnalysisMethod === "Response Spectrum" ? (
            <>
              <div className={"d-flex f-grow"}>
                <div className={"d-flex f-column"}>
                  <div className={"d-flex f-ai-center label-light bg-dark"}>
                    <div className="t-end w-120">Spectral Data:</div>
                    <FormGroup className="no-m w-100">
                      <SimpleSelector<"Manual" | "Code">
                        items={["Manual", "Code"]}
                        selected={loadings?.spectralMode}
                        onSelect={(value) => handleChangeField("spectralMode", value)}
                        itemLabel={(item) => item}
                        className="fill-select"
                      />
                    </FormGroup>
                  </div>
                  <div className={"d-flex f-ai-center label-light bg-dark"}>
                    <Button small intent={"primary"} text={"Add Row"} onClick={handleAdd} />
                    <Button
                      small
                      intent={"success"}
                      icon={"export"}
                      text={"Export to Excel"}
                      onClick={handleExport}
                      disabled={true}
                    />
                    <Button
                      small
                      intent={"success"}
                      icon={"import"}
                      text={"Import from Excel"}
                      onClick={handleImport}
                      disabled={true}
                    />
                    <Button small intent={"warning"} text={"Delete Row"} onClick={handleDelete} />
                  </div>
                  <div className={"hr"} />
                  <div className={"d-flex f-grow bg-dark p-5"}>
                    <div className={"d-flex f-grow small-table-container"} style={{ height: 251 }}>
                      <table className="table bg-gray">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Time Period</th>
                            <th>Acceleration</th>
                          </tr>
                        </thead>
                        <tbody>{loadings.spectralsPoints?.map((point) => getPoint(point))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div
                  className={"d-flex f-grow"}
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  <Line
                    data={{
                      labels: points.map((point) => point.timePeriod),
                      datasets: [
                        {
                          label: "Acceleration",
                          data: points.map((point) => point.acceleration),
                          fill: false,
                          borderColor: "black",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      legend: { display: false },
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={"d-flex f-ai-center label-light bg-dark"}>
                <span>Seismic Weight Calculation</span>
                <Button small intent={"success"} icon={"export"} text={"Export to CSV"} />
                <FormGroup className="no-m" label="PR. No." inline>
                  <MultiSelector<string>
                    items={models.map((model) => model.name)}
                    selected={selected}
                    onSelect={(value) => setSelected(value)}
                    itemLabel={(item) => item}
                    className="fill-select w-150"
                  />
                </FormGroup>
                <div className="d-flex f-grow"></div>
                <Button
                  small
                  intent={"danger"}
                  text={"Generate Seismic Load"}
                  style={{ marginRight: 10 }}
                  onClick={handleGenerate}
                />
              </div>
              <div className={"hr"} />
              {inProgress ? (
                <>
                  <ProgressBar />
                  <div className={"hr"} />
                </>
              ) : null}
              <div className={"d-flex f-grow bg-dark p-5"}>
                <div className={"d-flex f-grow small-table-container"}>
                  <table className="table bg-gray">
                    <thead>
                      <tr>
                        <th>PR. No.</th>
                        <th>Tier No.</th>
                        <th>Node No.</th>
                        <th>Seismic Weight. (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.prNo}</td>
                          <td>{row.tierNo}</td>
                          <td>{row.nodeNo}</td>
                          <NumericCell
                            isDecimal={true}
                            value={row.seismicWeight}
                            style={{ width: "25%" }}
                            onChange={(value) => {
                              if (!loadings) return;
                              dispatch(
                                changeLoadings({
                                  ...loadings,
                                  seismicLoads:
                                    loadings.seismicLoads?.map((load) => {
                                      if (load.id === row.id) {
                                        return { ...load, seismicWeight: value };
                                      }
                                      return load;
                                    }) ?? [],
                                })
                              );
                            }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="hr" />
              <Paginator items={fRows} onChange={setSelectedRows} />
            </>
          )}
        </div>
      }
      onClose={onClose}
    />
  );
};

export default SeismicLoad;
