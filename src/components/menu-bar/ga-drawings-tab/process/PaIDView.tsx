import React, { useState, useRef, useEffect, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Svg, SVG } from "@svgdotjs/svg.js";
import {
  TSize,
  TScale,
  TView,
} from "../../analysis-tab/piping/isometric-view/isometricTypes";
import {
  sizes,
  scales,
  views,
} from "../../analysis-tab/piping/isometric-view/isometricUtils";
import { Popover, Button, FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import {
  getCurrentProcess,
  getCurrentProject,
  getIndexName,
  getNextId,
  getDirection,
  getOrientationByDirection,
} from "../../../3d-models/utils";
import {
  getPaIDdata,
  drawPaID,
  getIsometricPaIDdata,
} from "../../../3d-models/process/PaID";
import {
  TProcessElement,
  EProcessElementType,
  TProcess,
  TProcess2D,
  TProcessLineSegment,
  TProcessSource,
  TProcessValve,
  TProcessSink,
} from "../../../../store/process/types";
import { ProcessToPiping } from "./ProcessToPiping";
import { initialProcess } from "../../../../store/process/initialState";
import { FreePipe, Direction2 } from "../../../../store/main/types";
import { Vector3 } from "three";
import { TitlesDlg } from "./TitlesDlg";
import { toSVG, toPNG, toDXF } from "../../../3d-models/process/PUtils2D";

type Props = {
  onClose: () => any;
};

export function PaIDView({ onClose }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();
  const [canvas, setCanvas] = useState<Svg>(SVG());
  const [size, setSize] = useState<TSize>(sizes[1]);
  const [scale, setScale] = useState<TScale>(scales[4]);
  const [data2D, setData2D] = useState<TProcess2D>();
  const [type, setType] = useState<"PLANE" | "ISOMETRIC">("PLANE");
  const [view, setView] = useState<TView>("SW");

  const container = useRef<HTMLDivElement>(null);

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const current = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const pipeProcess = useMemo(() => {
    return mode === "PIPING" ? convertPipesToProcess(pipes) : undefined;
  }, [mode, project, pipes, process]);

  const resultProcess = useMemo(() => {
    return mode === "PROCESS" || mode === "DESIGNER"
      ? process
      : mode === "PIPING"
      ? pipeProcess
      : undefined;
  }, [mode, process, pipeProcess]);

  useEffect(() => {
    if (!resultProcess) return;
    const svg = SVG();
    svg.size(size.width * 2, size.height * 2);
    svg.rect(svg.width() as number, svg.height() as number).fill("#ddd");
    setCanvas(svg);
    // drawPaID(canvas, scale, size, newData);
    // setScale(scales[4]);
    // setScale(data.scale);
  }, [resultProcess]);

  useEffect(() => {
    if (!resultProcess) return;
    const data =
      type === "PLANE"
        ? getPaIDdata(resultProcess)
        : getIsometricPaIDdata(resultProcess, view);
    if (!data) return;
    const newData: TProcess2D = {
      elements: data.elements,
      lines: data.lines,
      instrs2D: data.instrs2D,
      instrLines2D: data.instrLines2D,
      titles: resultProcess.titles,
      revisions: resultProcess.revisions,
    };
    setData2D(newData);
  }, [type, view, resultProcess]);

  useEffect(() => {
    if (!data2D) return;
    drawPaID(canvas, scale, size, data2D);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [scale, data2D]);

  useEffect(() => {
    if (!data2D) return;
    canvas.size(size.width * 2, size.height * 2);
    drawPaID(canvas, scale, size, data2D);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [size]);

  function handleExportToPiping() {
    setDlg(
      <ProcessToPiping
        pipeProcess={pipeProcess}
        onClose={() => setDlg(undefined)}
      />
    );
  }

  function convertPipesToProcess(pipes: FreePipe[]) {
    const lines = new Map<number, FreePipe[]>();
    for (const pipe of pipes) {
      const pps = lines.get(pipe.line) ?? [];
      lines.set(pipe.line, [...pps, pipe]);
    }
    const processElementsMap = process?.elements ?? initialProcess.elements;
    let processLines = process?.lines ?? [];
    for (const [key, elements] of Array.from(lines.entries())) {
      const first = elements.find((el) => el.preceding === "START");
      const last = elements.find(
        (el) => !elements.some((el1) => el1.preceding === el.pipe)
      );
      if (!first || !last) continue;
      const sv =
        first.params.valveType && first.params.valvePosition === "START";
      const ev = last.params.valveType && last.params.valvePosition === "END";
      let processPipe = processLines.find((pe) => pe.processLineNo === key);
      if (processPipe && processPipe.to) {
        const from = processElementsMap.get(processPipe.from);
        const to = processElementsMap.get(processPipe.to);

        if (!from || !to) continue;

        let startS: TProcessLineSegment | undefined;
        let endS: TProcessLineSegment | undefined;

        processPipe = {
          ...processPipe,
          segments: elements.map((el, id) => {
            const start = new Vector3(el.x1, el.y1, el.z1);
            const end = new Vector3(el.x2, el.y2, el.z2);
            const newS = {
              id,
              start,
              end,
              locked: true,
              parameters: {
                od: el.params.od,
                thickness: el.params.thickness,
                lib: el.params.lib,
                nps: el.params.nps,
                profile: el.params.profile,
                material: el.params.material,
                longWeldType: el.params.longWeldType,
                corrosionAllowance: el.params.corrosionAllowance,
                millTolerance: el.params.millTolerance,
                fluidDensity: el.params.fluidDensity,
                numberOfSupports: el.params.numberOfSupports,
                supportDetails: el.params.supportDetails,
                endConnectorType: el.params.endConnectorType,
                endConnector: el.params.endConnector,
                endConnectorDetails: el.params.endConnectorDetails,
                startFlangeType: el.params.startFlangeType,
                startFlangeClass: el.params.startFlangeClass,
                startFlange: el.params.startFlange,
                startFlangeLoads: el.params.startFlangeLoads,
                endFlangeType: el.params.endFlangeType,
                endFlangeClass: el.params.endFlangeClass,
                endFlange: el.params.endFlange,
                endFlangeLoads: el.params.endFlangeLoads,
                HP: el.params.HP,
                P1: el.params.P1,
                P2: el.params.P2,
                P3: el.params.P3,
                P4: el.params.P4,
                T1: el.params.T1,
                T2: el.params.T2,
                T3: el.params.T3,
                T4: el.params.T4,
                T5: el.params.T5,
                T6: el.params.T6,
                T7: el.params.T7,
                T8: el.params.T8,
                T9: el.params.T9,
              },
            };
            if (!startS) startS = newS;
            endS = newS;
            return newS;
          }),
        };

        if (!startS || !endS) continue;

        if (sv) {
          const firstDir = getDirection(
            new Vector3(first.x1, first.y1, first.z1),
            new Vector3(first.x2, first.y2, first.z1)
          );
          const name = `VALVE${getIndexName(
            Array.from(processElementsMap.values()),
            "VALVE"
          )}`;
          const valve: TProcessValve = {
            type: EProcessElementType.VALVE,
            name,
            tag: name,
            position: {
              x: startS.start.x,
              y: startS.start.y,
              z: startS.start.z,
            },
            rotationX: 0,
            rotation: getOrientationByDirection(firstDir as Direction2),
            rotationZ: 0,
            scale: 1,
            pointsConfig: { isVariable: false, min: 2 },
            points: [
              {
                id: 0,
                element: to.name,
                connectionType: "START",
                startPosition: new Vector3(),
                generalPosition: new Vector3(0.5),
              },
              {
                id: 1,
                element: from.name,
                connectionType: "END",
                startPosition: new Vector3(),
                generalPosition: new Vector3(-0.5),
              },
            ],
            parameters: {
              type: first.params.valveType,
              actuator: first.params.valveActuator,
              control: first.params.valveControl,
            },
            details: {
              flowCoefficient: 0,
              flowType: 0,
              massFlow: 0,
              position: 0,
              pressureDrop: 0,
              vaporFraction: 0,
            },
          };
          processElementsMap.set(valve.name, valve);
          processElementsMap.set(from.name, {
            ...from,
            points: from.points.map((p) =>
              p.connectionType === "START" && p.element === to.name
                ? { ...p, element: valve.name }
                : p
            ),
            position: {
              x: startS.start.x - from.scale / 2,
              y: startS.start.y,
              z: startS.start.z,
            },
          });
          processLines = [
            ...processLines,
            {
              id: getNextId(processLines),
              from: from.name,
              to: valve.name,
              type: "LINE",
              segments: [],
            },
          ];
          processPipe = { ...processPipe, from: valve.name };
        } else {
          processElementsMap.set(from.name, {
            ...from,
            position: {
              x: startS.start.x - from.scale / 2,
              y: startS.start.y,
              z: startS.start.z,
            },
          });
        }

        if (ev) {
          const lastDir = getDirection(
            new Vector3(last.x1, last.y1, last.z1),
            new Vector3(last.x2, last.y2, last.z1)
          );
          const name = `VALVE${getIndexName(
            Array.from(processElementsMap.values()),
            "VALVE"
          )}`;
          const valve: TProcessValve = {
            type: EProcessElementType.VALVE,
            name,
            tag: name,
            position: { x: endS.end.x, y: endS.end.y, z: endS.end.z },
            rotationX: 0,
            rotation: getOrientationByDirection(lastDir as Direction2),
            rotationZ: 0,
            scale: 1,
            pointsConfig: { isVariable: false, min: 2 },
            points: [
              {
                id: 0,
                element: to.name,
                connectionType: "START",
                startPosition: new Vector3(),
                generalPosition: new Vector3(0.5),
              },
              {
                id: 1,
                element: from.name,
                connectionType: "END",
                startPosition: new Vector3(),
                generalPosition: new Vector3(-0.5),
              },
            ],
            parameters: {
              type: last.params.valveType,
              actuator: last.params.valveActuator,
              control: last.params.valveControl,
            },
            details: {
              flowCoefficient: 0,
              flowType: 0,
              massFlow: 0,
              position: 0,
              pressureDrop: 0,
              vaporFraction: 0,
            },
          };
          processElementsMap.set(valve.name, valve);
          processElementsMap.set(to.name, {
            ...to,
            points: to.points.map((p) =>
              p.connectionType === "END" && p.element === from.name
                ? { ...p, element: valve.name }
                : p
            ),
            position: {
              x: endS.end.x + to.scale / 2,
              y: endS.end.y,
              z: endS.end.z,
            },
          });
          processPipe = { ...processPipe, to: valve.name };
          processLines = [
            ...processLines,
            {
              id: getNextId(processLines),
              from: valve.name,
              to: to.name,
              type: "LINE",
              segments: [],
            },
          ];
        } else {
          processElementsMap.set(to.name, {
            ...to,
            position: {
              x: endS.end.x + to.scale / 2,
              y: endS.end.y,
              z: endS.end.z,
            },
          });
        }

        processLines = processLines.map((pl) =>
          pl.id === processPipe?.id ? processPipe : pl
        );
      } else {
        const newPrev = sv
          ? `${EProcessElementType.VALVE}${getIndexName(
              Array.from(processElementsMap.values()),
              EProcessElementType.VALVE
            )}`
          : `${EProcessElementType.SOURCE}${getIndexName(
              Array.from(processElementsMap.values()),
              EProcessElementType.SOURCE
            )}`;
        const newNext = ev
          ? `${EProcessElementType.VALVE}${getIndexName(
              Array.from(processElementsMap.values()),
              EProcessElementType.VALVE
            )}`
          : `${EProcessElementType.SINK}${getIndexName(
              Array.from(processElementsMap.values()),
              EProcessElementType.SINK
            )}`;
        const firstDir = getDirection(
          new Vector3(first.x1, first.y1, first.z1),
          new Vector3(first.x2, first.y2, first.z1)
        );
        const lastDir = getDirection(
          new Vector3(last.x1, last.y1, last.z1),
          new Vector3(last.x2, last.y2, last.z1)
        );
        const processPrev: TProcessElement = sv
          ? ({
              type: EProcessElementType.VALVE,
              name: newPrev,
              position: { x: first.x1, y: first.y1, z: first.z1 },
              rotationX: 0,
              rotation: getOrientationByDirection(firstDir as Direction2),
              rotationZ: 0,
              scale: 1,
              pointsConfig: { isVariable: false, min: 2 },
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  element: newNext,
                  generalPosition: new Vector3(0.5),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-0.5),
                },
              ],
              details: {
                flowCoefficient: 0,
                flowType: 0,
                massFlow: 0,
                position: 0,
                pressureDrop: 0,
                vaporFraction: 0,
              },
              parameters: {
                type: last.params.valveType,
                actuator: last.params.valveActuator,
                control: last.params.valveControl,
              },
            } as TProcessValve)
          : ({
              type: EProcessElementType.SOURCE,
              name: newPrev,
              position: { x: first.x1 - 0.5, y: first.y1, z: first.z1 },
              rotationX: 0,
              rotation: 0,
              rotationZ: 0,
              scale: 1,
              pointsConfig: { isVariable: false, min: 1 },
              points: [
                {
                  id: 0,
                  isFixed: true,
                  connectionType: "START",
                  element: newNext,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0.5),
                },
              ],
              parameters: {},
            } as TProcessSource);
        const processNext: TProcessElement = ev
          ? ({
              type: EProcessElementType.VALVE,
              name: newNext,
              position: { x: last.x2, y: last.y2, z: last.z2 },
              rotationX: 0,
              rotation: getOrientationByDirection(lastDir as Direction2),
              rotationZ: 0,
              scale: 1,
              pointsConfig: { isVariable: false, min: 2 },
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0.5),
                },
                {
                  id: 1,
                  connectionType: "END",
                  element: newPrev,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-0.5),
                },
              ],
              details: {
                flowCoefficient: 0,
                flowType: 0,
                massFlow: 0,
                position: 0,
                pressureDrop: 0,
                vaporFraction: 0,
              },
              parameters: {
                type: last.params.valveType,
                actuator: last.params.valveActuator,
                control: last.params.valveControl,
              },
            } as TProcessValve)
          : ({
              type: EProcessElementType.SINK,
              name: newNext,
              position: { x: last.x2 + 0.5, y: last.y2, z: last.z2 },
              rotationX: 0,
              rotation: 0,
              rotationZ: 0,
              scale: 1,
              pointsConfig: { isVariable: false, min: 1 },
              points: [
                {
                  id: 0,
                  isFixed: true,
                  connectionType: "END",
                  element: newPrev,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-0.5),
                },
              ],
            } as TProcessSink);

        processElementsMap.set(newPrev, processPrev);
        processElementsMap.set(newNext, processNext);
        processLines.push({
          id: getNextId(processLines),
          processLineNo: key,
          pipelineNo: key,
          from: newPrev,
          to: newNext,
          type: "PIPE",
          parameters: { type: "Process Flow Line" },
          segments: elements.map((el, id) => {
            const start = new Vector3(el.x1, el.y1, el.z1);
            const end = new Vector3(el.x2, el.y2, el.z2);
            const newS = {
              id,
              start,
              end,
              locked: true,
              parameters: {
                od: el.params.od,
                thickness: el.params.thickness,
                lib: el.params.lib,
                nps: el.params.nps,
                profile: el.params.profile,
                material: el.params.material,
                longWeldType: el.params.longWeldType,
                corrosionAllowance: el.params.corrosionAllowance,
                millTolerance: el.params.millTolerance,
                fluidDensity: el.params.fluidDensity,
                numberOfSupports: el.params.numberOfSupports,
                supportDetails: el.params.supportDetails,
                endConnectorType: el.params.endConnectorType,
                endConnector: el.params.endConnector,
                endConnectorDetails: el.params.endConnectorDetails,
                startFlangeType: el.params.startFlangeType,
                startFlangeClass: el.params.startFlangeClass,
                startFlange: el.params.startFlange,
                startFlangeLoads: el.params.startFlangeLoads,
                endFlangeType: el.params.endFlangeType,
                endFlangeClass: el.params.endFlangeClass,
                endFlange: el.params.endFlange,
                endFlangeLoads: el.params.endFlangeLoads,
                HP: el.params.HP,
                P1: el.params.P1,
                P2: el.params.P2,
                P3: el.params.P3,
                P4: el.params.P4,
                T1: el.params.T1,
                T2: el.params.T2,
                T3: el.params.T3,
                T4: el.params.T4,
                T5: el.params.T5,
                T6: el.params.T6,
                T7: el.params.T7,
                T8: el.params.T8,
                T9: el.params.T9,
              },
            };
            return newS;
          }),
        });
      }
    }
    return {
      elements: processElementsMap,
      lines: processLines,
      analysis: process?.analysis ?? initialProcess.analysis,
    } as TProcess;
  }

  return (
    <>
      <CustomDlg
        title={"P&ID View"}
        isMinimize={true}
        body={
          <div className="d-flex f-grow f-column bg-dark">
            <div
              className="label-light bg-dark d-flex f-ai-center"
              style={{ paddingRight: 10 }}
            >
              <Popover
                position={"bottom"}
                content={
                  <div className={"d-flex f-column p-5"}>
                    <Button
                      small
                      text="to SVG"
                      intent="success"
                      onClick={() => toSVG(canvas, "P&ID")}
                    />
                    <Button
                      small
                      text="to PNG"
                      intent="success"
                      onClick={() => toPNG(canvas, "P&ID")}
                    />
                    <Button
                      small
                      text="to PDF"
                      intent="success"
                      disabled={true}
                    />
                    <Button
                      small
                      text="to DXF"
                      intent="success"
                      onClick={() => toDXF(canvas, "P&ID")}
                    />
                  </div>
                }
                target={
                  <Button small icon="export" text="Export" intent="success" />
                }
              />

              <Button
                small
                text="Titles Block"
                intent="danger"
                onClick={() => {
                  setDlg(
                    <TitlesDlg
                      current={current}
                      onClose={() => setDlg(undefined)}
                    />
                  );
                }}
              />

              <div className="t-end w-80">Size:</div>
              <FormGroup className="no-m w-150">
                <SimpleSelector<TSize>
                  items={sizes}
                  selected={size}
                  onSelect={(value) => value && setSize(value)}
                  itemLabel={(item) => item.label}
                  className="fill-select"
                />
              </FormGroup>
              <div className="t-end w-80">Scale:</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<TScale>
                  items={scales}
                  selected={scale}
                  onSelect={(val) => val && setScale(val)}
                  onCreate={(val) =>
                    Number(val.split(":")[1] ?? val.split(":")[0]) || 2
                  }
                  filter={(query, item) =>
                    query ? `${item}`.includes(query) : true
                  }
                  itemLabel={(item) => `1:${item}`}
                  className="fill-select"
                />
              </FormGroup>

              <div className="t-end w-80">Type:</div>
              <FormGroup className="no-m w-120">
                <SimpleSelector<"PLANE" | "ISOMETRIC">
                  items={["PLANE", "ISOMETRIC"]}
                  itemLabel={(item) => item}
                  selected={type}
                  onSelect={(val) => val && setType(val)}
                  className="fill-select"
                />
              </FormGroup>

              {type === "ISOMETRIC" ? (
                <>
                  <div className="t-end w-80">View:</div>
                  <FormGroup className="no-m w-80">
                    <SimpleSelector<TView>
                      items={views}
                      itemLabel={(item) => item}
                      selected={view}
                      onSelect={(val) => val && setView(val)}
                      className="fill-select"
                    />
                  </FormGroup>
                </>
              ) : null}

              <FormGroup className="no-m w-80">
                <Button
                  small
                  text={
                    mode === "PROCESS" || mode === "DESIGNER"
                      ? "To Piping"
                      : "To Process"
                  }
                  intent={"danger"}
                  onClick={handleExportToPiping}
                />
              </FormGroup>
            </div>
            <div className={"hr"} />
            <div
              className={"d-flex f-grow"}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                id={"svg-container"}
                key={`${scale}-${size.label}`}
                ref={container}
                className={"p-5"}
                style={{
                  position: "relative",
                  overflow: "auto",
                  maxHeight: "65vh",
                  maxWidth: "80vw",
                }}
              />
            </div>
          </div>
        }
        onClose={onClose}
      />
      {dlg}
    </>
  );
}
