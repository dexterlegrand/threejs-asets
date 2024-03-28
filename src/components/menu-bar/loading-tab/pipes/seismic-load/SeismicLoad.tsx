import React, { useMemo, useState } from "react";
import { FormGroup, ProgressBar, Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { LoadingAsPerCode, TSpectralPoint } from "../../../../../store/main/types";
import {
  loadingAsPerCodes,
  siteClassesA,
  siteClasses1,
  dampingRatioData,
  soilTypeData,
} from "../../../../../store/main/constants";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CustomDlg } from "../../../../common/CustomDlg";
import {
  getElementByName,
  getNextId,
  getCurrentUI,
  getUnicuesArray,
  checkRange,
  roundM,
} from "../../../../3d-models/utils";
import { ISParamsPP } from "./ISParams";
import { changeProjectAction, getAndMapPipeSeismicLoads } from "../../../../../store/main/actions";
import { addEventAction } from "../../../../../store/ui/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { Paginator } from "../../../../common/Paginator";
import { Line } from "react-chartjs-2";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { TPipeSeismicLoad, TSiteClass } from "../../../../../store/main/pipeTypes";
import { MultiSelector } from "../../../../common/MultiSelector";
import { USParamsPP } from "./USParams";

type Props = { onClose: () => any };

export function SeismicLoadPP({ onClose }: Props) {
  const [selectedRows, setSelectedRows] = useState<TPipeSeismicLoad[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const scene = useSelector((state: ApplicationState) => state.main.scene);

  const inProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.seismic
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return project?.pipeLoadings?.seismicLoads;
  }, [project]);

  const windData = useMemo(() => {
    return project?.pipeLoadings?.windLoad;
  }, [project]);

  const fRows = useMemo(() => {
    return data?.seismicLoads.filter((val) => selected.some((s) => s === val.line)) ?? [];
  }, [data, selected]);

  const points = useMemo(() => {
    const points: TSpectralPoint[] =
      data?.spectralsPoints.filter(
        (item) => item.timePeriod !== undefined && item.acceleration !== undefined
      ) ?? [];
    return points.sort((a, b) => a.timePeriod - b.timePeriod);
  }, [data]);

  function handleChangeData(field: string, value: any) {
    if (!project || !data) return;
    if (field === "spectralMode" && value === "Code") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeLoadings: {
            ...project.pipeLoadings!,
            seismicLoads: {
              ...data,
              [field]: value,
              spectralsPoints: handleCodeSpectralPoints(),
            },
          },
        })
      );
      return;
    } else if (field === "spectralsPoints" && data.spectralMode === "Code") {
      dispatch(
        changeProjectAction({
          ...project,
          pipeLoadings: {
            ...project.pipeLoadings!,
            seismicLoads: { ...data, [field]: value, spectralMode: "Manual" },
          },
        })
      );
      return;
    }
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: { ...project.pipeLoadings!, seismicLoads: { ...data, [field]: value } },
      })
    );
  }

  function handleCodeSpectralPoints() {
    if (!data) return [];
    const points: TSpectralPoint[] = [];
    if (data.seismicLoadingAsPerCode === "IS Code") {
      // @ts-ignore
      const dmf = dampingRatioData[data.isSeismicCode.dampingRatio];
      // @ts-ignore
      const soilType = soilTypeData[data.isSeismicCode.soilType];
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
    } else if (data.seismicLoadingAsPerCode === "US Code") {
      const coef = 9.81;
      const T_L = data.usSeismicCode.T_L;
      const S_S = data.usSeismicCode.S_S;
      const S_1 = data.usSeismicCode.S_1;
      const F_A = getF_A(data.usSeismicCode.siteClass, S_S);
      const F_V = getF_V(data.usSeismicCode.siteClass, S_1);
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
    getAndMapPipeSeismicLoads(dispatch, project, scene);
  }

  function handleChangePoint(old: TSpectralPoint, field: string, value: any) {
    if (!data) return;
    const changed = { ...old, [field]: value };
    if (
      field === "timePeriod" &&
      data.spectralsPoints.some(
        (item) => item.timePeriod !== undefined && item.timePeriod === value
      )
    ) {
      dispatch(
        addEventAction("Seismic Loads: You already have a point with the same period!", "danger")
      );
      return;
    }
    handleChangeData(
      "spectralsPoints",
      data.spectralsPoints.map((item) => (item.id === changed.id ? changed : item))
    );
  }

  function handleAdd() {
    if (!data) return;
    handleChangeData("spectralsPoints", [
      ...data.spectralsPoints,
      {
        id: getNextId(data.spectralsPoints),
        selected: false,
      },
    ]);
  }

  function handleDelete() {
    if (!data) return;
    handleChangeData(
      "spectralsPoints",
      data.spectralsPoints.filter((item) => !item.selected)
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
          <div className={"d-flex f-ai-center bg-dark always"} style={{ paddingRight: 10 }}>
            <div className="label-light t-end w-180">Seismic Loading as per</div>
            <FormGroup className="no-m w-150">
              <SimpleSelector<LoadingAsPerCode>
                items={loadingAsPerCodes}
                selected={data?.seismicLoadingAsPerCode}
                onSelect={(value) => handleChangeData("seismicLoadingAsPerCode", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>

            <div className="label-light t-end w-180">Seismic Analysis Method:</div>
            <FormGroup className="no-m w-200">
              <SimpleSelector<"Equivalent Static" | "Response Spectrum">
                items={["Equivalent Static", "Response Spectrum"]}
                selected={data?.seismicAnalysisMethod}
                onSelect={(value) => handleChangeData("seismicAnalysisMethod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>

            <div className="label-light t-end w-180">Modal Combination Method:</div>
            <FormGroup className="no-m w-200">
              <SimpleSelector<"ABS-SUM" | "SRSS" | "CQC">
                items={["ABS-SUM", "SRSS", "CQC"]}
                selected={data?.modalCombinationMethod}
                onSelect={(value) => handleChangeData("modalCombinationMethod", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {data?.seismicLoadingAsPerCode === "IS Code" && (
            <ISParamsPP data={data} windData={windData} onChange={handleChangeData} />
          )}
          {data?.seismicLoadingAsPerCode === "US Code" && (
            <USParamsPP data={data} windData={windData} onChange={handleChangeData} />
          )}
          {data?.seismicLoadingAsPerCode === "EU Code" && <></>}
          <div className={"hr"} />
          {data?.seismicAnalysisMethod === "Response Spectrum" ? (
            <>
              <div className={"d-flex f-grow"}>
                <div className={"d-flex f-column"}>
                  <div className={"d-flex f-ai-center label-light bg-dark"}>
                    <div className="t-end w-100">Spectral Data:</div>
                    <FormGroup className="no-m w-100">
                      <SimpleSelector<"Manual" | "Code">
                        items={["Manual", "Code"]}
                        selected={data?.spectralMode}
                        onSelect={(value) => handleChangeData("spectralMode", value)}
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
                        <tbody>{data.spectralsPoints?.map((point) => getPoint(point))}</tbody>
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
                <Button
                  small
                  intent={"success"}
                  icon={"export"}
                  text={"Export to CSV"}
                  disabled={true}
                />
                <FormGroup className="no-m" label="Line No." inline>
                  <MultiSelector<string>
                    items={getUnicuesArray(project?.freePipes?.map((val) => `${val.line}`) ?? [])}
                    selected={selected}
                    onSelect={(val) => setSelected(val)}
                    itemLabel={(val) => val}
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
                        <th>Line No.</th>
                        <th>Node No.</th>
                        <th>Seismic Weight. (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.line}</td>
                          <td>{row.node}</td>
                          <NumericCell
                            isDecimal={true}
                            value={row.weight}
                            style={{ width: "33%" }}
                            onChange={(value) => {
                              handleChangeData(
                                "seismicLoads",
                                fRows.map((load) => {
                                  if (load.id === row.id) {
                                    return { ...load, seismicWeight: value };
                                  }
                                  return load;
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
}
