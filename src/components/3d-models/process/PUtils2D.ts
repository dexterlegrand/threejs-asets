import { Svg } from "@svgdotjs/svg.js";
import { Vector2, Vector3 } from "three";
import {
  round,
  getPosByDistance2D,
  degToRad,
  saveToFile,
  checkRange,
  roundM,
  radToDeg,
} from "../utils";
import {
  TSize,
  TScale,
  TView,
  TQuarter,
} from "../../menu-bar/analysis-tab/piping/isometric-view/isometricTypes";
import * as TYPES from "../../../store/process/types";
import { deg45InRad, deg30InRad } from "../../../store/main/constants";
import Axios from "axios";
import { API_ROOT } from "../../../pages/utils/agent";
import saveAs from "file-saver";

function clearSvg(svg: Svg) {
  svg.clear();
  svg.rect(svg.width() as number, svg.height() as number).fill("#ddd");
}

function drawBorder(
  svg: Svg,
  size: TSize,
  scale: TScale,
  titles: TYPES.TProcessTitles,
  revisions: TYPES.TProcessRevision[]
) {
  const w = svg.width() as number;
  const h = svg.height() as number;

  const LT = new Vector2(20, 10);
  const RT = new Vector2(w - 10, 10);
  const RB = new Vector2(w - 10, h - 10);
  const LB = new Vector2(20, h - 10);

  drawLine(svg, LT, RT, 4);
  drawLine(svg, RT, RB, 4);
  drawLine(svg, RB, LB, 4);
  drawLine(svg, LB, LT, 4);

  const tw = w / 4;
  const th = h / 4;
  const rh = th / 8;

  const tw_7 = tw / 7;
  const tw_7_2 = tw_7 / 2;
  const rh_2 = rh / 2;

  const tTL = new Vector2(RB.x - tw, RB.y - th);
  const tTR = new Vector2(RB.x, RB.y - th);
  const tBL = new Vector2(RB.x - tw, RB.y);

  const r1 = new Vector2((tTL.x + tTR.x) / 2, tTL.y + rh_2);
  const r2 = new Vector2((tTL.x + tTR.x) / 2, tTL.y + rh + rh_2);
  const r3 = new Vector2((tTL.x + tTR.x - tw_7) / 2, tTL.y + rh * 2 + rh_2);

  const r4a = new Vector2(tTL.x + tw_7_2, tTL.y + rh * 3 + rh_2);
  const r4b = new Vector2(r4a.x + tw_7, r4a.y);

  const r5a = new Vector2(tTL.x + tw_7_2, tTL.y + rh * 4 + rh_2);
  const r5b = new Vector2(r5a.x + tw_7, r5a.y);

  const r6a = new Vector2(tTL.x + tw_7_2, tTL.y + rh * 5 + rh_2);
  const r6b = new Vector2(r6a.x + tw_7, r6a.y);
  const r6c = new Vector2(r6a.x + tw_7 * 2, r6a.y);
  const r6d = new Vector2(r6a.x + tw_7 * 3 - tw_7_2 / 2, r6a.y);
  const r6e = new Vector2(r6a.x + tw_7 * 3 + tw_7_2 / 2, r6a.y);
  const r6f = new Vector2(r6a.x + tw_7 * 5 - tw_7_2 / 2, r6a.y);
  const r6g = new Vector2(tTR.x - tw_7_2 / 2, r6a.y);

  const r7a = new Vector2(tTL.x + tw_7_2, tTL.y + rh * 6 + rh_2);
  const r7b = new Vector2(r7a.x + tw_7, r7a.y);

  const r7_8a = new Vector2(r6c.x, tBL.y - rh);
  const r7_8b = new Vector2(r6d.x, r7_8a.y);
  const r7_8c = new Vector2(r6e.x, r7_8a.y);
  const r7_8d = new Vector2(r6f.x, r7_8a.y);
  const r7_8e = new Vector2(r6g.x, r7_8a.y);

  const r8a = new Vector2(tTL.x + tw_7_2, tTL.y + rh * 7 + rh_2);
  const r8b = new Vector2(r8a.x + tw_7, r8a.y);

  const r4_5 = new Vector2(tTL.x + tw_7 * 4, tTL.y + rh * 4);
  const halfWidth = tTL.distanceTo(tTR) / 2; // Half the width of the top area to split into two sections.

  drawRectangle(svg, new Vector2(r1.x - halfWidth / 2, r1.y), halfWidth, rh);
  drawText(
    svg,
    `PROJECT: ${titles.project ?? ""}`,
    new Vector2(tTL.x + 2, r1.y),
    {
      position: "VC",
      size: 6,
      maxWidth: halfWidth - 4, // Provide some padding or adjust according to your needs
    }
  );

  drawRectangle(svg, new Vector2(r1.x + halfWidth / 2, r1.y), halfWidth, rh);
  drawText(
    svg,
    `CREATED BY: ${titles.createdBy ?? ""}`,
    new Vector2(r1.x, r1.y),
    {
      position: "VC",
      size: 6,
      // maxWidth: halfWidth - 4, // Provide some padding or adjust according to your needs
    }
  );

  drawRectangle(svg, r2, tTL.distanceTo(tTR), rh);
  drawText(
    svg,
    `CUSTOMER: ${titles.customer ?? ""}`,
    new Vector2(tTL.x + 2, r2.y),
    {
      position: "VC",
      size: 6,
    }
  );

  drawRectangle(svg, r3, tTL.distanceTo(tTR) - tw_7, rh);
  drawText(svg, `TITLE: ${titles.title ?? ""}`, new Vector2(tTL.x + 2, r3.y), {
    position: "VC",
    size: 6,
  });

  drawRectangle(svg, r4a, tw_7, rh);
  drawText(svg, `DRAWN`, new Vector2(tTL.x + 2, r4a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r4b, tw_7, rh);
  drawText(svg, titles.drawn ?? "", new Vector2(tTL.x + tw_7 + 2, r4a.y), {
    position: "VC",
    size: 6,
  });

  drawRectangle(svg, r4_5, tw_7 * 4, rh * 2);

  drawRectangle(svg, r5a, tw_7, rh);
  drawText(svg, `CHECKED`, new Vector2(tTL.x + 2, r5a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r5b, tw_7, rh);
  drawText(svg, titles.checked ?? "", new Vector2(tTL.x + tw_7 + 2, r5a.y), {
    position: "VC",
    size: 6,
  });

  drawRectangle(svg, r6a, tw_7, rh);
  drawText(svg, `APPROVED`, new Vector2(tTL.x + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6b, tw_7, rh);
  drawText(svg, titles.approved ?? "", new Vector2(tTL.x + tw_7 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6c, tw_7, rh);
  drawText(svg, "PROJECTION", new Vector2(tTL.x + tw_7 * 2 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6d, tw_7_2, rh);
  drawText(svg, " ", new Vector2(tTL.x + tw_7 * 3 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6e, tw_7_2, rh);
  drawText(svg, "SHEET", new Vector2(tTL.x + tw_7 * 3 + tw_7_2 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6f, tw_7 * 2.5, rh);
  drawText(svg, "DRAWING NO", new Vector2(tTL.x + tw_7 * 4 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r6g, tw_7_2, rh);
  drawText(svg, "REV.", new Vector2(tTR.x - tw_7_2 + 2, r6a.y), {
    position: "VC",
    size: 6,
  });

  drawRectangle(svg, r7a, tw_7, rh);
  drawText(svg, `DATE`, new Vector2(tTL.x + 2, r7a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r7b, tw_7, rh);
  drawText(
    svg,
    new Date().toUTCString(),
    new Vector2(tTL.x + tw_7 + 2, r7a.y),
    {
      position: "VC",
      size: 6,
    }
  );

  drawRectangle(svg, r7_8a, tw_7, rh * 2);
  drawRectangle(svg, r7_8b, tw_7_2, rh * 2);
  drawText(
    svg,
    size.label.split(" ")[0],
    new Vector2(tTL.x + tw_7 * 3 + 2, r7_8a.y),
    {
      position: "VC",
      size: 6,
    }
  );
  drawRectangle(svg, r7_8c, tw_7_2, rh * 2);
  drawRectangle(svg, r7_8d, tw_7 * 2.5, rh * 2);
  drawRectangle(svg, r7_8e, tw_7_2, rh * 2);

  drawRectangle(svg, r8a, tw_7, rh);
  drawText(svg, `SCALE`, new Vector2(tTL.x + 2, r8a.y), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, r8b, tw_7, rh);
  drawText(svg, titles.scale ?? "", new Vector2(tTL.x + tw_7 + 2, r8a.y), {
    position: "VC",
    size: 6,
  });

  const tw_6 = tw / 6;
  const tw_6_2 = tw_6 / 2;

  const elev = tBL.y - rh_2;

  const x1 = tBL.x - tw_6_2;
  const x1t = tBL.x - tw_6 + 2;
  const x2 = tBL.x - tw_6 - tw_6_2;
  const x2t = tBL.x - tw_6 * 2 + 2;
  const x3 = tBL.x - tw_6 * 2 - tw_6_2;
  const x3t = tBL.x - tw_6 * 3 + 2;
  const x4 = tBL.x - tw_6 * 6 - tw_6_2;
  const x4t = tBL.x - tw_6 * 7 + 2;
  const x5 = tBL.x - tw_6 * 10 - tw_6_2;
  const x5t = tBL.x - tw_6 * 11 + 2;
  const x6 = tBL.x - tw_6 * 11 - tw_6_2;
  const x6t = tBL.x - tw_6 * 12 + 2;

  drawRectangle(svg, new Vector2(x1, elev), tw_6, rh);
  drawText(svg, "APP. BY", new Vector2(x1t, elev), { position: "VC", size: 6 });
  drawRectangle(svg, new Vector2(x2, elev), tw_6, rh);
  drawText(svg, "CHKD. BY", new Vector2(x2t, elev), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, new Vector2(x3, elev), tw_6, rh);
  drawText(svg, "REV. BY", new Vector2(x3t, elev), { position: "VC", size: 6 });
  drawRectangle(svg, new Vector2(x4, elev), tw_6 * 7, rh);
  drawText(svg, "MODIFICATION", new Vector2(x4t, elev), {
    position: "VC",
    size: 6,
  });
  drawRectangle(svg, new Vector2(x5, elev), tw_6, rh);
  drawText(svg, "DATE", new Vector2(x5t, elev), { position: "VC", size: 6 });
  drawRectangle(svg, new Vector2(x6, elev), tw_6, rh);
  drawText(svg, "REV.", new Vector2(x6t, elev), { position: "VC", size: 6 });

  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i];
    const elev = tBL.y - rh_2 - rh * (i + 1);
    drawRectangle(svg, new Vector2(x1, elev), tw_6, rh);
    drawText(svg, rev.approvedBy ?? "", new Vector2(x1t, elev), {
      position: "VC",
      size: 6,
    });
    drawRectangle(svg, new Vector2(x2, elev), tw_6, rh);
    drawText(svg, rev.checkedBy ?? "", new Vector2(x2t, elev), {
      position: "VC",
      size: 6,
    });
    drawRectangle(svg, new Vector2(x3, elev), tw_6, rh);
    drawText(svg, rev.reviewedBy ?? "", new Vector2(x3t, elev), {
      position: "VC",
      size: 6,
    });
    drawRectangle(svg, new Vector2(x4, elev), tw_6 * 7, rh);
    drawText(svg, rev.modification ?? "", new Vector2(x4t, elev), {
      position: "VC",
      size: 6,
    });
    drawRectangle(svg, new Vector2(x5, elev), tw_6, rh);
    drawText(svg, rev.date ?? "", new Vector2(x5t, elev), {
      position: "VC",
      size: 6,
    });
    drawRectangle(svg, new Vector2(x6, elev), tw_6, rh);
    drawText(svg, rev.id + "", new Vector2(x6t, elev), {
      position: "VC",
      size: 6,
    });
  }
}

function getTextSizes(str: string, size: number) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  div.innerText = str;
  div.style.position = "absolute";
  div.style.height = "auto";
  div.style.width = "auto";
  div.style.whiteSpace = "nowrap";
  div.style.visibility = "hidden";
  div.style.fontSize = `${size}px`;
  div.style.fontFamily = "Arial";
  const height = div.clientHeight;
  const width = div.clientWidth;
  div.remove();
  return { width, height };
}

function drawText(
  svg: Svg,
  str: string,
  pos: Vector2 = new Vector2(),
  options?: any
) {
  const txt = svg.text(str ?? "");
  const fontSize = options?.size ?? 12;
  txt.font({ fill: options?.color ?? "#000", family: "Arial", size: fontSize });
  txt.move(pos.x, pos.y);
  const { width, height } = getTextSizes(str, fontSize);
  switch (options?.position) {
    case "C":
      txt.move(round(pos.x - width / 2), round(pos.y - height / 2));
      break;
    case "HC":
      txt.move(round(pos.x - width / 2), pos.y);
      break;
    case "VC":
      txt.move(pos.x, round(pos.y - height / 2));
      break;
    case "L":
      txt.move(pos.x - width, round(pos.y - height / 2));
      break;
    case "T":
      txt.move(round(pos.x - width / 2), pos.y - height);
      break;
    case "R":
      txt.move(pos.x + width, round(pos.y - height / 2));
      break;
    case "B":
      txt.move(round(pos.x - width / 2), pos.y);
      break;
    case "LT":
      txt.move(pos.x - width, pos.y - height);
      break;
    case "LB":
      txt.move(pos.x - width, pos.y);
      break;
    case "RT":
      txt.move(pos.x, pos.y - height);
      break;
    case "RB":
      txt.move(pos.x, pos.y + height);
      break;
  }
  txt.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  txt.rotate(options?.rotation ?? 0);
}

function convertMetersTo2D(value: number, ceof = 1) {
  return (value * 2000) / ceof;
}

function convertTo2D(v: Vector3) {
  const v2D = new Vector2(v.x, v.z)
    .multiplyScalar(1000)
    .multiplyScalar(2)
    .round();
  return v2D;
}

function fixV2D(
  center: Vector2,
  v2D: Vector2,
  coef: number,
  offsetX: number,
  offsetY: number
) {
  const v = v2D.clone();
  v.add(center);
  v.divideScalar(coef); // this is scale of canvas
  v.setX(offsetX + v.x);
  v.setY(offsetY + v.y);
  v.round();
  return v;
}

function drawLine(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  width = 1,
  dasharray?: string,
  lineType?: TYPES.TProcessPipeType | TYPES.TInstrumentationLineType,
  isPFD?: boolean,
  isPipe?: boolean,
  segment?: TYPES.TProcessLineSegment2D
) {
  const line = svg.line(start.x, start.y, end.x, end.y);
  if (lineType === "Pneumatic (Air) Line") {
    line.stroke({ width, color: "#000", linecap: "square" });
    const l = start.distanceTo(end);
    const l_2 = l / 2;
    let offset = 0;
    const coef = 30;
    const w2 = width * 2;
    while (offset < l_2) {
      if (offset) {
        const s = getPosByDistance2D(l_2 - offset, start, end);
        drawLine(
          svg,
          new Vector2(s.x - w2, s.y + w2),
          new Vector2(s.x, s.y - w2)
        );
        drawLine(
          svg,
          new Vector2(s.x, s.y + w2),
          new Vector2(s.x + w2, s.y - w2)
        );
        const e = getPosByDistance2D(l_2 + offset, start, end);
        drawLine(
          svg,
          new Vector2(e.x - w2, e.y + w2),
          new Vector2(e.x, e.y - w2)
        );
        drawLine(
          svg,
          new Vector2(e.x, e.y + w2),
          new Vector2(e.x + w2, e.y - w2)
        );
      } else {
        const pos = getPosByDistance2D(l_2, start, end);
        drawLine(
          svg,
          new Vector2(pos.x - w2, pos.y + w2),
          new Vector2(pos.x, pos.y - w2)
        );
        drawLine(
          svg,
          new Vector2(pos.x, pos.y + w2),
          new Vector2(pos.x + w2, pos.y - w2)
        );
      }
      offset += coef;
    }
  } else if (lineType === "Hydraulic Line") {
    line.stroke({
      width,
      color: "#000",
      linecap: "square",
      dasharray: "20 5 5 5",
    });
  } else if (lineType === "Inert gas line") {
    line.stroke({ width, color: "#000", linecap: "square" });
    const l = start.distanceTo(end);
    const l_2 = l / 2;
    let offset = 0;
    const coef = 30;
    const w2 = width * 2;
    while (offset < l_2) {
      if (offset) {
        const s = getPosByDistance2D(l_2 - offset, start, end);
        drawLine(
          svg,
          new Vector2(s.x - width, s.y + w2),
          new Vector2(s.x + width, s.y - w2)
        );
        const e = getPosByDistance2D(l_2 + offset, start, end);
        drawLine(
          svg,
          new Vector2(e.x - width, e.y + w2),
          new Vector2(e.x + width, e.y - w2)
        );
      } else {
        const pos = getPosByDistance2D(l_2, start, end);
        drawLine(
          svg,
          new Vector2(pos.x - width, pos.y + w2),
          new Vector2(pos.x + width, pos.y - w2)
        );
      }
      offset += coef;
    }
  } else if (lineType === "Instrument signal") {
    line.stroke({ width, color: "#000", linecap: "square", dasharray: "10 5" });
  } else if (lineType === "Instrument capillary") {
    line.stroke({ width, color: "#000", linecap: "square" });
    const l = start.distanceTo(end);
    const l_2 = l / 2;
    let offset = 0;
    const coef = 30;
    const w2 = width * 2;
    while (offset < l_2) {
      if (offset) {
        const s = getPosByDistance2D(l_2 - offset, start, end);
        drawLine(
          svg,
          new Vector2(s.x - w2, s.y - w2),
          new Vector2(s.x + w2, s.y + w2)
        );
        drawLine(
          svg,
          new Vector2(s.x - w2, s.y + w2),
          new Vector2(s.x + w2, s.y - w2)
        );
        const e = getPosByDistance2D(l_2 + offset, start, end);
        drawLine(
          svg,
          new Vector2(e.x - w2, e.y - w2),
          new Vector2(e.x + w2, e.y + w2)
        );
        drawLine(
          svg,
          new Vector2(e.x - w2, e.y + w2),
          new Vector2(e.x + w2, e.y - w2)
        );
      } else {
        const pos = getPosByDistance2D(l_2, start, end);
        drawLine(
          svg,
          new Vector2(pos.x - w2, pos.y - w2),
          new Vector2(pos.x + w2, pos.y + w2)
        );
        drawLine(
          svg,
          new Vector2(pos.x - w2, pos.y + w2),
          new Vector2(pos.x + w2, pos.y - w2)
        );
      }
      offset += coef;
    }
  } else if (lineType === "Electrical wires") {
    line.stroke({ width, color: "#000", linecap: "square", dasharray: "10 5" });
    const l = start.distanceTo(end);
    const l_2 = l / 2;
    let offset = 0;
    const coef = 30;
    while (offset < l_2) {
      if (offset) {
        drawCircle(
          svg,
          getPosByDistance2D(l_2 + offset, start, end),
          width * 2,
          true
        );
        drawCircle(
          svg,
          getPosByDistance2D(l_2 - offset, start, end),
          width * 2,
          true
        );
      } else
        drawCircle(svg, getPosByDistance2D(l_2, start, end), width * 2, true);
      offset += coef;
    }
  } else if (
    lineType === "Electric heat tracing" ||
    lineType === "Steam heat tracing"
  ) {
    line.stroke({ width, color: "#000", linecap: "square" });
    const txt = lineType[0];
    const l = start.distanceTo(end);
    const coef = 20;
    const coef_2 = coef / 2;
    let offset = 0;
    let isTxt = false;
    const fv2 = new Vector2(
      start.x === end.x ? coef_2 : 0,
      start.y === end.y ? coef_2 : 0
    );
    while (offset < l) {
      if (offset >= l) break;
      const s = getPosByDistance2D(offset, start, end).add(fv2);
      offset += coef;
      if (offset >= l) offset = l;
      const e = getPosByDistance2D(offset, start, end).add(fv2);
      offset += coef_2;
      if (isTxt) {
        drawText(
          svg,
          txt,
          s
            .add(e)
            .divideScalar(2)
            .add(fv2),
          { position: "T", size: coef_2 }
        );
      } else drawLine(svg, s, e);
      isTxt = !isTxt;
    }
  } else line.stroke({ width, color: "#000", linecap: "square", dasharray });
  if (isPFD && isPipe) {
    const length = start.distanceTo(end);
    const l = length / 10;
    const isX = start.x !== end.x;
    const w = (isX ? l : width * 5) / 2;
    const h = (isX ? width * 5 : l) / 2;
    const c = start
      .clone()
      .add(end)
      .divideScalar(2);
    const pipe = svg.polygon([
      [-w, -h],
      [w, -h],
      [w, h],
      [-w, h],
    ]);
    pipe.fill("#ddd");
    pipe.stroke({ width: 2, color: "#000" });
    if (segment && segment.quarter) {
      if (segment.view === "NE" || segment.view === "NW") {
        pipe.skew(
          0,
          segment.quarter === "LB" || segment.quarter === "RT" ? 30 : -30
        );
        pipe.flip("x");
      } else {
        pipe.skew(
          0,
          segment.quarter === "LB" || segment.quarter === "RT" ? -30 : 30
        );
      }
    }
    pipe.translate(c.x, c.y);
  }
  return line;
}

function drawArrow(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  deg = 15,
  length = 10
) {
  const s = start.clone();
  const e = end.clone();
  if (s.distanceTo(e) < 10) e.setX(e.x - 10);
  const v = getPosByDistance2D(length, s, e);
  const v1 = v
    .clone()
    .rotateAround(s, degToRad(deg))
    .round();
  const v2 = v
    .clone()
    .rotateAround(s, -degToRad(deg))
    .round();
  svg.polygon([s.x, s.y, v1.x, v1.y, v2.x, v2.y]).stroke({ width: 1 });
}

function drawCircle(
  svg: Svg,
  pos: Vector2,
  radius: number,
  isDark?: boolean,
  options?: any
) {
  const circle = svg.circle(radius * 2);
  circle.fill(isDark ? "#000" : "#ddd");
  circle.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    circle.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    circle.flip("x");
    circle.translate(pos.x + radius, pos.y - radius);
  } else {
    circle.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    circle.translate(pos.x - radius, pos.y - radius);
  }
  return circle;
}

function drawRectangle(
  svg: Svg,
  pos: Vector2,
  width: number,
  height: number,
  size = 2,
  options?: any
) {
  const rect = svg.rect(width, height);
  rect.fill("#ddd");
  size && rect.stroke({ width: size, color: "#000" });
  if (options?.flip) {
    rect.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    rect.flip("x");
    rect.translate(pos.x + width / 2, pos.y - height / 2);
  } else {
    rect.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    rect.translate(pos.x - width / 2, pos.y - height / 2);
  }
  return rect;
}

function drawTriangle(
  svg: Svg,
  pos: Vector2,
  width: number,
  height: number,
  is90?: boolean,
  options?: any
) {
  const w_2 = round(width / 2);
  const h_2 = round(height / 2);
  if (is90) {
    svg
      .polygon([
        pos.x - w_2,
        pos.y,
        pos.x + w_2,
        pos.y - h_2,
        pos.x + w_2,
        pos.y + h_2,
      ])
      .fill("#ddd")
      .stroke({ width: 2, color: "#000" })
      .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  } else {
    svg
      .polygon([
        pos.x,
        pos.y - h_2,
        pos.x - w_2,
        pos.y + h_2,
        pos.x + w_2,
        pos.y + h_2,
      ])
      .fill("#ddd")
      .stroke({ width: 2, color: "#000" })
      .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
}

function toSVG(svg: Svg, type: "PFD" | "P&ID") {
  const data = svg.svg();
  saveToFile(data, `${type} View`, "svg", "image/svg+xml;charset=utf-8");
}

async function toPNG(svg: Svg, type: "PFD" | "P&ID") {
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
  saveAs(blob, `${type} View.png`);
}

async function toDXF(svg: Svg, type: "PFD" | "P&ID") {
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
      saveAs(res.data, `${type}.dxf`);
    })
    .catch((err) => console.error(err));
}

function drawTank(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 2000 / scale;
  const height = 2000 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_10 = height / 10;

  const tank = svg.polygon([
    [l_2, -h_10],
    [-l_2, -h_10],
    [0, -h_2],
    [l_2, -h_10],
    [l_2, h_2],
    [-l_2, h_2],
    [-l_2, -h_10],
  ]);
  tank.fill("#ddd");
  tank.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    tank.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    tank.flip("x");
  } else {
    tank.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  tank.translate(pos.x, pos.y);
  return { length, height };
}

function drawPump(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const d = 1000 / scale;
  const d_2 = d / 2;
  const circle = svg.circle(d);
  circle.fill("#ddd");
  circle.stroke({ width: 2, color: "#000" });
  const line1 = svg
    .line([
      [0, -d_2],
      [d, -d_2],
    ])
    .stroke({ width: 2, color: "#000" });
  const line2 = svg
    .line([
      [0, 0],
      [-d, 0],
    ])
    .stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    circle.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    circle.flip("x");
    line1.rotate(-(options?.skewY ?? 0), 0, -d_2);
    line2.rotate(-(options?.skewY ?? 0, 0, 0));
  } else {
    circle.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    line1.rotate(options?.skewY ?? 0, 0, -d_2);
    line2.rotate(options?.skewY ?? 0, 0, 0);
  }
  circle.translate(pos.x - d_2, pos.y - d_2);
  line1.translate(pos.x, pos.y);
  line2.translate(pos.x, pos.y);
  return { length: d, height: d };
}

function drawDrum(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1200 / scale;
  const height = 2400 / scale;

  const l_2 = length / 2;
  const l_5 = length / 5;
  const h_2 = height / 2;
  const h_10 = height / 10;

  const drum = svg
    .polygon([
      [l_2 - l_5, -h_2],
      [l_2, -(h_2 - h_10)],
      [l_2, h_2 - h_10],
      [l_2 - l_5, h_2],
      [-(l_2 - l_5), h_2],
      [-l_2, h_2 - h_10],
      [-l_2, -(h_2 - h_10)],
      [-(l_2 - l_5), -h_2],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    drum.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    drum.flip("x");
  } else {
    drum.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  drum.translate(pos.x, pos.y);
  return { length, height };
}

function drawValve(
  svg: Svg,
  el: TYPES.TProcessValve,
  pos: Vector2,
  scale: number,
  options?: any
) {
  const length = 720 / scale;
  const height = 420 / scale;

  const l_2 = length / 2;
  const l_4 = l_2 / 2;
  const l_10 = length / 10;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  let isActuator = true;
  const rotation = !(el as any).view ? el.rotation : 0;
  if (el.parameters.type === "Globe Valve") {
    drawSimpleValve(svg, pos, scale, options, rotation);
    const circle = svg.circle(height);
    circle.fill("#000");
    circle.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      circle.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      circle.flip("x");
    } else {
      circle.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    circle.translate(pos.x - h_2, pos.y - h_2);
  } else if (el.parameters.type === "Gate Valve") {
    drawSimpleValve(svg, pos, scale, options, rotation);
    drawLine(
      svg,
      new Vector2(pos.x, pos.y - h_2),
      new Vector2(pos.x, pos.y + h_2),
      2
    ).rotate(rotation);
  } else if (el.parameters.type === "Ball Valve") {
    drawRectangle(svg, pos, length, height, 0, options);
    const valve = svg.polygon([
      [-l_2 + 2, 0],
      [-l_2 + 2, h_2],
      [-l_2, h_2],
      [-l_2, -h_2],
      [-l_2 + 2, -h_2],
      [-l_2 + 2, 0],
      [l_2 - 2, 0],
      [l_2 - 2, h_2],
      [l_2, h_2],
      [l_2, -h_2],
      [l_2 - 2, -h_2],
      [l_2 - 2, 0],
    ]);
    valve.fill("#000");
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
    drawCircle(svg, pos, h_2, false, options);
  } else if (el.parameters.type === "Needle Valve") {
    const valve = svg.polygon([
      [-l_2, -h_2],
      [-l_2, h_2],
      [0, 0],
      [0, -h_2],
      [-h_2, -h_2],
      [0, -height],
      [h_2, -h_2],
      [0, -h_2],
      [0, 0],
      [l_2, -h_2],
      [l_2, h_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
    isActuator = false;
  } else if (el.parameters.type === "Butterfly Valve") {
    drawRectangle(svg, pos, length, height, 0, options).rotate(rotation);
    const valve = svg.polygon([
      [-l_2, h_2],
      [-l_2, -h_2],
      [-l_2 + 2, -h_2],
      [-l_2 + 2, h_2],
      [-l_2 + h_4 + 2, h_2],
      [l_2 - h_4, -h_2],
      [l_2 - 2, -h_2],
      [l_2 - 2, h_2],
      [l_2, h_2],
      [l_2, -h_2],
      [l_2 - h_4 - 2, -h_2],
      [-l_2 + h_4, h_2],
    ]);
    valve.fill("#000");
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
  } else if (el.parameters.type === "Plug Valve") {
    const valve = svg.polygon([
      [-l_2, -h_2],
      [-l_2, 0],
      [0, h_2],
      [l_2, 0],
      [l_2, -h_2],
      [l_2, h_2],
      [l_2, 0],
      [0, -h_2],
      [-l_2, 0],
      [-l_2, h_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
  } else if (el.parameters.type === "Diaphragm Valve") {
    drawCircle(svg, pos, l_2, false, options).rotate(rotation);
    drawRectangle(
      svg,
      new Vector2(pos.x, pos.y + h_2),
      length,
      height + 4,
      0,
      options
    );
    // .rotate(el.rotation ?? 0, 0, 0);
    drawSimpleValve(svg, pos, scale, options, rotation);
  } else if (
    ([
      "Left Angle Valve",
      "Right Angle Valve",
      "Up Angle Valve",
      "Down Angle Valve",
    ] as any[]).includes(el.parameters.type)
  ) {
    const valve = svg.polygon([
      [0, 0],
      [l_2, -h_2],
      [l_2, h_2],
      [0, 0],
      [-h_2, l_2],
      [h_2, l_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
  } else if (el.parameters.type === "Relief Valve") {
    const valve = svg.polygon([
      [0, -height],
      [-l_4, -height],
      [l_4, -height],
      [0, -height],
      [0, -(h_2 + h_4)],
      [-l_4, -(h_2 + h_4)],
      [l_4, -(h_2 + h_4)],
      [0, -(h_2 + h_4)],
      [0, -h_2],
      [-l_4, -h_2],
      [l_4, -h_2],
      [0, -h_2],
      [0, 0],
      [l_2, -h_2],
      [l_2, h_2],
      [0, 0],
      [-l_4, l_2],
      [l_4, l_2],
      [0, 0],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
    isActuator = false;
  } else if (el.parameters.type === "Three-Way Valve") {
    const valve = svg.polygon([
      [0, 0],
      [-l_2, -h_2],
      [-l_2, h_2],
      [0, 0],
      [l_2, -h_2],
      [l_2, h_2],
      [0, 0],
      [-h_2, l_2],
      [h_2, l_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
  } else if (el.parameters.type === "Four-Way Valve") {
    const valve = svg.polygon([
      [0, 0],
      [-l_2, -h_2],
      [-l_2, h_2],
      [0, 0],
      [l_2, -h_2],
      [l_2, h_2],
      [0, 0],
      [-h_2, l_2],
      [h_2, l_2],
      [0, 0],
      [-h_2, -l_2],
      [h_2, -l_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    isActuator = false;
    valve.rotate(rotation);
  } else if (el.parameters.type === "Check Valve") {
    const valve = svg.polyline([
      [-l_2, h_2],
      [-l_2, -h_2],
      [l_2, h_2],
      [l_2, -h_2],
    ]);
    const line = svg.polyline([
      [-l_2, 0],
      [l_2, 0],
      [l_2 - l_10, -h_4 / 2],
      [l_2 - l_10, h_4 / 2],
      [l_2, 0],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    line.fill("#000");
    line.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      line.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
      line.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
      line.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    line.translate(pos.x, pos.y - height);
    valve.rotate(rotation);
    line.rotate(rotation, 0, height);
    isActuator = false;
  } else if (el.parameters.type === "Stop Check Valve") {
    const valve = svg.polyline([
      [-l_2, h_2],
      [-l_2, -h_2],
      [0, 0],
      [0, -l_2],
      [-h_2, -l_2],
      [h_2, -l_2],
      [0, -l_2],
      [0, 0],
      [l_2, h_2],
      [l_2, -h_2],
    ]);
    const line = svg.polyline([
      [-l_2, 0],
      [l_2, 0],
      [l_2 - l_10, -h_4 / 2],
      [l_2 - l_10, h_4 / 2],
      [l_2, 0],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    line.fill("#000");
    line.stroke({ width: 2, color: "#000" });
    drawCircle(
      svg,
      new Vector2(pos.x - l_2, pos.y - h_2),
      h_4 / 2,
      true,
      options
    ).rotate(rotation, l_2, h_2);

    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      line.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
      line.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
      line.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
    line.translate(pos.x, pos.y + height);
    line.rotate(rotation, 0, -height);

    isActuator = false;
  } else if (el.parameters.type === "Pressure Regulator") {
    drawCircle(
      svg,
      new Vector2(pos.x, pos.y - height),
      h_2,
      false,
      options
    ).rotate(rotation, 0, height);
    drawRectangle(
      svg,
      new Vector2(pos.x, pos.y - h_2),
      height,
      height,
      0,
      options
    ).rotate(rotation, 0, h_2);
    const valve = svg.polygon([
      [0, 0],
      [0, -height],
      [l_4, -height],
      [-(l_2 + l_4), -height],
      [-l_2, -h_2],
      [-l_2, h_2],
      [l_2, -h_2],
      [l_2, h_2],
      [-l_2, -h_2],
    ]);
    valve.fill("#ddd");
    valve.stroke({ width: 2, color: "#000" });
    if (options?.flip) {
      valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
      valve.flip("x");
    } else {
      valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
    }
    valve.translate(pos.x, pos.y);
    valve.rotate(rotation);
    isActuator = false;
  } else drawSimpleValve(svg, pos, scale, options, rotation);
  isActuator &&
    drawValveActuator(
      svg,
      el,
      pos,
      convertMetersTo2D(1, scale),
      options,
      rotation
    );
  // drawValveControl(svg, el, pos, d, options);
  return { length, height };
}

function drawSimpleValve(
  svg: Svg,
  pos: Vector2,
  scale: number,
  options: any,
  rotation: number
) {
  const length = 720 / scale;
  const height = 420 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;

  const valve = svg.polygon([
    [-l_2, -h_2],
    [-l_2, h_2],
    [l_2, -h_2],
    [l_2, h_2],
  ]);
  valve.fill("#ddd");
  valve.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    valve.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    valve.flip("x");
  } else {
    valve.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  valve.translate(pos.x, pos.y);
  valve.rotate(rotation ?? 0);
  return { length, height };
}

function drawValveActuator(
  svg: Svg,
  el: TYPES.TProcessValve,
  pos: Vector2,
  d: number,
  options: any,
  rotation: number
) {
  const d_2 = d / 2;
  const d_4 = d_2 / 2;
  const d_8 = d_4 / 2;
  const d_16 = d_8 / 2;
  if (el.parameters.actuator === "Manual") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_4), 2);
    drawLine(
      svg,
      new Vector2(pos.x - d_8, pos.y - d_4),
      new Vector2(pos.x + d_8, pos.y - d_4),
      2
    );
  } else if (el.parameters.actuator === "Diaphragm") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_4), 2);
    drawLine(
      svg,
      new Vector2(pos.x - d_8, pos.y - d_4),
      new Vector2(pos.x + d_8, pos.y - d_4),
      2
    );
    const center = new Vector2(pos.x, pos.y - d_4);
    const startPos = new Vector2(pos.x - d_8, pos.y - d_4);
    for (let i = 0; i < 4; i++) {
      const endPos = startPos.clone().rotateAround(center, deg45InRad);
      drawLine(svg, startPos, endPos, 2);
      startPos.copy(endPos);
    }
  } else if (el.parameters.actuator === "Alternative") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_4), 2);
    drawCircle(
      svg,
      new Vector2(pos.x, pos.y - d_4),
      d_8,
      false,
      options
    ).rotate(rotation);
    drawLine(
      svg,
      new Vector2(pos.x - d_8, pos.y - d_4),
      new Vector2(pos.x + d_8, pos.y - d_4),
      2
    );
  } else if (el.parameters.actuator === "Electric motor") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_4), 2);
    const center = new Vector2(pos.x, pos.y - (d_4 + d_8));
    drawRectangle(svg, center, d_4, d_4, 2, options).rotate(rotation);
    drawText(svg, "M", center, {
      position: "C",
      size: d_8 + d_16,
      skewX: options?.skewX,
      skewY: options?.skewY,
    });
  } else if (el.parameters.actuator === "Solenoid") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_4), 2);
    const center = new Vector2(pos.x, pos.y - (d_4 + d_8));
    drawRectangle(svg, center, d_4, d_4, 2, options).rotate(rotation);
    drawText(svg, "S", center, {
      position: "C",
      size: d_8 + d_16,
      skewX: options?.skewX,
      skewY: options?.skewY,
    });
  } else if (el.parameters.actuator === "Piston") {
    const center = new Vector2(pos.x, pos.y - (d_4 + d_8));
    drawRectangle(svg, center, d_4, d_4, 2, options).rotate(el.rotation);
    drawLine(svg, pos, center, 2);
    drawLine(
      svg,
      new Vector2(center.x - d_8, center.y),
      new Vector2(center.x + d_8, center.y),
      2
    );
  } else if (el.parameters.actuator === "Reachrod") {
    drawLine(svg, pos, new Vector2(pos.x, pos.y - d_8), 2);
    drawLine(
      svg,
      new Vector2(pos.x, pos.y - d_8),
      new Vector2(pos.x + d_4 + d_8, pos.y - (d_4 + d_8)),
      2
    );
    drawLine(
      svg,
      new Vector2(pos.x + d_4 + d_8, pos.y - (d_4 * 2 - d_16)),
      new Vector2(pos.x + d_4 + d_8, pos.y - (d_4 + d_16)),
      2
    );
  }
}

function drawTool(
  svg: Svg,
  name: string,
  pos: Vector2,
  d: number,
  options?: any
) {
  const d_2 = d / 2;
  const d_4 = d_2 / 2;
  const d_8 = d_4 / 2;
  drawCircle(svg, pos, d_4, false, options);
  drawText(svg, name, pos, {
    position: "C",
    size: d_8,
    skewX: options?.skewX,
    skewY: options?.skewY,
  });
}

function drawValveControl(
  svg: Svg,
  el: TYPES.TProcessValve,
  pos: Vector2,
  d: number,
  options?: any
) {
  const d_2 = d / 2;
  const d_4 = d_2 / 2;
  const d_8 = d_4 / 2;
  if (el.parameters.control) {
    const center = new Vector2(pos.x + d_2, pos.y - d_2);
    drawLine(svg, new Vector2(pos.x + d_4, pos.y - d_8), center, 2);
    drawCircle(svg, center, d_4, false, options);
    switch (el.parameters.control) {
      case "Flow":
        drawText(svg, "FCV", center, {
          position: "C",
          size: d_8,
          skewX: options?.skewX,
          skewY: options?.skewY,
        });
        break;
      case "Level":
        drawText(svg, "LCV", center, {
          position: "C",
          size: d_8,
          skewX: options?.skewX,
          skewY: options?.skewY,
        });
        break;
      case "Pressure":
        drawText(svg, "PCV", center, {
          position: "C",
          size: d_8,
          skewX: options?.skewX,
          skewY: options?.skewY,
        });
        break;
      case "Temperature":
        drawText(svg, "TCV", center, {
          position: "C",
          size: d_8,
          skewX: options?.skewX,
          skewY: options?.skewY,
        });
    }
  }
}

function drawSeparator(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 2400 / scale;
  const height = 1200 / scale;

  const l_2 = length / 2;
  const l_4 = l_2 / 2;
  const l_10 = length / 10;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;
  const h_10 = height / 10;

  const separator = svg.polygon([
    [l_4 + l_10, h_2],
    [l_4 + l_10, h_2 + h_10],
    [l_4 - l_10, h_2 + h_10],
    [l_4 - l_10, h_2],
    [l_2 - l_10, h_2],
    [l_2, h_4],
    [l_2, -h_4],
    [l_2 - l_10, -h_2],
    [-l_2 + l_10, -h_2],
    [-l_2, -h_4],
    [-l_2, h_4],
    [-l_2 + l_10, h_2],
  ]);
  separator.fill("#ddd");
  separator.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    separator.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    separator.flip("x");
  } else {
    separator.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  separator.translate(pos.x, pos.y);
  return { length, height };
}

function drawMix(svg: Svg, pos: Vector2, d: number, options?: any) {
  const d_3 = d / 3;
  const d_4 = d / 4;
  const mix = svg.polygon([
    [d_4, 0],
    [-d_4, d_3],
    [-d_4, -d_3],
  ]);
  mix.fill("#ddd");
  mix.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    mix.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    mix.flip("x");
  } else {
    mix.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  mix.translate(pos.x, pos.y);
}

function drawSplit(svg: Svg, pos: Vector2, d: number, options?: any) {
  const d_3 = d / 3;
  const d_4 = d / 4;
  const mix = svg.polygon([
    [-d_4, 0],
    [d_4, d_3],
    [d_4, -d_3],
  ]);
  mix.fill("#ddd");
  mix.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    mix.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    mix.flip("x");
  } else {
    mix.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  mix.translate(pos.x, pos.y);
}

function drawSource(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 960 / scale;
  const height = 480 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  const source = svg.polygon([
    [0, h_4],
    [0, -h_2],
    [l_2, 0],
    [0, h_2],
    [0, h_4],
    [-l_2, h_4],
    [-l_2, -h_4],
    [0, -h_4],
  ]);
  source.fill("#ddd");
  source.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    source.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    source.flip("x");
  } else {
    source.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  source.translate(pos.x, pos.y);
  return { length, height };
}

function drawSink(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 960 / scale;
  const height = 480 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  const sink = svg.polygon([
    [0, h_4],
    [0, -h_2],
    [-l_2, 0],
    [0, h_2],
    [0, h_4],
    [l_2, h_4],
    [l_2, -h_4],
    [0, -h_4],
  ]);
  sink.fill("#ddd");
  sink.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    sink.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    sink.flip("x");
  } else {
    sink.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  sink.translate(pos.x, pos.y);
  return { length, height };
}

function drawColumn(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1440 / scale;
  const height = 5000 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_10 = height / 10;

  const column = svg.polygon([
    [0, -h_2],
    [l_2, -h_2 + h_10],
    [l_2, h_2 - h_10],
    [0, h_2],
    [-l_2, h_2 - h_10],
    [-l_2, -h_2 + h_10],
  ]);
  column.fill("#ddd");
  column.stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    column.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    column.flip("x");
  } else {
    column.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  column.translate(pos.x, pos.y);
  return { length, height };
}

function drawExtractor(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1200 / scale;
  const height = 3600 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .line([
      [pos.x, pos.y + h_2],
      [pos.x, pos.y],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .rect(length, height)
    .move(pos.x - l_2, pos.y - h_2)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + length, pos.y - h_4],
      [pos.x, pos.y - h_4],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + length, pos.y],
      [pos.x, pos.y],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + length, pos.y + h_4],
      [pos.x, pos.y + h_4],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawExpander(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 700 / scale;
  const height = 700 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .polygon([
      [-l_2, -h_4],
      [-l_2, h_4],
      [l_2, h_2],
      [l_2, -h_2],
    ])
    .translate(pos.x, pos.y)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawCompressor(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 700 / scale;
  const height = 700 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .polygon([
      [-l_2, -h_2],
      [-l_2, h_2],
      [l_2, h_4],
      [l_2, -h_4],
    ])
    .translate(pos.x, pos.y)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawPSV(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 420 / scale;
  const height = 420 / scale;

  const l_2 = length / 2;
  const l_8 = l_2 / 4;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .polygon([
      [0, 0],
      [l_2, h_4],
      [l_2, -h_4],
      [0, 0],
      [-h_4, l_2],
      [h_4, l_2],
      [0, 0],
      [-l_8, -h_4],
      [l_8, -h_4 * 1.5],
      [-l_8, -h_2],
      [l_8, -h_4 * 1.5],
      [-l_8, -h_4],
    ])
    .translate(pos.x, pos.y)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawEnlarger(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 720 / scale;
  const height = 420 / scale;

  const l_2 = length / 2;
  const l_3 = length / 3;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  const enlarger = svg
    .polygon([
      [-l_2, -h_4],
      [-l_2 + l_3, -h_4],
      [l_2 - l_3, -h_2],
      [l_2, -h_2],
      [l_2, h_2],
      [l_2 - l_3, h_2],
      [-l_2 + l_3, h_4],
      [-l_2, h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" });
  if (options?.flip) {
    enlarger.skew(options?.skewX ?? 0, -(options?.skewY ?? 0));
    enlarger.flip("x");
  } else {
    enlarger.skew(options?.skewX ?? 0, options?.skewY ?? 0);
  }
  enlarger.translate(pos.x, pos.y);
  return { length, height };
}

function drawPFR(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 2400 / scale;
  const height = 1200 / scale;

  const l_2 = length / 2;
  const l_10 = length / 10;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .polygon([
      [pos.x - l_2, pos.y - h_4],
      [pos.x - l_2 + l_10, pos.y - h_4],
      [pos.x - l_2 + l_10 * 2, pos.y - h_2],
      [pos.x + l_2 - l_10 * 2, pos.y - h_2],
      [pos.x + l_2 - l_10, pos.y - h_4],
      [pos.x + l_2, pos.y - h_4],
      [pos.x + l_2, pos.y + h_4],
      [pos.x + l_2 - l_10, pos.y + h_4],
      [pos.x + l_2 - l_10 * 2, pos.y + h_2],
      [pos.x - l_2 + l_10 * 2, pos.y + h_2],
      [pos.x - l_2 + l_10, pos.y + h_4],
      [pos.x - l_2, pos.y + h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x - l_2 + l_10 * 2, pos.y - h_2],
      [pos.x - (l_2 - l_10 * 2) / 2, pos.y + h_2],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x - (l_2 - l_10 * 2) / 2, pos.y - h_2],
      [pos.x, pos.y + h_2],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x, pos.y - h_2],
      [pos.x + (l_2 - l_10 * 2) / 2, pos.y + h_2],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + (l_2 - l_10 * 2) / 2, pos.y - h_2],
      [pos.x + l_2 - l_10 * 2, pos.y + h_2],
    ])
    .stroke({ width: 1, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawCSTR(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1400 / scale;
  const height = 1600 / scale;

  const l_2 = length / 2;
  const l_4 = l_2 / 2;
  const h_2 = height / 2;
  const h_3 = height / 3;
  const h_4 = h_2 / 2;

  svg
    .rect(length, h_2)
    .translate(pos.x - l_2, pos.y - h_4)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2, pos.y + h_4],
      [pos.x, pos.y + h_2],
      [pos.x + l_2, pos.y + h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x - l_4, pos.y - h_3],
      [pos.x + l_4, pos.y - h_3],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x, pos.y - h_3],
      [pos.x, pos.y - h_2],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawReactor(
  svg: Svg,
  pos: Vector2,
  scale: number,
  type:
    | TYPES.EProcessElementType.RE
    | TYPES.EProcessElementType.RC
    | TYPES.EProcessElementType.RG,
  options?: any
) {
  const length = 1200 / scale;
  const height = 2400 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .polygon([
      [pos.x - l_2, pos.y + h_4],
      [pos.x, pos.y + h_2],
      [pos.x + l_2, pos.y + h_4],
      [pos.x + l_2, pos.y - h_4],
      [pos.x, pos.y - h_2],
      [pos.x - l_2, pos.y - h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  drawText(svg, type, pos, {
    position: "C",
    size: h_4,
    skewX: options?.skewX,
    skewY: options?.skewY,
  });
  return { length, height };
}

function drawSTHE1P(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 2400 / scale;
  const height = 900 / scale;

  const l_2 = length / 2;
  const l_4 = l_2 / 2;
  const l_10 = length / 10;
  const h_2 = height / 2;
  const h_3 = height / 3;

  svg
    .line([
      [pos.x - l_4, pos.y + height],
      [pos.x - l_4, pos.y + h_2],
    ])
    .stroke({ width: 6, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + l_4, pos.y + height],
      [pos.x + l_4, pos.y + h_2],
    ])
    .stroke({ width: 6, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + l_4, pos.y - height],
      [pos.x + l_4, pos.y - h_2],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);

  svg
    .line([
      [pos.x - l_4 + l_10, pos.y + height],
      [pos.x - l_4 + l_10, pos.y + h_2],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2 + l_10, pos.y + h_2],
      [pos.x - l_2, pos.y + h_2 - h_3],
      [pos.x - l_2, pos.y - h_2 + h_3],
      [pos.x - l_2 + l_10, pos.y - h_2],
      [pos.x + l_2 - l_10, pos.y - h_2],
      [pos.x + l_2, pos.y - h_2 + h_3],
      [pos.x + l_2, pos.y + h_2 - h_3],
      [pos.x + l_2 - l_10, pos.y + h_2],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawSTHE2P(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 2400 / scale;
  const height = 900 / scale;

  const l_2 = length / 2;
  const l_4 = l_2 / 2;
  const l_10 = length / 10;
  const h_2 = height / 2;
  const h_3 = height / 3;

  svg
    .line([
      [pos.x + l_4, pos.y - height],
      [pos.x + l_4, pos.y - h_2],
    ])
    .stroke({ width: 6, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + l_4, pos.y + height],
      [pos.x + l_4, pos.y + h_2],
    ])
    .stroke({ width: 6, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x + l_4 - l_10, pos.y - height],
      [pos.x + l_4 - l_10, pos.y - h_2],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .line([
      [pos.x - l_4, pos.y + height],
      [pos.x - l_4, pos.y + h_2],
    ])
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2 + l_10, pos.y + h_2],
      [pos.x - l_2, pos.y + h_2 - h_3],
      [pos.x - l_2, pos.y - h_2 + h_3],
      [pos.x - l_2 + l_10, pos.y - h_2],
      [pos.x + l_2 - l_10, pos.y - h_2],
      [pos.x + l_2, pos.y - h_2 + h_3],
      [pos.x + l_2, pos.y + h_2 - h_3],
      [pos.x + l_2 - l_10, pos.y + h_2],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function drawHeater(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1100 / scale;
  const height = 1300 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .rect(length, h_2)
    .move(pos.x - l_2, pos.y - h_4)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2, pos.y + h_4],
      [pos.x, pos.y + h_2],
      [pos.x + l_2, pos.y + h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2, pos.y - h_4],
      [pos.x, pos.y - h_2],
      [pos.x + l_2, pos.y - h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  drawText(svg, "H", pos, {
    position: "C",
    size: h_4,
    skewX: options?.skewX,
    skewY: options?.skewY,
  });
  return { length, height };
}

function drawCooler(svg: Svg, pos: Vector2, scale: number, options?: any) {
  const length = 1100 / scale;
  const height = 1300 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_4 = h_2 / 2;

  svg
    .rect(length, h_2)
    .move(pos.x - l_2, pos.y - h_4)
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2, pos.y + h_4],
      [pos.x, pos.y + h_2],
      [pos.x + l_2, pos.y + h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  svg
    .polygon([
      [pos.x - l_2, pos.y - h_4],
      [pos.x, pos.y - h_2],
      [pos.x + l_2, pos.y - h_4],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  drawText(svg, "C", pos, {
    position: "C",
    size: h_4,
    skewX: options?.skewX,
    skewY: options?.skewY,
  });
  return { length, height };
}

function drawAbsorptionColumn(
  svg: Svg,
  pos: Vector2,
  scale: number,
  options?: any
) {
  const length = 1300 / scale;
  const height = 3900 / scale;

  const l_2 = length / 2;
  const h_2 = height / 2;
  const h_5 = height / 5;

  svg
    .polygon([
      [pos.x, pos.y - h_2],
      [pos.x + l_2, pos.y - h_2 + h_5],
      [pos.x + l_2, pos.y + h_2 - h_5],
      [pos.x, pos.y + h_2],
      [pos.x - l_2, pos.y + h_2 - h_5],
      [pos.x - l_2, pos.y - h_2 + h_5],
    ])
    .fill("#ddd")
    .stroke({ width: 2, color: "#000" })
    .skew(options?.skewX ?? 0, options?.skewY ?? 0);
  return { length, height };
}

function getQuarter(start: Vector2, end: Vector2): TQuarter {
  const angle = roundM(
    radToDeg(
      end
        .clone()
        .sub(start)
        .angle()
    )
  );
  if (angle === 0) return "R";
  if (angle === 90) return "T";
  if (angle === 180) return "L";
  if (angle === 270) return "B";
  if (checkRange(angle, 0, 90)) return "RB";
  if (checkRange(angle, 90, 180)) return "LB";
  if (checkRange(angle, 180, 270)) return "LT";
  return "RT";
}

function convertToIsometric2D(
  v: Vector3,
  view: TView,
  coef = 1,
  offsetX = 0,
  offsetY = 0
) {
  const v2D = new Vector2(0, v.y);

  const x = new Vector2();
  const z = new Vector2();

  switch (view) {
    case "NW":
      x.setX(-v.x);
      x.rotateAround(new Vector2(), -deg30InRad);
      z.setX(v.z);
      z.rotateAround(new Vector2(), deg30InRad);
      break;
    case "NE":
      x.setX(-v.x);
      x.rotateAround(new Vector2(), deg30InRad);
      z.setX(-v.z);
      z.rotateAround(new Vector2(), -deg30InRad);
      break;
    case "SE":
      x.setX(v.x);
      x.rotateAround(new Vector2(), -deg30InRad);
      z.setX(-v.z);
      z.rotateAround(new Vector2(), deg30InRad);
      break;
    case "SW":
      x.setX(v.x);
      x.rotateAround(new Vector2(), deg30InRad);
      z.setX(v.z);
      z.rotateAround(new Vector2(), -deg30InRad);
  }

  v2D.add(x);
  v2D.add(z);
  v2D
    .multiplyScalar(1000)
    .divideScalar(coef)
    .multiplyScalar(2); // this is scale of canvas

  v2D.setX(offsetX + v2D.x);
  v2D.setY(offsetY - v2D.y);

  return v2D;
}

function drawСompass(
  svg: Svg,
  view: TView,
  size = 1,
  coef = 100,
  offsetX = 60,
  offsetY = 50
) {
  const center = new Vector3();
  const lines = [
    { label: "UP", start: center, end: new Vector3(0, size), position: "T" },
    { label: "DN", start: center, end: new Vector3(0, -size), position: "B" },
    { label: "N", start: center, end: new Vector3(0, 0, -size) },
    { label: "E", start: center, end: new Vector3(size) },
    { label: "S", start: center, end: new Vector3(0, 0, size) },
    { label: "W", start: center, end: new Vector3(-size) },
  ];
  for (const line of lines) {
    const start2D = convertToIsometric2D(
      line.start,
      view,
      coef,
      offsetX,
      offsetY
    );
    const end2D = convertToIsometric2D(line.end, view, coef, offsetX, offsetY);
    drawLine(svg, start2D, end2D);
    const diff = end2D.clone().sub(start2D);
    const position =
      diff.x > 0 ? (diff.y < 0 ? "RT" : "RB") : diff.y < 0 ? "LT" : "LB";
    drawText(svg, line.label, end2D, { position: line.position || position });
    line.label === "N" && drawArrow(svg, end2D, start2D);
  }
}

export {
  clearSvg,
  drawBorder,
  getTextSizes,
  drawText,
  drawLine,
  drawCircle,
  drawRectangle,
  drawTriangle,
  drawArrow,
  convertTo2D,
  convertToIsometric2D,
  convertMetersTo2D,
  fixV2D,
  toSVG,
  toPNG,
  toDXF,
  drawSource,
  drawSink,
  drawTank,
  drawPump,
  drawDrum,
  drawValve,
  drawSeparator,
  drawMix,
  drawSplit,
  drawColumn,
  drawExtractor,
  drawExpander,
  drawCompressor,
  drawPSV,
  drawEnlarger,
  drawPFR,
  drawCSTR,
  drawReactor,
  drawSTHE1P,
  drawSTHE2P,
  drawHeater,
  drawCooler,
  drawAbsorptionColumn,
  drawСompass,
  getQuarter,
  drawTool,
};
