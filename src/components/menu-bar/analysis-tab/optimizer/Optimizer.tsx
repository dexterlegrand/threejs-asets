import React, { useState, useEffect, useRef, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, ProgressBar } from "@blueprintjs/core";
import { UIArrayElement } from "../../../../store/ui/types";
import { exportToCSV, getTopOffset, getCurrentUI } from "../../../3d-models/utils";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import { PipeRack } from "../../../../store/main/types";
import {
  getJSONForDesignCodesAndParameters,
  getASL_PR,
} from "../../../3d-models/designCodeAndParameters";
import {
  getJSONForDesignCodesAndParametersOF,
  getASL_OF,
} from "../../../3d-models/designCodeAndParametersOF";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import { jsonOptions } from "../../../../store/main/actions";
import Axios, { AxiosResponse } from "axios";
import { addEventAction, changeProjectRequestProgressAction } from "../../../../store/ui/actions";
import { baseUrl } from "../../../../store/main/constants";

type Props = {
  onClose: () => any;
};

type RowData = {
  model?: string;
  name: string;
  failedProfile?: string;
  failedLC: string;
  failedRatio: number;
  iteration: number;
  optimizedProfile?: string;
  optimizedLC?: string;
  optimizedRatio?: string;
  status: string;
  accepted?: "ACCEPT" | "REJECT";
} & UIArrayElement;

export function Optimizer(props: Props) {
  const { onClose } = props;

  const [data, setData] = useState<RowData[]>([]);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const scene = useSelector((state: ApplicationState) => state.main.scene);

  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((item) => item.name === state.main.currentProject)
  );

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const profiles = useSelector((state: ApplicationState) => state.data.profileSectionData);

  const optimizerProgress = useMemo(() => ui?.requests?.optimizer, [ui]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  useEffect(() => {
    if (!project || !ui) return;
    const requests: Promise<AxiosResponse>[] = [];
    if (project.modelType === "Pipe Rack") {
      dispatch(changeProjectRequestProgressAction(project.name, "optimizer"));
      const models = project.models as PipeRack[];
      const jsons = models.map((model, i, arr) => ({
        ...getJSONForDesignCodesAndParameters(scene, project, model, arr),
        availableSectionList: getASL_PR(ui.availableData),
        structuralNaturalFrequency: model.structuralNaturalFrequency ?? 0,
      }));
      jsons.forEach((json) => {
        const str = JSON.stringify(json);
        requests.push(
          Axios.post(`${baseUrl}api/v2/piperack/optimizer/resultForEachIteration`, str, jsonOptions)
        );
      });
    } else if (project.modelType === "Open Frame") {
      dispatch(changeProjectRequestProgressAction(project.name, "optimizer"));
      const models = project.models as TOpenFrame[];
      const jsons = models.map((model) => ({
        ...getJSONForDesignCodesAndParametersOF(
          ui.openFrameUI,
          ui.designCodeAndParametersUI,
          scene,
          project,
          model,
          models
        ),
        availableSectionList: getASL_OF(ui.availableData),
      }));
      jsons.forEach((json) => {
        const str = JSON.stringify(json);
        requests.push(
          Axios.post(
            `${baseUrl}api/v2/openframe/optimizer/resultForEachIteration`,
            str,
            jsonOptions
          )
        );
      });
    }
    Promise.allSettled(requests).then((responses) => {
      let newData: RowData[] = [];
      for (const response of responses) {
        if (response.status === "fulfilled") {
          newData = [...newData, ...mapResponse(response.value.data)];
        } else {
          const body = JSON.parse(response.reason.config.data ?? "{}");
          let id = "";
          if (project.modelType === "Pipe Rack") {
            if (body.piperackName) id = ` (${body.piperackName})`;
          } else {
            if (body.openFrameName) id = ` (${body.openFrameName})`;
          }
          dispatch(addEventAction(`Optimizer${id}: ${response.reason.message}`, "danger"));
        }
      }
      setData(newData);
      dispatch(changeProjectRequestProgressAction(project.name, "optimizer", false));
    });
  }, []);

  function mapResponse(response: any) {
    const iterationsMap = response.iterPiperackMemberCheckMap;
    const profileTypeMap = response.profileTypeMap;
    const iterations = Object.keys(iterationsMap).sort((a, b) => +a - +b);
    const map = new Map<string, RowData>();
    Object.entries(iterationsMap[0]).forEach(([index, el]: any) => {
      if (el.result === "FAIL") {
        const profileTypes = profileTypeMap[0];
        map.set(el.memberName, {
          id: map.size,
          selected: false,
          model: response.modelName,
          name: el.memberName,
          failedProfile: profileTypes ? profileTypes[index] : undefined,
          failedLC: el.loadCombinationNumber,
          failedRatio: el.actualStressRatio,
          iteration: 0,
          status: "FAIL",
        });
      }
    });
    for (const iteration of iterations) {
      if (iteration === "0") continue;
      const elements = Object.entries(iterationsMap[iteration]);
      for (const element of Array.from(map.values())) {
        if (element.status !== "FAIL") continue;
        const next: any = elements.find((item: any) => item[1].memberName === element.name);
        if (!next) continue;
        const profileTypes = profileTypeMap[+iteration];
        map.set(element.name, {
          ...element,
          optimizedProfile: profileTypes ? profileTypes[next[0]] : undefined,
          optimizedLC: next[1].loadCombinationNumber,
          optimizedRatio: next[1].actualStressRatio,
          iteration: +iteration,
          status: next[1].result,
        });
      }
    }
    return Array.from(map.values());
  }

  function handleExport() {
    exportToCSV(data, "Optimizer Data");
  }

  function drawRow(row: RowData) {
    return (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.failedProfile}</td>
        <td>{row.failedLC}</td>
        <td>{row.failedRatio}</td>
        <td>{row.iteration}</td>
        <td>{row.optimizedProfile}</td>
        <td>{row.optimizedLC}</td>
        <td>{row.optimizedRatio}</td>
        <td>{row.status}</td>
        {/* <SelectorCell<"ACCEPT" | "REJECT">
          items={["ACCEPT", "REJECT"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.accepted}
          onSelect={(accepted) => {
            setData(
              data.map((item) =>
                item.id === row.id ? { ...row, accepted } : item
              )
            );
          }}
        /> */}
      </tr>
    );
  }

  function handleApplyChanges() {}

  return (
    <CustomDlg
      title={"Optimiser Results"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="hr" />
          <div className="label-light bg-dark">
            {/* <Button
              small
              icon="trash"
              text="Delete"
              intent="warning"
              onClick={handleDeleteRows}
            /> */}
            <Button
              small
              icon="export"
              text="Export To CSV"
              intent="success"
              onClick={handleExport}
            />
          </div>
          <div className="hr" />
          {optimizerProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className="p-5">
            <div className={"table-container"}>
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th colSpan={4}>Failed Element List</th>
                    <th colSpan={5}>Optimizer Suggestion</th>
                    {/* <SelectorCell<"ACCEPT" | "REJECT">
                      rowSpan={2}
                      cellType={"th"}
                      items={["ACCEPT", "REJECT"]}
                      itemKey={(item) => item}
                      itemLabel={(item) => item}
                      selected={
                        data.every((item) => item.accepted === "ACCEPT")
                          ? "ACCEPT"
                          : data.every((item) => item.accepted === "REJECT")
                          ? "REJECT"
                          : undefined
                      }
                      onSelect={(accepted) => {
                        setData(data.map((item) => ({ ...item, accepted })));
                      }}
                    /> */}
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop }}>Name</th>
                    <th style={{ top: offsetTop }}>Size</th>
                    <th style={{ top: offsetTop }}>Critical L/C</th>
                    <th style={{ top: offsetTop }}>Ration</th>
                    <th style={{ top: offsetTop }}>Iteration No.</th>
                    <th style={{ top: offsetTop }}>Size</th>
                    <th style={{ top: offsetTop }}>Critical L/C</th>
                    <th style={{ top: offsetTop }}>Updated Ratio</th>
                    <th style={{ top: offsetTop }}>Final Status</th>
                  </tr>
                </thead>
                <tbody>{data.map((item) => drawRow(item))}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      // actions={
      //   <Button
      //     intent={"primary"}
      //     text={"Apply"}
      //     onClick={handleApplyChanges}
      //   />
      // }
      onClose={onClose}
    />
  );
}
