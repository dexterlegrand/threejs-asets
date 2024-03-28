import { Vector2, Vector3 } from "three";
import { FreePipe } from "../../../../../store/main/types";
import { deg30InRad, deg90InRad } from "../../../../../store/main/constants";
import {
  roundVectorM,
  getPosByDistance2D,
  radToDeg,
  roundM,
  checkRange,
  degToRad,
  convertToVector3,
} from "../../../../3d-models/utils";
import {
  TScale,
  TSize,
  TView,
  TLineType,
  TLine,
  TResult,
  TRow,
  TQuarter,
} from "./isometricTypes";
import { Svg } from "@svgdotjs/svg.js";
import {
  createJSONElbow,
  createJSONReturn,
  createJSONReducer,
  createJSONTee,
} from "../../../../3d-models/pipes/pipesUtils";
import { TISODataItem } from "../../../../../recoil/atoms/iso-atoms";

export const scales: TScale[] = [
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000,
  2000,
  5000,
  10000,
];

export const sizes: TSize[] = [
  { label: "A4 (210x297)", height: 210, width: 297 },
  { label: "A3 (297x420)", height: 297, width: 420 },
  { label: "A2 (420x594)", height: 420, width: 594 },
];
export const views: TView[] = ["NW", "NE", "SE", "SW"];

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

function drawLine(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  width = 1,
  dasharray?: string
) {
  const line = svg.line(start.x, start.y, end.x, end.y);
  line.stroke({ width, color: "#000", linecap: "square", dasharray });
}

function drawDot(svg: Svg, pos: Vector2, radius = 4) {
  const dot = svg.circle(radius * 2);
  dot.fill("#000");
  dot.move(pos.x - radius, pos.y - radius);
}

function drawText(
  svg: Svg,
  str: string,
  pos: Vector2 = new Vector2(),
  options?: any
) {
  const txt = svg.text(str);
  const fontSize = options?.size ?? 12;
  txt.font({ fill: options?.color ?? "#000", family: "Arial", fontSize });
  txt.move(pos.x, pos.y);
  const { width, height } = getTextSizes(str, fontSize);
  if (options?.position) {
    if (options.position === "T") {
      txt.move(pos.x - width / 2, pos.y - height);
    } else if (options.position === "B") {
      txt.move(pos.x - width / 2, pos.y);
    } else if (options.position === "LT") {
      txt.move(pos.x - width, pos.y - height);
    } else if (options.position === "LB") {
      txt.move(pos.x - width, pos.y);
    } else if (options.position === "RT") {
      txt.move(pos.x, pos.y - height);
    }
  }
  txt.skew(options?.skewX, options?.skewY);
  txt.rotate(options?.rotation);
}

function drawArrow(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  deg = 15,
  length = 10
) {
  const v = getPosByDistance2D(length, start, end);
  const v1 = v.clone().rotateAround(start, degToRad(deg));
  const v2 = v.clone().rotateAround(start, -degToRad(deg));
  svg.polygon([start.x, start.y, v1.x, v1.y, v2.x, v2.y]).stroke({ width: 1 });
}

function drawTracedLine(svg: Svg, start: Vector2, end: Vector2, width = 1) {
  drawLine(svg, start, end, width);
  const v = getPosByDistance2D(3, start, end);
  const vA1 = v.clone().rotateAround(start, deg90InRad);
  const vA2 = v.clone().rotateAround(start, -deg90InRad);
  drawLine(
    svg,
    start.clone().addScalar(3),
    end.clone().addScalar(3),
    width,
    "10,5"
  );
}

function drawJackettedLine(svg: Svg, start: Vector2, end: Vector2, width = 1) {
  drawLine(svg, start, end, width);
  const length = start.distanceTo(end) / 5;
  const vA = getPosByDistance2D(length, start, end);
  const vA1 = vA.clone().rotateAround(start, degToRad(15));
  const vA2 = vA.clone().rotateAround(start, -degToRad(15));
  const vB = getPosByDistance2D(length, end, start);
  const vB1 = vB.clone().rotateAround(end, degToRad(15));
  const vB2 = vB.clone().rotateAround(end, -degToRad(15));
  drawLine(svg, vA, vA1, width);
  drawLine(svg, vA1, vB1, width);
  drawLine(svg, vB1, vB, width);
  drawLine(svg, vB, vB2, width);
  drawLine(svg, vB2, vA2, width);
  drawLine(svg, vA2, vA, width);
}

function drawReducer(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  width = 1,
  isEcc?: boolean
) {
  const vA = getPosByDistance2D(3, start, end);
  const vA1 = vA.clone().rotateAround(start, deg90InRad);
  const vA2 = vA.clone().rotateAround(start, -deg90InRad);
  const vB = getPosByDistance2D(6, end, start);
  const vB1 = vB.clone().rotateAround(end, deg90InRad);
  const vB2 = vB.clone().rotateAround(end, -deg90InRad);
  drawLine(svg, vA1, vB2, width);
  drawLine(svg, vB2, vB1, width);
  drawLine(svg, vB1, vA2, width);
  drawLine(svg, vA2, vA1, width);
  if (isEcc) {
    const centerA = vA1
      .clone()
      .add(vB1)
      .divideScalar(2);
    const centerB = vA2
      .clone()
      .add(vB2)
      .divideScalar(2);
    drawDot(svg, centerA);
    drawDot(svg, centerB);
    const cA1 = getPosByDistance2D(-3, centerA, centerB);
    const cA2 = getPosByDistance2D(3, centerA, centerB);
    drawLine(svg, cA1, cA2, width);
    const cA1S = centerA.clone().rotateAround(cA2, deg90InRad);
    const cA2S = centerA.clone().rotateAround(cA2, -deg90InRad);
    drawLine(svg, cA1S, cA2S, width);
    const cB1 = getPosByDistance2D(-3, centerB, centerA);
    const cB2 = getPosByDistance2D(3, centerB, centerA);
    drawLine(svg, cB1, cB2, width);
    const cB1S = centerA.clone().rotateAround(cB2, deg90InRad);
    const cB2S = centerA.clone().rotateAround(cB2, -deg90InRad);
    drawLine(svg, cB1S, cB2S, width);
  }
}

function drawFlanges(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  line: TLine,
  width = 1
) {
  line.sFlange && drawFlange(svg, start, end, line.sFlange, width);
  line.eFlange && drawFlange(svg, end, start, line.eFlange, width);
}

function drawFlange(
  svg: Svg,
  start: Vector2,
  end: Vector2,
  type: string,
  width = 1
) {
  const v = getPosByDistance2D(width * 2, start, end);
  const vA = v.clone().rotateAround(start, deg90InRad);
  const vB = v.clone().rotateAround(start, -deg90InRad);
  drawLine(svg, vA, vB, width);
  if (["Threaded", "Slip On", "Ring Joint Facing"].includes(type)) {
    drawDot(svg, getPosByDistance2D(width, start, end));
  } else if (type === "Welding Neck") {
    drawDot(svg, getPosByDistance2D(width + 4, start, end));
  } else if (["Blind", "Socket Welding"].includes(type)) {
    const v1 = getPosByDistance2D(width + 2, start, end);
    const v2 = getPosByDistance2D(width * 2, v1, end);
    const v2A = v2.clone().rotateAround(v1, deg90InRad);
    const v2B = v2.clone().rotateAround(v1, -deg90InRad);
    drawLine(svg, v2A, v2B, width);
  } else if (type === "Lapped") {
    drawDot(svg, getPosByDistance2D(width + 10, start, end));
    const v1 = getPosByDistance2D(width + 2, start, end);
    const v2 = getPosByDistance2D(width * 4, v1, end);
    const v2A = v2.clone().rotateAround(v1, deg90InRad);
    const v2B = v2.clone().rotateAround(v1, -deg90InRad);
    drawLine(svg, v2A, v2B, width);
  }
}

function getType(pipe: any): TLineType {
  if (!pipe.isNotPipe) return "Pipe";
  if (pipe.isElbow) {
    if (pipe.params.endConnectorDetails.type === "BWE")
      // @ts-ignore
      return `${pipe.params.endConnector?.degree} Mitre Elbow`;
    if (pipe.params.endConnectorDetails.type === "BCSM")
      // @ts-ignore
      return `${pipe.params.endConnector?.degree} Mitre Elbow (3-Cut)`;
    if (pipe.params.endConnectorDetails.type === "BWSM")
      // @ts-ignore
      return `${pipe.params.endConnector?.degree} Mitre Elbow (2-Cut)`;
  }
  if (pipe.isTee) return "Tee Butt Weld";
  if (pipe.isReducer) {
    // @ts-ignore
    return `Reducer Conc. ${pipe.dir}`;
  }
  if (pipe.isReturn) return "90 Mitre Elbow (2-Cut)";
  return "Pipe";
}

function convertTo2D(
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

function getCrossV(
  startA: Vector2,
  endA: Vector2,
  startB: Vector2,
  endB: Vector2
) {
  const delta =
    (endA.x - startA.x) * (startB.y - endB.y) -
    (startB.x - endB.x) * (endA.y - startA.y);
  if (!delta) return undefined;
  const a =
    ((startB.x - startA.x) * (startB.y - endB.y) -
      (startB.x - endB.x) * (startB.y - startA.y)) /
    delta;
  const v = new Vector2(
    (1 - a) * startA.x + a * endA.x,
    (1 - a) * startA.y + a * endA.y
  );
  return v;
}

function getQuarter(angle: number): TQuarter {
  if (angle === 0) return "R";
  if (angle === 90) return "T";
  if (angle === 180) return "L";
  if (angle === 270) return "B";
  if (checkRange(angle, 0, 90)) return "RB";
  if (checkRange(angle, 90, 180)) return "LB";
  if (checkRange(angle, 180, 270)) return "LT";
  return "RT";
}

export function clearSvg(svg: Svg) {
  svg.clear();
  svg.rect(svg.width() as number, svg.height() as number).fill("#ddd");
}

function drawBorder(svg: Svg, size: TSize, scale: TScale, row?: TRow) {
  const LT = new Vector2(20, 10);
  const RT = new Vector2((svg.width() as number) - 10, 10);
  const RB = new Vector2(
    (svg.width() as number) - 10,
    (svg.height() as number) - 10
  );
  const LB = new Vector2(20, (svg.height() as number) - 10);

  let lineSize;
  if (row) {
    lineSize = getTextSizes(`Line No: ${row.line}`, 12);
  }
  const sizeSize = getTextSizes(`Size: ${size.label.split(" ")[0]}`, 12);
  const scaleSize = getTextSizes(`Scale: 1:${scale}`, 12);

  const maxW = lineSize
    ? Math.max(
        lineSize.width,
        Math.max(sizeSize.width, scaleSize.width) * 2 + 20
      )
    : Math.max(sizeSize.width, scaleSize.width) * 2 + 20;

  const LBsB = new Vector2(RB.x - (maxW + 40), RB.y);
  const LTsB = new Vector2(LBsB.x, RB.y - (sizeSize.height + 10));
  const RTsB = new Vector2(RB.x, RB.y - (sizeSize.height + 10));
  const MBsB = new Vector2(RB.x - (maxW + 40) / 2, RB.y);
  const MTsB = new Vector2(MBsB.x, LTsB.y);

  svg
    .rect(maxW + 40, sizeSize.height)
    .fill("#ddd")
    .move(LTsB.x, LTsB.y);

  drawLine(svg, LBsB, LTsB, 4);
  drawLine(svg, MBsB, MTsB, 4);
  drawLine(svg, LTsB, RTsB, 4);

  drawText(
    svg,
    `Size: ${size.label.split(" ")[0]}`,
    new Vector2(LTsB.x + 10, LTsB.y + 5)
  );
  drawText(svg, `Scale: 1:${scale/10}`, new Vector2(MTsB.x + 10, MTsB.y + 5));

  if (lineSize) {
    const LTsT = new Vector2(LTsB.x, LTsB.y - (lineSize.height + 10));
    const RTsT = new Vector2(RTsB.x, RTsB.y - (lineSize.height + 10));
    svg
      .rect(maxW + 40, lineSize.height)
      .fill("#ddd")
      .move(LTsT.x, LTsT.y);
    drawLine(svg, LTsB, LTsT, 4);
    drawLine(svg, LTsT, RTsT, 4);
    drawText(
      svg,
      `Line No.: ${row?.line}`,
      new Vector2(LTsT.x + 10, LTsT.y + 5)
    );
  }
  drawLine(svg, LT, RT, 4);
  drawLine(svg, RT, RB, 4);
  drawLine(svg, RB, LB, 4);
  drawLine(svg, LB, LT, 4);
}

export function generateView(
  view: TView,
  pipes: FreePipe[]
): TResult | undefined {
  let min: Vector3 | undefined;
  let max: Vector3 | undefined;
  const lines: TLine[] = [];

  for (const pipe of pipes) {
    if (!min) {
      min = new Vector3(
        Math.min(pipe.x1, pipe.x2),
        Math.min(pipe.y1, pipe.y2),
        Math.min(pipe.z1, pipe.z2)
      );
    } else {
      min.set(
        Math.min(min.x, pipe.x1, pipe.x2),
        Math.min(min.y, pipe.y1, pipe.y2),
        Math.min(min.z, pipe.z1, pipe.z2)
      );
    }
    if (!max) {
      max = new Vector3(
        Math.max(pipe.x1, pipe.x2),
        Math.max(pipe.y1, pipe.y2),
        Math.max(pipe.z1, pipe.z2)
      );
    } else {
      max.set(
        Math.max(max.x, pipe.x1, pipe.x2),
        Math.max(max.y, pipe.y1, pipe.y2),
        Math.max(max.z, pipe.z1, pipe.z2)
      );
    }
  }

  if (!min || !max) return undefined;

  const center = new Vector3().addVectors(min, max).divideScalar(2);

  const extended: FreePipe[] = pipes.reduce((acc: FreePipe[], p) => {
    const pipe = acc.find((val) => val.id === p.id);
    if (pipe?.params.endConnector) {
      const next = acc.find((p) => p.preceding === pipe.pipe);
      if (!next) return acc;
      if (pipe.params.endConnectorType === "Elbow") {
        return createJSONElbow(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Return") {
        return createJSONReturn(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Reducer") {
        return createJSONReducer(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Tee") {
        return createJSONTee(acc, pipe);
      }
    }
    return acc;
  }, pipes);

  let min2D: Vector2 | undefined;
  let max2D: Vector2 | undefined;

  for (const pipe of extended) {
    const start = roundVectorM(
      new Vector3(pipe.x1, pipe.y1, pipe.z1).sub(center)
    );
    const end = roundVectorM(
      new Vector3(pipe.x2, pipe.y2, pipe.z2).sub(center)
    );

    const start2D = convertTo2D(start, view);
    const end2D = convertTo2D(end, view);

    if (!min2D) {
      min2D = new Vector2(
        Math.min(start2D.x, end2D.x),
        Math.min(start2D.y, end2D.y)
      );
    } else {
      min2D.set(
        Math.min(min.x, start2D.x, end2D.x),
        Math.min(min.y, start2D.y, end2D.y)
      );
    }
    if (!max2D) {
      max2D = new Vector2(
        Math.max(start2D.x, end2D.x),
        Math.max(start2D.y, end2D.y)
      );
    } else {
      max2D.set(
        Math.max(max.x, start2D.x, end2D.x),
        Math.max(max.y, start2D.y, end2D.y)
      );
    }

    lines.push({
      id: lines.length,
      name: `${pipe.pipe} - ${
        pipe.params.nps ? `${pipe.params.nps}''` : `${pipe.params.od ?? 0}mm`
      }`,
      type: getType(pipe),
      start,
      end,
      length: start2D.distanceTo(end2D),
      sFlange: pipe.params.startFlange
        ? pipe.params.startFlangeType
        : undefined,
      eFlange: pipe.params.endFlange ? pipe.params.endFlangeType : undefined,
    });
  }

  const unitV = sizes[1].height - 30; // 30 => 15 + 15 (top + bottom)
  const unitH = sizes[1].width - 40; // 40 => 25 + 15 (left + right)

  let scale: TScale = scales[0];

  if (max2D && min2D) {
    const scaleV = (max2D.y - min2D.y) / unitV;
    const scaleH = (max2D.x - min2D.x) / unitH;
    const max = Math.max(scaleV, scaleH);
    for (let i = 1; i < scales.length; i++) {
      if (checkRange(max, scales[i - 1], scales[i], true, true)) {
        scale = scales[i];
        break;
      }
    }
  }

  return { view, lines, scale };
}

export function generateViewForISO(view: TView, items: TISODataItem[]) {
  let min: Vector3 | undefined;
  let max: Vector3 | undefined;
  const lines: TLine[] = [];

  for (const item of items) {
    if (!min) {
      min = new Vector3(
        Math.min(item.start_M.x, item.end_M.x),
        Math.min(item.start_M.y, item.end_M.y),
        Math.min(item.start_M.z, item.end_M.z)
      );
    } else {
      min.set(
        Math.min(min.x, item.start_M.x, item.end_M.x),
        Math.min(min.y, item.start_M.y, item.end_M.y),
        Math.min(min.z, item.start_M.z, item.end_M.z)
      );
    }
    if (!max) {
      max = new Vector3(
        Math.max(item.start_M.x, item.end_M.x),
        Math.max(item.start_M.y, item.end_M.y),
        Math.max(item.start_M.z, item.end_M.z)
      );
    } else {
      max.set(
        Math.max(max.x, item.start_M.x, item.end_M.x),
        Math.max(max.y, item.start_M.y, item.end_M.y),
        Math.max(max.z, item.start_M.z, item.end_M.z)
      );
    }
  }

  if (!min || !max) return undefined;

  const center = new Vector3().addVectors(min, max).divideScalar(2);

  let min2D: Vector2 | undefined;
  let max2D: Vector2 | undefined;

  for (const item of items) {
    const start = roundVectorM(convertToVector3(item.start_M).sub(center));
    const end = roundVectorM(convertToVector3(item.end_M).sub(center));

    const start2D = convertTo2D(start, view);
    const end2D = convertTo2D(end, view);

    if (!min2D) {
      min2D = new Vector2(
        Math.min(start2D.x, end2D.x),
        Math.min(start2D.y, end2D.y)
      );
    } else {
      min2D.set(
        Math.min(min.x, start2D.x, end2D.x),
        Math.min(min.y, start2D.y, end2D.y)
      );
    }
    if (!max2D) {
      max2D = new Vector2(
        Math.max(start2D.x, end2D.x),
        Math.max(start2D.y, end2D.y)
      );
    } else {
      max2D.set(
        Math.max(max.x, start2D.x, end2D.x),
        Math.max(max.y, start2D.y, end2D.y)
      );
    }

    lines.push({
      id: lines.length,
      name: `${item.name} - ${
        item.nps ? `${item.nps}''` : `${item.diameter ?? 0}mm`
      }`,
      type: getType(item),
      start,
      end,
      length: start2D.distanceTo(end2D),
    });
  }

  const unitV = sizes[1].height - 30; // 30 => 15 + 15 (top + bottom)
  const unitH = sizes[1].width - 40; // 40 => 25 + 15 (left + right)

  let scale: TScale = scales[0];

  if (max2D && min2D) {
    const scaleV = (max2D.y - min2D.y) / unitV;
    const scaleH = (max2D.x - min2D.x) / unitH;
    const max = Math.max(scaleV, scaleH);
    for (let i = 1; i < scales.length; i++) {
      if (checkRange(max, scales[i - 1], scales[i], true, true)) {
        scale = scales[i];
        break;
      }
    }
  }

  return { view, lines, scale };
}

export function getMaxView(
  line: number,
  results: Map<number, TResult[]>
): TView | undefined {
  const vrs = results.get(line);
  if (!vrs) return undefined;
  let view: TView | undefined;
  let max = 0;
  for (const res of vrs) {
    const d = res.lines.reduce((acc: number, item: TLine) => {
      return acc + item.length;
    }, 0);
    max = Math.max(max, d);
    if (max === d) view = res.view;
  }
  return view;
}

export function drawLines(
  svg: Svg,
  view: TView,
  lines: TLine[],
  size: TSize,
  scale: TScale,
  row?: TRow
) {
  clearSvg(svg);

  const offsetY = (svg.height() as number) / 2;
  const offsetX = (svg.width() as number) / 2;

  const min = new Vector2(25, 15);
  const max = new Vector2(
    (svg.width() as number) - 15,
    (svg.height() as number) - 15
  );

  // TODO 1: cut lines if they are outside
  // TODO 2: symbols drawing

  for (const line of lines) {
    const start = line.start.clone();
    const end = line.end.clone();

    const start2D = convertTo2D(start, view, scale*10, offsetX, offsetY);
    const end2D = convertTo2D(end, view, scale*10, offsetX, offsetY);

    const angle = roundM(
      radToDeg(
        end2D
          .clone()
          .sub(start2D)
          .angle()
      )
    );
    const quarter = getQuarter(angle);

    if (
      ![
        "Reducer Conc. <",
        "Reducer Conc. >",
        "Reducer Ecc. <",
        "Reducer Ecc. >",
      ].includes(line.type)
    ) {
      drawLine(svg, start2D, end2D, 3);
    }

    switch (line.type) {
      case "Reducer Conc. <":
        drawReducer(svg, start2D, end2D, 3);
        break;
      case "Reducer Conc. >":
        drawReducer(svg, end2D, start2D, 3);
        break;
      case "Reducer Ecc. <":
        drawReducer(svg, start2D, end2D, 3, true);
        break;
      case "Reducer Ecc. >":
        drawReducer(svg, end2D, start2D, 3, true);
        break;
      case "Pipe":
        showAngles(
          svg,
          start,
          end,
          start2D,
          end2D,
          view,
          scale*10,
          offsetX,
          offsetY
        );
        drawSize(svg, start2D, end2D, quarter, line);
        drawFlanges(svg, start2D, end2D, line, 3);
        !line.sFlange && drawDot(svg, start2D);
        !line.eFlange && drawDot(svg, end2D);
        break;
      case "45 Mitre Elbow":
      case "45 Mitre Elbow (2-Cut)":
      case "45 Mitre Elbow (3-Cut)":
      case "90 Mitre Elbow":
      case "90 Mitre Elbow (2-Cut)":
      case "90 Mitre Elbow (3-Cut)":
      case "90 Elbow or Bend Butt Weld":
        !line.sFlange && drawDot(svg, start2D);
        !line.eFlange && drawDot(svg, end2D);
    }
  }
  drawСompass(svg, view);
  drawBorder(svg, size, scale*10, row);
}

function showAngles(
  svg: Svg,
  start: Vector3,
  end: Vector3,
  start2D: Vector2,
  end2D: Vector2,
  view: TView,
  coef: number,
  offsetX: number,
  offsetY: number
) {
  const byH = start.x !== end.x && start.z !== end.z;
  const byV = start.y !== end.y && (start.x !== end.x || start.z !== end.z);
  if (byH && !byV) {
    showHAngle(svg, start, end, start2D, end2D, view, coef, offsetX, offsetY);
  } else if (!byH && byV) {
    showVAngle(svg, start, end, start2D, end2D, view, coef, offsetX, offsetY);
  } else if (byH && byV) {
    showVAngle(
      svg,
      start,
      end,
      start2D,
      end2D,
      view,
      coef,
      offsetX,
      offsetY,
      true
    );
  }
}

function showHAngle(
  svg: Svg,
  start: Vector3,
  end: Vector3,
  start2D: Vector2,
  end2D: Vector2,
  view: TView,
  coef: number,
  offsetX: number,
  offsetY: number
) {
  const dir =
    Math.abs(start.x - end.x) >= Math.abs(start.z - end.z) ? "X" : "Z";

  const fe3 = new Vector3(
    dir === "X" ? end.x : start.x,
    start.y,
    dir === "X" ? start.z : end.z
  );
  const fs3 = new Vector3(
    dir === "X" ? start.x : end.x,
    start.y,
    dir === "X" ? end.z : start.z
  );

  const fixedEnd = convertTo2D(fe3, view, coef, offsetX, offsetY);
  const fixedStart = convertTo2D(fs3, view, coef, offsetX, offsetY);

  drawLine(svg, start2D, fixedEnd);

  const delta = start2D.distanceTo(fixedEnd) / 5;
  let l1 = delta;
  for (let i = 0; i < 5; i++) {
    const from = getPosByDistance2D(l1, start2D, fixedEnd);
    const to = getPosByDistance2D(l1, fixedStart, end2D);
    const cross = getCrossV(start2D, end2D, from, to);
    cross && drawLine(svg, from, cross);
    l1 += delta;
  }
}

function showVAngle(
  svg: Svg,
  start: Vector3,
  end: Vector3,
  start2D: Vector2,
  end2D: Vector2,
  view: TView,
  coef: number,
  offsetX: number,
  offsetY: number,
  isBoth?: boolean
) {
  const fe3 = end.clone().setY(start.y);
  const fs3 = start.clone().setY(end.y);

  const fixedEnd = convertTo2D(fe3, view, coef, offsetX, offsetY);
  const fixedStart = convertTo2D(fs3, view, coef, offsetX, offsetY);

  drawLine(svg, start2D, fixedEnd);

  const delta = start2D.distanceTo(fixedEnd) / 5;
  let l1 = delta;
  for (let i = 0; i < 5; i++) {
    const from = getPosByDistance2D(l1, start2D, fixedEnd);
    const to = getPosByDistance2D(l1, fixedStart, end2D);
    const cross = getCrossV(start2D, end2D, from, to);
    cross && drawLine(svg, from, cross);
    l1 += delta;
  }
  if (!isBoth) return;
  showHAngle(svg, start, fe3, start2D, fixedEnd, view, coef, offsetX, offsetY);
}

function drawSize(
  svg: Svg,
  start2D: Vector2,
  end2D: Vector2,
  quarter: TQuarter,
  line: TLine,
  length = 40,
  width = 1
) {
  if (["LT", "L", "LB", "RB", "R", "RT"].includes(quarter)) {
    const start2Dn = start2D.clone().setY(start2D.y + length);
    const end2Dn = end2D.clone().setY(end2D.y + length);

    const start2Dm = getPosByDistance2D(5, start2Dn, start2D);
    const end2Dm = getPosByDistance2D(5, end2Dn, end2D);

    const center2Dm = start2Dm
      .clone()
      .add(end2Dm)
      .divideScalar(2);

    drawLine(svg, start2D, start2Dn, width);
    drawLine(svg, end2D, end2Dn, width);

    if (start2Dm.distanceTo(end2Dm) < 30) {
      start2Dm.copy(getPosByDistance2D(-20, start2Dm, end2Dm));
      end2Dm.copy(getPosByDistance2D(20, start2Dm, end2Dm));
    }

    drawLine(svg, start2Dm, end2Dm, width);

    drawArrow(svg, start2Dm, end2Dm);
    drawArrow(svg, end2Dm, start2Dm);

    const l = roundM(line.start.distanceTo(line.end));

    if (quarter === "L" || quarter === "R") {
      drawText(svg, line.name, center2Dm, { position: "T" });
      drawText(svg, `${l}m`, center2Dm, { position: "B" });
    } else {
      const skew = {
        skewX: 0,
        skewY: quarter === "LB" || quarter === "RT" ? -30 : 30,
      };
      drawText(svg, line.name, center2Dm, { ...skew, position: "T" });
      drawText(svg, `${l}m`, center2Dm, { ...skew, position: "B" });
    }
  } else {
    const start2Dn = start2D
      .clone()
      .setX(start2D.x + length)
      .rotateAround(start2D, -deg30InRad);
    const end2Dn = end2D
      .clone()
      .setX(end2D.x + length)
      .rotateAround(end2D, -deg30InRad);

    const start2Dm = getPosByDistance2D(5, start2Dn, start2D);
    const end2Dm = getPosByDistance2D(5, end2Dn, end2D);

    const center2Dm = start2Dm
      .clone()
      .add(end2Dm)
      .divideScalar(2);

    drawLine(svg, start2D, start2Dn, width);
    drawLine(svg, end2D, end2Dn, width);

    if (start2Dm.distanceTo(end2Dm) < 30) {
      start2Dm.copy(getPosByDistance2D(-20, start2Dm, end2Dm));
      end2Dm.copy(getPosByDistance2D(20, start2Dm, end2Dm));
    }

    drawLine(svg, start2Dm, end2Dm, width);

    drawArrow(svg, start2Dm, end2Dm);
    drawArrow(svg, end2Dm, start2Dm);

    const l = roundM(line.start.distanceTo(line.end));

    drawText(svg, line.name, center2Dm, {
      skewX: 0,
      skewY: -30,
      position: "RT",
    });
    drawText(svg, `${l}m`, center2Dm, { skewX: 0, skewY: -30, position: "RB" });
  }
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
    const start2D = convertTo2D(line.start, view, coef, offsetX, offsetY);
    const end2D = convertTo2D(line.end, view, coef, offsetX, offsetY);
    drawLine(svg, start2D, end2D);
    const diff = end2D.clone().sub(start2D);
    const position =
      diff.x > 0 ? (diff.y < 0 ? "RT" : "RB") : diff.y < 0 ? "LT" : "LB";
    drawText(svg, line.label, end2D, { position: line.position || position });
    line.label === "N" && drawArrow(svg, end2D, start2D);
  }
}
