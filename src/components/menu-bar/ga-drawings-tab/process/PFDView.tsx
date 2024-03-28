import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Svg, SVG } from "@svgdotjs/svg.js";
import { Button, FormGroup, Popover } from "@blueprintjs/core";
import { ApplicationState } from "../../../../store";
import { TProcess2D } from "../../../../store/process/types";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { CustomDlg } from "../../../common/CustomDlg";
import {
  TScale,
  TSize,
  TView,
} from "../../analysis-tab/piping/isometric-view/isometricTypes";
import {
  sizes,
  scales,
  views,
} from "../../analysis-tab/piping/isometric-view/isometricUtils";
import {
  getPFDdata,
  drawPFD,
  getIsometricPFDdata,
} from "../../../3d-models/process/PFD";
import { TitlesDlg } from "./TitlesDlg";
import { toSVG, toPNG, toDXF } from "../../../3d-models/process/PUtils2D";

type Props = {
  onClose: () => any;
};

export function PFDView({ onClose }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();
  const [canvas, setCanvas] = useState<Svg>(SVG());
  const [size, setSize] = useState<TSize>(sizes[2]);
  const [scale, setScale] = useState<TScale>(scales[4]);
  const [data2D, setData2D] = useState<TProcess2D>();
  const [type, setType] = useState<"PLANE" | "ISOMETRIC">("PLANE");
  const [view, setView] = useState<TView>("SW");

  const container = useRef<HTMLDivElement>(null);

  const current = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const processes = useSelector((state: ApplicationState) => state.process);

  useEffect(() => {
    const process = processes.processes.get(current);
    if (!process) return;
    const svg = SVG();
    svg.size(size.width * 2, size.height * 2);
    svg.rect(svg.width() as number, svg.height() as number).fill("#ddd");
    setCanvas(svg);
    // const data = getPFDdata(process);
    // if (!data) return;
    // const newData = {
    //   elements: data.elements,
    //   lines: data.lines,
    //   titles: process.titles,
    //   revisions: process.revisions,
    // };
    // setData2D(newData);
    // drawPFD(canvas, scale, size, newData);
    // setScale(scales[4]);
  }, [process]);

  useEffect(() => {
    if (!data2D) return;
    drawPFD(canvas, scale, size, data2D);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [data2D, scale]);

  useEffect(() => {
    if (!data2D) return;
    canvas.size(size.width * 2, size.height * 2);
    drawPFD(canvas, scale, size, data2D);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [size]);

  useEffect(() => {
    const process = processes.processes.get(current);
    if (!process) return;
    const data =
      type === "PLANE"
        ? getPFDdata(process)
        : getIsometricPFDdata(process, view);
    if (!data) return;
    const newData: TProcess2D = {
      elements: data.elements,
      lines: data.lines,
      instrs2D: data.instrs2D,
      instrLines2D: data.instrLines2D,
      titles: process.titles,
      revisions: process.revisions,
    };
    setData2D(newData);
  }, [type, view, processes]);

  return (
    <>
      <CustomDlg
        title={"PFD View"}
        isMinimize={true}
        zIndex={1}
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
                      onClick={() => toSVG(canvas, "PFD")}
                    />
                    <Button
                      small
                      text="to PNG"
                      intent="success"
                      onClick={() => toPNG(canvas, "PFD")}
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
                      onClick={() => toDXF(canvas, "PFD")}
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
                  itemLabel={(item) => `1:${item}`}
                  selected={scale}
                  onSelect={(val) => val && setScale(val)}
                  onCreate={(val) =>
                    Number(val.split(":")[1] ?? val.split(":")[0]) || 2
                  }
                  filter={(query, item) =>
                    query ? `${item}`.includes(query) : true
                  }
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
