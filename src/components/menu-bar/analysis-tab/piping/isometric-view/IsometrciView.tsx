import React, { useMemo, useEffect, useState, useRef } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { FreePipe } from "../../../../../store/main/types";
import { Button, FormGroup, Popover } from "@blueprintjs/core";
import { SelectorCell } from "../../../../common/SelectorCell";
import { getCurrentProject } from "../../../../3d-models/utils";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  views,
  sizes,
  scales,
  generateView,
  getMaxView,
  drawLines,
} from "./isometricUtils";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { TRow, TView, TSize, TScale, TResult } from "./isometricTypes";
import { SVG, Svg } from "@svgdotjs/svg.js";
import { SaveIsometricDlg } from "./SaveIsometricDlg";

type Props = {
  onClose: () => any;
};

export function IsometricView(props: Props) {
  const { onClose } = props;

  const [dlg, setDlg] = useState<JSX.Element>();
  const [canvas, setCanvas] = useState<Svg>(SVG());
  const [rows, setRows] = useState<TRow[]>([]);
  const [size, setSize] = useState<TSize>(sizes[1]);
  const [scale, setScale] = useState<TScale>(scales[4]);
  const [viewResults, setViewResults] = useState<Map<number, TResult[]>>(
    new Map<number, TResult[]>()
  );

  const container = useRef<HTMLDivElement>(null);

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const lines = useMemo(() => {
    const map = new Map<number, FreePipe[]>();
    if (!project || !project.freePipes) return map;
    for (const pipe of project.freePipes) {
      const pipes = map.get(pipe.line) ?? [];
      map.set(pipe.line, [...pipes, pipe]);
    }
    return map;
  }, [project]);

  useEffect(() => {
    const svg = SVG();
    svg.size(size.width * 2, size.height * 2);
    svg.rect(svg.width() as number, svg.height() as number).fill("#ddd");
    setCanvas(svg);
  }, []);

  useEffect(() => {
    const map = new Map<number, any[]>();
    for (const [line, pipes] of Array.from(lines.entries())) {
      map.set(line, [
        generateView(views[0], pipes),
        generateView(views[1], pipes),
        generateView(views[2], pipes),
        generateView(views[3], pipes),
      ]);
    }
    setViewResults(map);
  }, [lines]);

  useEffect(() => {
    setRows(
      Array.from(lines.keys()).map((line) => ({
        selected: false,
        line,
        view: getMaxView(line, viewResults),
      }))
    );
  }, [lines, viewResults]);

  useEffect(() => {
    const selected = rows.find((r) => r.selected);
    if (!selected || !selected.view) return;
    const res = viewResults
      .get(selected.line)
      ?.find((res) => res.view === selected.view);
    if (!res) return;
    drawLines(canvas, selected.view, res.lines, size, scale, selected);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [scale]);

  useEffect(() => {
    canvas.size(size.width * 2, size.height * 2);
    const selected = rows.find((r) => r.selected);
    if (!selected || !selected.view) return;
    const res = viewResults
      .get(selected.line)
      ?.find((res) => res.view === selected.view);
    if (!res) return;
    drawLines(canvas, selected.view, res.lines, size, scale, selected);
    if (container.current) container.current.innerHTML = canvas.svg();
  }, [size]);

  function drawRows() {
    return rows.map((row) => (
      <tr key={row.line}>
        <CheckBoxCell
          key={row.line}
          value={row.selected}
          onChange={(value) => handleSelect(row, value)}
        />
        <td>{row.line}</td>
        <SelectorCell<TView>
          items={views}
          selected={row.view}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeView(row, value)}
        />
      </tr>
    ));
  }

  function handleChangeView(row: TRow, view?: TView) {
    const changed = { ...row, view };
    setRows(rows.map((r) => (r.line === changed.line ? changed : r)));
    if (changed.selected && changed.view) {
      const res = viewResults
        .get(changed.line)
        ?.find((res) => res.view === view);
      if (!res) return;
      if (scale !== res.scale) {
        setScale(res.scale);
      } else {
        drawLines(canvas, changed.view, res.lines, size, scale, changed);
        if (container.current) container.current.innerHTML = canvas.svg();
      }
    }
  }

  function handleSelect(row: TRow, selected: boolean) {
    const changed = { ...row, selected };
    setRows(
      rows.map((r) =>
        r.line === changed.line ? changed : { ...r, selected: false }
      )
    );
    if (selected && changed.view) {
      const res = viewResults
        .get(changed.line)
        ?.find((res) => res.view === changed.view);
      if (!res) return;
      if (scale !== res.scale) {
        setScale(res.scale);
      } else {
        drawLines(canvas, changed.view, res.lines, size, scale, changed);
        if (container.current) container.current.innerHTML = canvas.svg();
      }
    }
  }

  function handleOpenDlg(type: "SVG" | "PNG" | "PDF" | "DXF") {
    setDlg(
      <SaveIsometricDlg
        type={type}
        size={size}
        scale={scale}
        rows={rows}
        results={viewResults}
        onClose={() => setDlg(undefined)}
      />
    );
  }

  return (
    <>
      {dlg}
      <CustomDlg
        key={`${scale}-${size.label}`}
        title={"Isometric View"}
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
                      onClick={() => handleOpenDlg("SVG")}
                    />
                    <Button
                      small
                      text="to PNG"
                      intent="success"
                      onClick={() => handleOpenDlg("PNG")}
                    />
                    <Button
                      small
                      text="to PDF"
                      intent="success"
                      onClick={() => handleOpenDlg("PDF")}
                    />
                    <Button
                      small
                      text="to DXF"
                      intent="success"
                      onClick={() => handleOpenDlg("DXF")}
                    />
                  </div>
                }
                target={
                  <Button small icon="export" text="Export" intent="success" />
                }
              />

              <div className="t-end w-100">Size:</div>
              <FormGroup className="no-m w-150">
                <SimpleSelector<TSize>
                  items={sizes}
                  selected={size}
                  onSelect={(value) => value && setSize(value)}
                  itemLabel={(item) => item.label}
                  className="fill-select"
                />
              </FormGroup>
              <div className="t-end w-100">Scale:</div>
              <FormGroup className="no-m w-150">
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
            </div>
            <div className={"hr"} />
            <div
              className={"d-flex f-grow"}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div className="p-5">
                <div className="table-container">
                  <table className="table bg-gray">
                    <thead>
                      <tr>
                        <th></th>
                        <th className={"w-150"}>Line No.</th>
                        <th className={"w-150"}>View</th>
                      </tr>
                    </thead>
                    <tbody>{drawRows()}</tbody>
                  </table>
                </div>
              </div>
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
    </>
  );
}
