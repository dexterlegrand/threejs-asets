import { Button } from "@blueprintjs/core";
import Axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { lsaAtom } from "../../../../recoil/atoms/lsa-atoms";
import { ApplicationState } from "../../../../store";
import { workingPressure } from "../../../../store/data/constants";
import { TPipingAccessory, TPipingElbow } from "../../../../store/data/types";
import {
  changeProjectModeAction,
  jsonOptions,
} from "../../../../store/main/actions";
import {
  TPipeLoadCombination,
  TPipeNodeDisplacement,
} from "../../../../store/main/pipeTypes";
import { FreePipe, Project, TFlangeLoads } from "../../../../store/main/types";
import { addEventAction } from "../../../../store/ui/actions";
import { getPipeAnalysisJSON } from "../../../3d-models/freePipes";
import { getAngle } from "../../../3d-models/pipes/pipesUtils";
import { checkRange } from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import { SimpleSelector } from "../../../common/SimpleSelector";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../common/table/GenericTable";
import { EndConnectorDetails } from "../../analysis-tab/piping/EndConnectorDetails";
import { FlangeLoadsDlg } from "../../analysis-tab/piping/FlangeLoadsDlg";
import { NodeDisplacement, TRow } from "./NodeDisplacement";
import { secondServerAPI } from "../../../../pages/utils/agent";
import { lsaServerAPI } from "../../../../pages/utils/agent";
import { start } from "repl";

type Props = {
  project: Project;
  LCs: TPipeLoadCombination[];
  onClose: () => any;
};

export function LSAGeometryDlg({ project, LCs, onClose }: Props) {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [LC, setLC] = useState<TPipeLoadCombination>();
  const [dataType, setDataType] = useState<"ANALYSIS" | "MANUAL">("ANALYSIS");
  const [data, setData] = useState<TRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [lsa, setLSA] = useRecoilState(lsaAtom);

  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const resoures = useSelector((state: ApplicationState) => state.data);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(changeProjectModeAction(project.name, "LSA"));
    return () => {
      dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, [project.name]);

  const pipes = useMemo(() => {
    return project.freePipes ?? [];
  }, [project.freePipes]);

  const json = useMemo(() => {
    if (!LC || !lsa.element) return;
    return getPipeAnalysisJSON(
      project,
      pipes.filter((p) => p.line === lsa.element!.pipe.line),
      [LC],
      scene
    ).json;
  }, [lsa.element?.pipe, project, pipes, LC, scene]);

  const { node1, node2 } = useMemo(() => {
    if (!lsa.element || !json) return {};
    return getNodes(lsa.element.type, lsa.element.pipe, json, pipes);
  }, [lsa.element, json, pipes]);

  useEffect(() => {
    if (!lsa.element || !LC?.LC_No) return;
    console.log(lsa.element);
    if (lsa.element.type === "pipe" || lsa.element.type === "connector") {
      if (!node1 || !node2) return;
      setData([
        {
          id: 0,
          model: lsa.element.pipe.line + "",
          nodeNumber: node1,
          LCNumber: LC?.LC_No + "",
          rx: 0,
          ry: 0,
          rz: 0,
          du: 0,
          dv: 0,
          dw: 0,
          tResultant: 0,
          rResultant: 0,
        },
        {
          id: 1,
          model: lsa.element.pipe.line + "",
          nodeNumber: node2,
          LCNumber: LC?.LC_No + "",
          rx: 0,
          ry: 0,
          rz: 0,
          du: 0,
          dv: 0,
          dw: 0,
          tResultant: 0,
          rResultant: 0,
        },
      ]);
    } else {
      if (!node1) return;
      setData([
        {
          id: 0,
          model: lsa.element.pipe.line + "",
          nodeNumber: node1,
          LCNumber: LC?.LC_No + "",
          rx: 0,
          ry: 0,
          rz: 0,
          du: 0,
          dv: 0,
          dw: 0,
          tResultant: 0,
          rResultant: 0,
        },
      ]);
    }
  }, [lsa.element, node1, node2]);

  const dataFields: TDataField[] = useMemo(() => {
    if (!lsa.element) return [];
    const { type, pipe } = lsa.element;
    const maxT = Math.max(
      pipe.params.T1 ?? 0,
      pipe.params.T2 ?? 0,
      pipe.params.T3 ?? 0,
      pipe.params.T4 ?? 0,
      pipe.params.T5 ?? 0
    );
    const maxP = Math.max(pipe.params.P1 ?? 0, pipe.params.HP ?? 0);
    const sfCheck =
      pipe.params.startFlangeLoads &&
      pipe.params.startFlangeLoads.code !== "API 517"
        ? changeFlangeBy3FM(pipe.params.startFlangeLoads)
        : changeFlange(maxT, maxP, pipe.params.startFlangeClass);
    const efCheck =
      pipe.params.endFlangeLoads &&
      pipe.params.endFlangeLoads.code !== "API 517"
        ? changeFlangeBy3FM(pipe.params.endFlangeLoads)
        : changeFlange(maxT, maxP, pipe.params.endFlangeClass);
    switch (type) {
      case "pipe":
        return [
          {
            id: pipe.id,
            fields: [
              { type: "CELL", value: pipe.pipe },
              { type: "CELL", value: pipe.preceding },
              { type: "CELL", value: pipe.params.nps },
              { type: "CELL", value: pipe.params.profile?.schedule },
              { type: "CELL", value: pipe.params.material?.material_name },
              { type: "CELL", value: pipe.params.od },
              { type: "CELL", value: pipe.params.thickness },
            ],
          },
        ];
      case "connector":
        return [
          {
            id: pipe.id,
            fields: [
              { type: "CELL", value: pipe.pipe },
              { type: "CELL", value: pipe.preceding },
              { type: "CELL", value: pipe.params.nps },
              { type: "CELL", value: pipe.params.profile?.schedule },
              { type: "CELL", value: pipe.params.material?.material_name },
              { type: "CELL", value: pipe.params.od },
              { type: "CELL", value: pipe.params.thickness },
              { type: "CELL", value: pipe.params.endConnectorType },
              {
                type: "CELL",
                value: getEndConnectorLabel(pipe.params.endConnector),
              },
              getEndConnectorDetailsField(pipe),
            ],
          },
        ];
      case "start-flange":
        return [
          {
            id: pipe.id,
            fields: [
              { type: "CELL", value: pipe.pipe },
              { type: "CELL", value: pipe.params.nps },
              { type: "CELL", value: pipe.params.profile?.schedule },
              { type: "CELL", value: pipe.params.material?.material_name },
              { type: "CELL", value: pipe.params.od },
              { type: "CELL", value: pipe.params.thickness },
              {
                type: "CELL",
                value: pipe.params.startFlangeType,
              },
              {
                type: "CELL",
                value: pipe.params.startFlangeClass,
              },
              {
                type: "CELL",
                value: `${pipe.params.startFlange?.nps} - ${pipe.params.startFlange?.material}`,
              },
              {
                type: "VALIDATOR",
                props: {
                  value: sfCheck, 
                  validator: (v) => v !== "FAILED",
                  valueFormater: (v) => v,
                },
              },
              {
                type: "CELL",
                value: (
                  <Button
                    small
                    minimal
                    icon={"menu"}
                    intent={"primary"}
                    className={"c-light"}
                    onClick={() => {
                      setDialog(
                        <FlangeLoadsDlg
                          pipe={pipe}
                          isStart={true}
                          onSave={() => {}}
                          onClose={() => setDialog(undefined)}
                        />
                      );
                    }}
                  />
                ),
              },
            ],
          },
        ];
      case "end-flange":
        return [
          {
            id: pipe.id,
            fields: [
              { type: "CELL", value: pipe.pipe },
              { type: "CELL", value: pipe.params.nps },
              { type: "CELL", value: pipe.params.profile?.schedule },
              { type: "CELL", value: pipe.params.material?.material_name },
              { type: "CELL", value: pipe.params.od },
              { type: "CELL", value: pipe.params.thickness },
              {
                type: "CELL",
                value: pipe.params.endFlangeType,
              },
              {
                type: "CELL",
                value: pipe.params.endFlangeClass,
              },
              {
                type: "CELL",
                value: `${pipe.params.endFlange?.nps} - ${pipe.params.endFlange?.material}`,
              },
              {
                type: "VALIDATOR",
                props: {
                  value: efCheck,
                  validator: (v) => v !== "FAILED",
                  valueFormater: (v) => v,
                },
              },
              {
                type: "CELL",
                value: (
                  <Button
                    small
                    minimal
                    icon={"menu"}
                    intent={"primary"}
                    className={"c-light"}
                    onClick={() => {
                      setDialog(
                        <FlangeLoadsDlg
                          pipe={pipe}
                          onSave={() => {}}
                          onClose={() => setDialog(undefined)}
                        />
                      );
                    }}
                  />
                ),
              },
            ],
          },
        ];
      default:
        return [];
    }
  }, [lsa.element]);

  function getEndConnectorDetailsField(pipe: FreePipe): TField {
    if (!pipe.params.endConnector) return { type: "CELL" };
    if (
      pipe.params.endConnectorType === "Elbow" ||
      pipe.params.endConnectorType === "Tee"
    ) {
      return {
        type: "CELL",
        value: (
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDialog(
                <EndConnectorDetails
                  pipe={pipe}
                  nexts={pipes?.filter((p) => p.preceding === pipe.pipe) ?? []}
                  resoures={resoures}
                  onSave={() => {}}
                  onClose={() => setDialog(undefined)}
                />
              );
            }}
          />
        ),
      };
    } else if (pipe.params.endConnectorType === "Reducer") {
      return {
        type: "CELL",
        value: pipe.params.reducerType ?? "Concentric",
      };
    }
    return { type: "CELL" };
  }

  function handleCalculate() {
    if (!lsa.element || !project || !LC?.LC_No) return;
    setIsLoading(true);
    const { type, pipe } = lsa.element;
    const lsa_json = getJSON(
      type,
      pipe,
      LC,
      json,
      project,
      pipes,
      // @ts-ignore
      dataType === "MANUAL" ? data : undefined
    );
    setLSA((prev) => ({ ...prev, result: lsa_json.id })); 
    Axios.post(`${lsaServerAPI}/run`, JSON.stringify(lsa_json), jsonOptions)
      .then((resp) => {
        if (resp.data === "failed") {
          dispatch(addEventAction(`LSA analysing: failed`, "danger"));
          return;
        }
        dispatch(addEventAction(`LSA analysing: done`, "success"));
        setLSA((prev) => ({ ...prev, result: lsa_json.id }));
      })
      .catch((err) => {
        console.error(err);
        dispatch(addEventAction(`LSA analysing: ${err.message}`, "danger"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleOpenNodeDisplacement() {
    setDialog(
      <NodeDisplacement
        data={data}
        onSave={(data) => {
          setData(data);
          setDialog(undefined);
        }}
        onClose={() => setDialog(undefined)}
      />
    );
  }

  return (
    <>
      <CustomDlg
        title={"LSA Geometry"}
        isMinimize={true}
        zIndex={5}
        body={
          <div className={"d-flex f-column f-grow bg-dark"}>
            <div className="hr" />
            <div className="d-flex label-light bg-dark">
              <Button
                small
                text="Calculate"
                intent="success"
                disabled={!LC}
                onClick={handleCalculate}
              />
              <SimpleSelector
                items={LCs}
                itemLabel={(item) => getLCNumberStr(item.LC_No)}
                selected={LC}
                onSelect={setLC}
                filter={(q, item) =>
                  !q || getLCNumberStr(item.LC_No).includes(q)
                }
                className={"w-100"}
              />
              <SimpleSelector<"ANALYSIS" | "MANUAL">
                items={["ANALYSIS", "MANUAL"]}
                itemLabel={(item) => item}
                selected={dataType}
                onSelect={(type) => type && setDataType(type)}
                className={"w-100"}
              />
              {dataType === "MANUAL" ? (
                <Button
                  small
                  text="User Defined Displacement"
                  intent="primary"
                  onClick={handleOpenNodeDisplacement}
                />
              ) : null}
            </div>
            <div className="hr" />
            <GenericTable
              isSmall={true}
              inProgress={isLoading}
              header={getHeader(lsa.element?.type)}
              dataFields={dataFields}
            />
          </div>
        }
        onClose={onClose}
      />
      {dialog}
    </>
  );
}

function getLCNumberStr(number?: number) {
  return number ? number + "" : "";
}

function getHeader(
  type?: "pipe" | "connector" | "start-flange" | "end-flange"
): THeader {
  switch (type) {
    case "pipe":
      return {
        rows: [
          {
            columns: [
              { title: "Pipe. No." },
              { title: "Preceding Pipe" },
              { title: "NPS" },
              { title: "Schedule" },
              { title: "Material" },
              { title: "OD (mm)" },
              { title: "Thickness (mm)" },
            ],
          },
        ],
      };
    case "connector":
      return {
        rows: [
          {
            columns: [
              { title: "Pipe. No." },
              { title: "Preceding Pipe" },
              { title: "NPS" },
              { title: "Schedule" },
              { title: "Material" },
              { title: "OD (mm)" },
              { title: "Thickness (mm)" },
              { title: "End Connector Type" },
              { title: "End Connector" },
              { title: "End Connector Details" },
            ],
          },
        ],
      };
    case "start-flange":
      return {
        rows: [
          {
            columns: [
              { title: "Pipe. No", rowSpan: 2 },
              { title: "NPS", rowSpan: 2 },
              { title: "Schedule", rowSpan: 2 },
              { title: "Material", rowSpan: 2 },
              { title: "OD (mm)", rowSpan: 2 },
              { title: "Thickness (mm)", rowSpan: 2 },
              { title: "Start Flange", colSpan: 5 },
            ],
          },
          {
            columns: [
              { title: "Type" },
              { title: "Class" },
              { title: "Material" },
              { title: "Flange Check ANSI B16.5 -1988" },
              { title: "Max. allow. Nozzle Load" },
            ],
          },
        ],
      };
    case "end-flange":
      return {
        rows: [
          {
            columns: [
              { title: "Pipe. No", rowSpan: 2 },
              { title: "NPS", rowSpan: 2 },
              { title: "Schedule", rowSpan: 2 },
              { title: "Material", rowSpan: 2 },
              { title: "OD (mm)", rowSpan: 2 },
              { title: "Thickness (mm)", rowSpan: 2 },
              { title: "End Flange", colSpan: 5 },
            ],
          },
          {
            columns: [
              { title: "Type" },
              { title: "Class" },
              { title: "Material" },
              { title: "Flange Check ANSI B16.5 -1988" },
              { title: "Max. allow. Nozzle Load" },
            ],
          },
        ],
      };
    default:
      return { rows: [] };
  }
}

function getEndConnectorLabel(item?: TPipingAccessory) {
  return item
    ? `${(item as TPipingElbow).isUser ? "UDE - " : ""}${item.nps} - ${
        item.schedule
      } - ${
        (item as TPipingElbow).degree
          ? `${(item as TPipingElbow).degree} - `
          : ""
      }${item.material}`
    : "";
}

function changeFlangeBy3FM(l: TFlangeLoads) {
  const F = Math.sqrt(l.fx ^ (2 + l.fy) ^ (2 + l.fz) ^ 2);
  const F3_lb = F * 3 * 0.2248089431;

  const M = Math.sqrt(l.mx ^ (2 + l.my) ^ (2 + l.mz) ^ 2);
  const M_ft_lb = M * 0.0007376;

  return F3_lb + M_ft_lb < (l["3F+M"] ?? 0) ? "PASS" : "FAILED";
}

function changeFlange(T: number, P: number, flangeClass?: number) {
  if (!flangeClass) return "";
  const ts = Object.keys(workingPressure)
    .map((el) => Number(el))
    .sort((a, b) => a - b);
  if (!checkRange(T, ts[0], ts[ts.length - 1], true, true)) return "";
  let checkedT;
  for (const t of ts) {
    if (t >= T) {
      checkedT = t;
      break;
    }
  }
  if (!checkedT) return "";
  // @ts-ignore
  const classes = workingPressure[checkedT];
  if (!classes) return "";
  const p = classes[flangeClass];
  return p > P ? "PASS" : "FAILED";
}

function getJSON(
  type: "pipe" | "connector" | "start-flange" | "end-flange",
  pipe: FreePipe,
  LC: TPipeLoadCombination,
  json: any,
  project: Project,
  pipes: FreePipe[],
  data?: TPipeNodeDisplacement[]
) {
  const nodeDisplacement =
    data ??
    project.pipeAnalysis?.nodeDisplacements?.filter(
      (el) => el.line === `${pipe.line}` && el.LC === `${LC.LC_No}`
    );
  const lsa: any[] = [];
  if (type === "pipe") {
    const members: any[] = json.members
      .filter((m: any) => m.name.includes(`${pipe.pipe}.`))
      .sort((a: any, b: any) => {
        const ai = a.name.split(".")[1];
        const bi = b.name.split(".")[1];
        return +ai - +bi;
      });
    const startMember = members[0];
    const endMember = members[members.length-1];// edited by hammad
    // @ts-ignore
    const startBeamElement = json.beamElements[startMember?.label ?? ""];
    // @ts-ignore
    const endBeamElement = json.beamElements[endMember?.label ?? ""];
    const startNode = startBeamElement?.nodes[0];
    const endNode = endBeamElement?.nodes[1];
    const startND = nodeDisplacement?.find((nd) => nd.nodeNumber === startNode);
    const endND = nodeDisplacement?.find((nd) => nd.nodeNumber === endNode);
    const id: string[] = [];
    const elementLabel: number[] = [];
    for (const m of members) {
      id.push(m.name);
      elementLabel.push(m.label);
    }
    const data = {
      id,
      type: "Pipe",
      startNode,
      endNode,
      elementLabel,
      LC: LC.LC_No,
      disp: [
        {
          Node: startNode,
          Components: startND
            ? [
                startND.du,
                startND.dv,
                startND.dw,
                startND.rz,
                startND.rx,
                startND.ry,
              ]
            : [0, 0, 0, 0, 0, 0],
        },
        {
          Node: endNode,
          Components: endND
            ? [endND.du, endND.dv, endND.dw, endND.rz, endND.rx, endND.ry]
            : [0, 0, 0, 0, 0, 0],
        },
      ],
    };
    lsa.push(data);
  } else if (type === "connector") {
    let startMember;
    let middleMember;
    let endMember;
    if (pipe.params.endConnectorType === "Reducer") {
      const next = pipes.find((p) => p.preceding === pipe.pipe);
      for (const m of json.members) {
        if (
          m.name.includes(`${pipe.pipe}-`) &&
          m.name.includes(`-${next?.pipe}`)
        ) {
          startMember = m;
          endMember = m;
          break;
        }
      }
    } else if (pipe.params.endConnectorType === "Return") {
      const next = pipes.find((p) => p.preceding === pipe.pipe);
      for (const m of json.members) {
        if (m.name.includes(`${pipe.pipe}-E-`)) {
          startMember = m;
        } else if (m.name.includes(`${next?.pipe}-S-`)) {
          endMember = m;
        }
        if (startMember && endMember) break;
      }
    } else if (pipe.params.endConnectorType === "Elbow") {
      if (pipe.params.endConnectorDetails?.type === "BWE") {
        const next = pipes.find((p) => p.preceding === pipe.pipe);
        for (const m of json.members) {
          if (m.name.includes(`${pipe.pipe}-E-`)) {
            startMember = m;
          } else if (m.name.includes(`${next?.pipe}-S-`)) {
            endMember = m;
          }
          if (startMember && endMember) break;
        }
      } else {
        const next = pipes.find((p) => p.preceding === pipe.pipe);
        for (const m of json.members) {
          if (
            m.name.includes(`${pipe.pipe}-E-`) &&
            m.name[m.name.length - 1] === "1"
          ) {
            startMember = m;
          } else if (m.name.includes(`${next?.pipe}-S-`)) {
            endMember = m;
          } else if (
            m.name.includes(`${pipe.pipe}-E-`) &&
            m.name[m.name.length - 1] === "2"
          ) {
            middleMember = m;
          }
        }
      }
    } else if (pipe.params.endConnectorType === "Tee") {
      const next = pipes.find(
        (p) => p.preceding === pipe.pipe && getAngle(p, pipe) === 0
      );
      const next90 = pipes.find(
        (p) => p.preceding === pipe.pipe && Math.round(getAngle(p, pipe) || 0) === 90
      );
      for (const m of json.members) {
        if (m.name.includes(`${pipe.pipe}-E-`)) {
          startMember = m;
          console.log(startMember);
        } else if (m.name.includes(`${next?.pipe}-S-`)) {
          endMember = m;
          console.log(endMember);
        } else if (m.name.includes(`${next90?.pipe}-S-`)) {
          middleMember = m;
          console.log(middleMember);
          
        }
      }
    }
    // @ts-ignore
    const startBeamElement = json.beamElements[startMember?.label ?? ""];
    // @ts-ignore
    const endBeamElement = json.beamElements[endMember?.label ?? ""];
    //added by hammad
    // @ts-ignore
    const branchBeamElement = json.beamElements[middleMember?.label ?? ""];

    const startNode = startBeamElement?.nodes[0];
    //added by me
    const branchNode = branchBeamElement?.nodes[0];

    const endNode = endBeamElement?.nodes[1];
    const startND = nodeDisplacement?.find((nd) => nd.nodeNumber === startNode);
    //adding branchND
    const branchND = nodeDisplacement?.find((nd) => nd.nodeNumber === branchNode);
    const endND = nodeDisplacement?.find((nd) => nd.nodeNumber === endNode);
    const id: string[] = [];
    const elementLabel: number[] = [];
    if (startMember) {
      id.push(startMember.name);
      elementLabel.push(startMember.label);
    }
    if (middleMember) {
      id.push(middleMember.name);
      elementLabel.push(middleMember.label);
    }
    if (endMember) {
      id.push(endMember.name);
      elementLabel.push(endMember.label);
    }
    //condition to check the type of the connector if connector type tee then this condtion to follow
    if (pipe.params.endConnectorType === "Tee"){
      const data = {
        id,
        type: pipe.params.endConnectorDetails?.type,
        startNode,
        branchNode,
        endNode,
        elementLabel,
        LC: LC.LC_No,
        disp: [
          {
            Node: startNode,
            Components: startND
              ? [
                  startND.du,
                  startND.dv,
                  startND.dw,
                  startND.rz,
                  startND.rx,
                  startND.ry,
                ]
              : [0, 0, 0, 0, 0, 0]
          },
          {
            Node: branchNode,
            Components: branchND
              ? [
                  branchND.du,
                  branchND.dv,
                  branchND.dw,
                  branchND.rz,
                  branchND.rx,
                  branchND.ry,
                ]
              : [0, 0, 0, 0, 0, 0]
          },
          {
            Node: endNode,
            Components: endND
              ? [
                  endND.du,
                  endND.dv,
                  endND.dw,
                  endND.rz,
                  endND.rx,
                  endND.ry,
                ]
              : [0, 0, 0, 0, 0, 0]
          },
        ],
      };
      lsa.push(data)
    }
    else{
      const data = {
        id,
        type: pipe.params.endConnectorDetails?.type,
        startNode,
        endNode,
        elementLabel,
        LC: LC.LC_No,
        disp: [
          {
            Node: startNode,
            Components: startND
              ? [
                  startND.du,
                  startND.dv,
                  startND.dw,
                  startND.rz,
                  startND.rx,
                  startND.ry,
                ]
              : [0, 0, 0, 0, 0, 0],
          },
          {
            Node: endNode,
            Components: endND
              ? [endND.du, endND.dv, endND.dw, endND.rz, endND.rx, endND.ry]
              : [0, 0, 0, 0, 0, 0],
          },
        ],
      };
      lsa.push(data);
    }
  } else {
    const fData: any = Object.values(json.flangeData).find(
      (fd: any) =>
        fd.pipe === pipe.pipe &&
        (type === "start-flange"
          ? fd.flangeAt === "START"
          : fd.flangeAt === "END")
    );
    const ND = nodeDisplacement?.find((nd) => nd.nodeNumber === fData?.node);
    const data = {
      id: [fData?.id],
      type: "Flange",
      node: fData?.node,
      disp: [
        {
          Node: fData.node,
          Components: ND
            ? [ND.du, ND.dv, ND.dw, ND.rz, ND.rx, ND.ry]
            : [0, 0, 0, 0, 0, 0],
        },
      ],
    };
    lsa.push(data);
  }
  console.log(lsa);
  return { ...json, lsa };
}

function getNodes(
  type: "pipe" | "connector" | "start-flange" | "end-flange",
  pipe: FreePipe,
  json: any,
  pipes: FreePipe[]
) {
  if (type === "pipe") {
    const members: any[] = json.members
      .filter((m: any) => m.name.includes(`${pipe.pipe}.`))
      .sort((a: any, b: any) => {
        const ai = a.name.split(".")[1];
        const bi = b.name.split(".")[1];
        return +ai - +bi;
      });
    const startMember = members[0];
    const endMember = members[members.length - 1];
    // @ts-ignore
    const startBeamElement = json.beamElements[startMember?.label ?? ""];
    // @ts-ignore
    const endBeamElement = json.beamElements[endMember?.label ?? ""];
    return {
      node1: startBeamElement?.nodes[0],
      node2: endBeamElement?.nodes[1],
    };
  } else if (type === "connector") {
    let startMember;
    let endMember;
    if (pipe.params.endConnectorType === "Reducer") {
      const next = pipes.find((p) => p.preceding === pipe.pipe);
      for (const m of json.members) {
        if (
          m.name.includes(`${pipe.pipe}-`) &&
          m.name.includes(`-${next?.pipe}`)
        ) {
          startMember = m;
          endMember = m;
          break;
        }
      }
    } else if (pipe.params.endConnectorType === "Return") {
      const next = pipes.find((p) => p.preceding === pipe.pipe);
      for (const m of json.members) {
        if (m.name.includes(`${pipe.pipe}-E-`)) {
          startMember = m;
        } else if (m.name.includes(`${next?.pipe}-S-`)) {
          endMember = m;
        }
        if (startMember && endMember) break;
      }
    } else if (pipe.params.endConnectorType === "Elbow") {
      if (pipe.params.endConnectorDetails?.type === "BWE") {
        const next = pipes.find((p) => p.preceding === pipe.pipe);
        for (const m of json.members) {
          if (m.name.includes(`${pipe.pipe}-E-`)) {
            startMember = m;
          } else if (m.name.includes(`${next?.pipe}-S-`)) {
            endMember = m;
          }
          if (startMember && endMember) break;
        }
      } else {
        const next = pipes.find((p) => p.preceding === pipe.pipe);
        for (const m of json.members) {
          if (
            m.name.includes(`${pipe.pipe}-E-`) &&
            m.name[m.name.length - 1] === "1"
          ) {
            startMember = m;
          } else if (m.name.includes(`${next?.pipe}-S-`)) {
            endMember = m;
          }
        }
      }
    } else if (pipe.params.endConnectorType === "Tee") {
      const next = pipes.find(
        (p) => p.preceding === pipe.pipe && getAngle(p, pipe) === 0
      );
      for (const m of json.members) {
        if (m.name.includes(`${pipe.pipe}-E-`)) {
          startMember = m;
        } else if (m.name.includes(`${next?.pipe}-S-`)) {
          endMember = m;
        }
      }
    }
    // @ts-ignore
    const startBeamElement = json.beamElements[startMember?.label ?? ""];
    // @ts-ignore
    const endBeamElement = json.beamElements[endMember?.label ?? ""];
    return {
      node1: startBeamElement?.nodes[0],
      node2: endBeamElement?.nodes[1],
    };
  } else {
    const fData: any = Object.values(json.flangeData).find(
      (fd: any) =>
        fd.pipe === pipe.pipe &&
        (type === "start-flange"
          ? fd.flangeAt === "START"
          : fd.flangeAt === "END")
    );
    return { node1: fData?.node };
  }
  return {};
}
