import { Svg } from "@svgdotjs/svg.js";
import {
  TScale,
  TSize,
  TView,
} from "../../menu-bar/analysis-tab/piping/isometric-view/isometricTypes";
import { scales, sizes } from "../../menu-bar/analysis-tab/piping/isometric-view/isometricUtils";
import { checkRange, fixVectorByOrientation, round, degToRad } from "../utils";
import * as TYPES from "../../../store/process/types";
import * as THREE from "three";
import * as _2D from "./PUtils2D";
import { Vector2, Vector3 } from "three";
import { TValveControlType } from "../../../store/main/types";

function getPFDdata(process: TYPES.TProcess) {
  let min: THREE.Vector3 | undefined;
  let max: THREE.Vector3 | undefined;
  let min2D: THREE.Vector2 | undefined;
  let max2D: THREE.Vector2 | undefined;

  const converted: TYPES.TProcessElement2D[] = [];
  const lines2D: TYPES.TProcessLine2D[] = [];
  const instrs2D: TYPES.TInstrElement2D[] = [];
  const instrLines2D: TYPES.TInstrLine2D[] = [];

  const elements = Array.from(process.elements.values());
  const lines = process.lines ?? [];
  const instrs = process.instrumentations ?? [];
  const instrLines = process.instrumentationLines ?? [];

  for (const el of elements) {
    if (!min) {
      min = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      min.set(
        Math.min(min.x, el.position.x),
        Math.min(min.y, el.position.y),
        Math.min(min.z, el.position.z)
      );
    }
    if (!max) {
      max = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      max.set(
        Math.max(max.x, el.position.x),
        Math.max(max.y, el.position.y),
        Math.max(max.z, el.position.z)
      );
    }
  }

  if (!min || !max) return undefined;

  const center = new THREE.Vector3().addVectors(min, max).divideScalar(2);

  for (const el of elements as TYPES.TProcessElement[]) {
    const position = new THREE.Vector3(el.position.x, el.position.y, el.position.z).sub(center);

    const position2D = _2D.convertTo2D(position);

    converted.push({
      ...el,
      position2D,
      points2D: el.points.map((p) => {
        const point2D: TYPES.TProcessElementPoint2D = {
          ...p,
          startPosition2D: _2D.convertTo2D(
            p.startPosition
              .clone()
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(new Vector3(0, 0, 1), degToRad(el.rotationZ ?? 0))
          ),
          generalPosition2D: _2D.convertTo2D(
            p.generalPosition
              .clone()
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(new Vector3(0, 0, 1), degToRad(el.rotationZ ?? 0))
          ),
        };
        return point2D;
      }),
    });

    if (!min2D) {
      min2D = position2D.clone();
    } else {
      min2D.set(Math.min(min.x, position2D.x), Math.min(min.y, position2D.y));
    }
    if (!max2D) {
      max2D = position2D.clone();
    } else {
      max2D.set(Math.max(max.x, position2D.x), Math.max(max.y, position2D.y));
    }
  }

  for (const instr of instrs) {
    const position = new THREE.Vector3(instr.x, instr.y, instr.z).sub(center);
    const position2D = _2D.convertTo2D(position);
    instrs2D.push({ ...instr, position2D });
  }

  for (const il of instrLines) {
    const from = instrs.find((i) => i.id === il.from);
    const to = instrs.find((i) => i.id === il.to);
    if (!from || !to) continue;
    if (from.x !== to.x) {
      const start2D = _2D.convertTo2D(new THREE.Vector3(from.x, from.y, from.z).sub(center));
      const end2D = _2D.convertTo2D(new THREE.Vector3(to.x, from.y, from.z).sub(center));
      instrLines2D.push({ ...il, start2D, end2D });
    }
    if (from.z !== to.z) {
      const start2D = _2D.convertTo2D(new THREE.Vector3(to.x, to.y, from.z).sub(center));
      const end2D = _2D.convertTo2D(new THREE.Vector3(to.x, to.y, to.z).sub(center));
      instrLines2D.push({ ...il, start2D, end2D });
    }
  }

  for (const line of lines) {
    lines2D.push({
      ...line,
      segments2D: line.segments.map((s) => ({
        ...s,
        start2D: _2D.convertTo2D(s.start.clone().sub(center)),
        end2D: _2D.convertTo2D(s.end.clone().sub(center)),
      })),
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

  return { elements: converted, lines: lines2D, instrs2D, instrLines2D, scale };
}

function getIsometricPFDdata(process: TYPES.TProcess, view: TView) {
  let min: THREE.Vector3 | undefined;
  let max: THREE.Vector3 | undefined;
  let min2D: THREE.Vector2 | undefined;
  let max2D: THREE.Vector2 | undefined;

  const converted: TYPES.TProcessElement2D[] = [];
  const lines2D: TYPES.TProcessLine2D[] = [];
  const instrs2D: TYPES.TInstrElement2D[] = [];
  const instrLines2D: TYPES.TInstrLine2D[] = [];

  const elements = Array.from(process.elements.values());
  const lines = process.lines ?? [];
  const instrs = process.instrumentations ?? [];
  const instrLines = process.instrumentationLines ?? [];

  for (const el of elements) {
    if (!min) {
      min = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      min.set(
        Math.min(min.x, el.position.x),
        Math.min(min.y, el.position.y),
        Math.min(min.z, el.position.z)
      );
    }
    if (!max) {
      max = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      max.set(
        Math.max(max.x, el.position.x),
        Math.max(max.y, el.position.y),
        Math.max(max.z, el.position.z)
      );
    }
  }

  if (!min || !max) return undefined;

  const center = new THREE.Vector3().addVectors(min, max).divideScalar(2);

  for (const el of elements as TYPES.TProcessElement[]) {
    const position = new THREE.Vector3(el.position.x, el.position.y, el.position.z).sub(center);

    const position2D = _2D.convertToIsometric2D(position, view);

    const quarter = _2D.getQuarter(
      position2D,
      _2D.convertToIsometric2D(
        position
          .clone()
          .setX(position.x + 1)
          .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
          .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
          .applyAxisAngle(new Vector3(0, 0, 1), degToRad(el.rotationZ ?? 0)),
        view
      )
    );

    converted.push({
      ...el,
      view,
      quarter,
      position2D,
      points2D: el.points.map((p) => {
        const point2D: TYPES.TProcessElementPoint2D = {
          ...p,
          startPosition2D: _2D.convertToIsometric2D(
            p.startPosition
              .clone()
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(new Vector3(0, 0, 1), degToRad(el.rotationZ ?? 0)),
            view
          ),
          generalPosition2D: _2D.convertToIsometric2D(
            p.generalPosition
              .clone()
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(new Vector3(0, 0, 1), degToRad(el.rotationZ ?? 0)),
            view
          ),
        };
        return point2D;
      }),
    });

    if (!min2D) {
      min2D = position2D.clone();
    } else {
      min2D.set(Math.min(min.x, position2D.x), Math.min(min.y, position2D.y));
    }
    if (!max2D) {
      max2D = position2D.clone();
    } else {
      max2D.set(Math.max(max.x, position2D.x), Math.max(max.y, position2D.y));
    }
  }

  for (const instr of instrs) {
    const position = new THREE.Vector3(instr.x, instr.y, instr.z).sub(center);
    const position2D = _2D.convertToIsometric2D(position, view);
    const quarter = _2D.getQuarter(
      position2D,
      _2D.convertToIsometric2D(position.clone().setX(position.x + 1), view)
    );
    instrs2D.push({ ...instr, view, quarter, position2D });
  }

  for (const il of instrLines) {
    const from = instrs.find((i) => i.id === il.from);
    const to = instrs.find((i) => i.id === il.to);
    if (!from || !to) continue;
    if (from.x !== to.x) {
      const start2D = _2D.convertToIsometric2D(
        new THREE.Vector3(from.x, from.y, from.z).sub(center),
        view
      );
      const end2D = _2D.convertToIsometric2D(
        new THREE.Vector3(to.x, from.y, from.z).sub(center),
        view
      );
      const quarter = _2D.getQuarter(start2D, end2D);
      instrLines2D.push({ ...il, view, quarter, start2D, end2D });
    }
    if (from.y !== to.y) {
      const start2D = _2D.convertToIsometric2D(
        new THREE.Vector3(to.x, from.y, from.z).sub(center),
        view
      );
      const end2D = _2D.convertToIsometric2D(
        new THREE.Vector3(to.x, to.y, from.z).sub(center),
        view
      );
      const quarter = _2D.getQuarter(start2D, end2D);
      instrLines2D.push({ ...il, view, quarter, start2D, end2D });
    }
    if (from.z !== to.z) {
      const start2D = _2D.convertToIsometric2D(
        new THREE.Vector3(to.x, to.y, from.z).sub(center),
        view
      );
      const end2D = _2D.convertToIsometric2D(new THREE.Vector3(to.x, to.y, to.z).sub(center), view);
      const quarter = _2D.getQuarter(start2D, end2D);
      instrLines2D.push({ ...il, view, quarter, start2D, end2D });
    }
  }

  for (const line of lines) {
    lines2D.push({
      ...line,
      segments2D: line.segments.map((s) => {
        const start2D = _2D.convertToIsometric2D(s.start.clone().sub(center), view);
        const end2D = _2D.convertToIsometric2D(s.end.clone().sub(center), view);
        const quarter = _2D.getQuarter(start2D, end2D);
        return { ...s, view, quarter, start2D, end2D };
      }),
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

  return { elements: converted, lines: lines2D, instrs2D, instrLines2D, scale };
}

function drawPFD(svg: Svg, scale: TScale, size: TSize, data: TYPES.TProcess2D) {
  _2D.clearSvg(svg);

  let min: THREE.Vector3 | undefined;
  let max: THREE.Vector3 | undefined;

  for (const el of data.elements) {
    if (!min) {
      min = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      min.set(
        Math.min(min.x, el.position.x),
        Math.min(min.y, el.position.y),
        Math.min(min.z, el.position.z)
      );
    }
    if (!max) {
      max = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
    } else {
      max.set(
        Math.max(max.x, el.position.x),
        Math.max(max.y, el.position.y),
        Math.max(max.z, el.position.z)
      );
    }
  }

  if (!min || !max) return undefined;

  const offsetY = svg.height() as number / 2;
  const offsetX = svg.width() as number / 2;

  for (const line of data.lines) {
    for (let i = 0, len = line.segments2D.length; i < len; i++) {
      const segment = line.segments2D[i];
      const s = _2D.fixV2D(new THREE.Vector2(), segment.start2D.clone(), scale, offsetX, offsetY);
      const e = _2D.fixV2D(new THREE.Vector2(), segment.end2D.clone(), scale, offsetX, offsetY);
      _2D.drawLine(
        svg,
        s,
        e,
        2,
        undefined,
        line.parameters?.type,
        true,
        line.type === "PIPE",
        segment
      );
      if (i === len - 1) _2D.drawArrow(svg, e, s, 1, undefined);
    }
  }
  const distance = round(_2D.convertMetersTo2D(1, scale));

  for (const el of data.elements) {
    const pos = _2D.fixV2D(new THREE.Vector2(), el.position2D.clone(), scale, offsetX, offsetY);

    const points = el.points2D.map((p) => ({
      ...p,
      startPosition2D: _2D.fixV2D(
        el.position2D.clone(),
        p.startPosition2D.clone(),
        scale,
        offsetX,
        offsetY
      ),
      generalPosition2D: _2D.fixV2D(
        el.position2D.clone(),
        p.generalPosition2D.clone(),
        scale,
        offsetX,
        offsetY
      ),
    }));

    drawPFDElement(svg, el, pos, points, scale);
  }

  for (const il2D of data.instrLines2D) {
    const start = _2D.fixV2D(new THREE.Vector2(), il2D.start2D, scale, offsetX, offsetY);
    const end = _2D.fixV2D(new THREE.Vector2(), il2D.end2D, scale, offsetX, offsetY);
    _2D.drawLine(svg, start, end, 2, undefined, il2D.type);
  }

  for (const i2D of data.instrs2D) {
    const pos = _2D.fixV2D(new THREE.Vector2(), i2D.position2D.clone(), scale, offsetX, offsetY);
    let control = "";
    let connected;
    const connectedInstr = data.instrs2D.find((i) => i.id === i2D.connected);
    if (connectedInstr) {
      if (connectedInstr.parentType === "PROCESS") {
        connected = data.elements.find((e) => e.name === connectedInstr.parent);
      }
    }
    if (i2D.parentType === "PROCESS") {
      const p = data.elements.find((e) => e.name === i2D.parent);
      if (p?.type === TYPES.EProcessElementType.VALVE) {
        if (p.parameters.control as TValveControlType) control = p.parameters.control[0];
      } else if (connected?.type === TYPES.EProcessElementType.VALVE) {
        if (connected.parameters.control as TValveControlType)
          control = connected.parameters.control[0];
      }
    }
    const options = i2D.quarter
      ? {
          flip: i2D.view === "NE" || i2D.view === "NW",
          skewX: 0,
          skewY: i2D.quarter === "LB" || i2D.quarter === "RT" ? -30 : 30,
        }
      : {
          flip: i2D.view === "NE" || i2D.view === "NW",
        };
    _2D.drawTool(
      svg,
      control + (i2D.combinedType ? i2D.combinedType[0] : "") + i2D.name,
      pos,
      distance,
      options
    );
  }

  _2D.drawBorder(svg, size, scale, data.titles ?? {}, data.revisions ?? []);
}

function drawAdditionalLines(svg: Svg, s: THREE.Vector2, e: THREE.Vector2) {
  if (s.x !== e.x) {
    _2D.drawLine(svg, s, new THREE.Vector2(e.x, s.y));
  }
  if (s.y !== e.y) {
    _2D.drawLine(svg, new THREE.Vector2(e.x, s.y), e);
  }
}

function drawPFDElement(
  svg: Svg,
  el: TYPES.TProcessElement2D,
  pos: THREE.Vector2,
  points: TYPES.TProcessElementPoint2D[],
  scale: number
) {
  for (const point of points) {
    _2D.drawLine(svg, pos, point.startPosition2D);
    _2D.drawLine(svg, point.startPosition2D, point.generalPosition2D);
  }

  const options = el.quarter
    ? {
        flip: el.view === "NE" || el.view === "NW",
        skewX: 0,
        skewY: el.quarter === "LB" || el.quarter === "RT" ? -30 : 30,
      }
    : {
        flip: el.view === "NE" || el.view === "NW",
      };

  const d = _2D.convertMetersTo2D(1, scale);
  const d_2 = d / 2;

  let offset = d_2;

  switch (el.type) {
    case TYPES.EProcessElementType.SOURCE:
      offset = _2D.drawSource(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.SINK:
      offset = _2D.drawSink(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.TANK:
      offset = _2D.drawTank(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.PUMP:
      offset = _2D.drawPump(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.DRUM:
      offset = _2D.drawDrum(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.VALVE:
      offset = _2D.drawValve(svg, el as any, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.SEPARATOR:
    case TYPES.EProcessElementType.HORIZONTAL_DRUM:
      offset = _2D.drawSeparator(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.MIX:
      _2D.drawMix(svg, pos, d, options);
      break;
    case TYPES.EProcessElementType.SPLIT:
      _2D.drawSplit(svg, pos, d, options);
      break;
    case TYPES.EProcessElementType.HEADER:
      // TODO
      break;
    case TYPES.EProcessElementType.DISTILLATION_COLUMN:
      offset = _2D.drawColumn(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.EXTRACTOR:
      offset = _2D.drawExtractor(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.EXPANDER:
      offset = _2D.drawExpander(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.COMPRESSOR:
      offset = _2D.drawCompressor(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.PSV:
      offset = _2D.drawPSV(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.ENLARGER:
      offset = _2D.drawEnlarger(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.PFR:
      offset = _2D.drawPFR(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.CSTR:
      offset = _2D.drawCSTR(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.RE:
    case TYPES.EProcessElementType.RC:
    case TYPES.EProcessElementType.RG:
      offset = _2D.drawReactor(svg, pos, scale, el.type, options).height / 2;
      break;
    case TYPES.EProcessElementType.ST_HE_1P:
      offset = _2D.drawSTHE1P(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.ST_HE_2P:
      offset = _2D.drawSTHE2P(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.HEATER:
      offset = _2D.drawHeater(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.COOLER:
      offset = _2D.drawCooler(svg, pos, scale, options).height / 2;
      break;
    case TYPES.EProcessElementType.COLUMN:
    case TYPES.EProcessElementType.ABSORPTION_COLUMN:
      offset = _2D.drawAbsorptionColumn(svg, pos, scale, options).height / 2;
  }

  _2D.drawText(svg, el.tag, new Vector2(pos.x, pos.y + offset), {
    ...options,
    position: "B",
    size: d_2 / 2,
  });
}

export { getPFDdata, getIsometricPFDdata, drawPFD };
