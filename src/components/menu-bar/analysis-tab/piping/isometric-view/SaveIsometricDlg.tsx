import React, { useEffect, useState } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { TResult, TRow, TView, TSize, TScale } from "./isometricTypes";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { views, drawLines } from "./isometricUtils";
import { SVG, Svg } from "@svgdotjs/svg.js";
import { Button } from "@blueprintjs/core";
import { saveToFile } from "../../../../3d-models/utils";
import Canvg, { presets } from "canvg";
import { API_ROOT } from "../../../../../pages/utils/agent";
import Axios from "axios";
import saveAs from "file-saver";
import jsPDF from "jspdf";

type Props = {
  type: "SVG" | "PNG" | "PDF" | "DXF";
  size: TSize;
  scale: TScale;
  rows: TRow[];
  results: Map<number, TResult[]>;
  onClose: () => any;
};

export function SaveIsometricDlg({
  type,
  size,
  scale,
  rows,
  results,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<TRow[]>([]);

  useEffect(() => {
    setSelected(rows);
  }, []);

  function handleChangeRow(row: TRow, field: string, value: any) {
    const changed = { ...row, [field]: value };
    setSelected(rows.map((r) => (r.line === changed.line ? changed : r)));
  }

  function handleExport() {
    for (const row of selected) {
      if (!row.selected || !row.view) continue;
      const res = results.get(row.line)?.find((res) => res.view === row.view);
      if (!res) return;
      const svg = SVG().size(size.width * 2, size.height * 2);
      drawLines(svg, row.view, res.lines, size, scale, row);

      switch (type) {
        case "SVG":
          toSVG(svg, row);
          break;
        case "PNG":
          toPNG(svg, row);
          break;
        case "PDF":
          toPDF(svg, row);
          break;
        case "DXF":
          toDXF(svg, row);
      }
    }
  }

  function toSVG(svg: Svg, row: TRow) {
    const data = svg.svg();
    saveToFile(
      data,
      `Isometric ${row.view} View of ${row.line}`,
      type.toLowerCase(),
      "image/svg+xml;charset=utf-8"
    );
  }

  async function toPNG(svg: Svg, row: TRow) {
    const canvas = new OffscreenCanvas(
      svg.width() as number,
      svg.height() as number
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // @ts-ignore
    const v = await Canvg.from(ctx, svg.svg(), presets.offscreen());
    await v.render();
    const blob = await canvas.convertToBlob();
    saveAs(blob, `Isometric ${row.view} View of ${row.line}.png`);
  }
  async function toPDF(svg: Svg, row: TRow) {
    const canvas = new OffscreenCanvas(
      svg.width() as number,
      svg.height() as number
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // @ts-ignore
    const v = await Canvg.from(ctx, svg.svg(), presets.offscreen());
    await v.render();

    const blob = await canvas.convertToBlob();
    if (blob) {
      // Create PDF
      //@ts-ignore
      const pdf = new jsPDF("l", "pt", [
        svg.width() as number,
        svg.height() as number,
      ]);
      const imgData = URL.createObjectURL(blob);
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        svg.width() as number,
        svg.height() as number
      );
      pdf.save(`Isometric ${row.view} View of ${row.line}.pdf`);
      URL.revokeObjectURL(imgData);
    }
  }
  async function toDXF(svg: Svg, row: TRow) {
    const canvas = new OffscreenCanvas(
      svg.width() as number,
      svg.height() as number
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const formData = new FormData();
    const data = svg.svg();
    const file = new File([data], "input.svg", {
      type: "image/svg+xml;charset=utf-8",
    });
    formData.append("input", file);
    formData.append("domain", API_ROOT);
    Axios.post(`${API_ROOT}/api/v2/svgtodxf`, formData)
      .then((res) => {
        return Axios.get(res.data, { responseType: "blob" });
      })
      .then((res) => {
        saveAs(res.data, `${row.line} - ${row.view}.dxf`);
      })
      .catch((err) => console.error(err));
  }

  return (
    <CustomDlg
      title={`Export To ${type}`}
      isMinimize={true}
      position={"center"}
      zIndex={3}
      body={
        <div
          className={"d-flex f-grow"}
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div className="p-5">
            <div className="table-container">
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell
                      data={selected}
                      onChange={setSelected}
                    />
                    <th className={"w-150"}>Line No.</th>
                    <th className={"w-150"}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((row) => (
                    <tr key={row.line}>
                      <CheckBoxCell
                        key={row.line}
                        value={row.selected}
                        onChange={(value) =>
                          handleChangeRow(row, "selected", value)
                        }
                      />
                      <td>{row.line}</td>
                      <SelectorCell<TView>
                        items={views}
                        selected={row.view}
                        itemKey={(item) => item}
                        itemLabel={(item) => item}
                        onSelect={(value) =>
                          handleChangeRow(row, "view", value)
                        }
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
      actions={
        <>
          <Button
            small
            icon="export"
            text="Export"
            intent="success"
            onClick={handleExport}
          />
        </>
      }
      onClose={onClose}
    />
  );
}
