import { Svg } from "@svgdotjs/svg.js";
import * as THREE from "three";
import * as TYPES from "../../../store/process/types";
import {
  TScale,
  TSize,
  TView,
} from "../../menu-bar/analysis-tab/piping/isometric-view/isometricTypes";
import {
  sizes,
  scales,
} from "../../menu-bar/analysis-tab/piping/isometric-view/isometricUtils";
import { deg45InRad, deg90InRad } from "../../../store/main/constants";
import { TPipingReducer } from "../../../store/data/types";
import {
  round,
  getPosByDistance2D,
  fixVectorByOrientation,
  checkRange,
  MMtoM,
  getPosByDistance,
  degToRad,
} from "../utils";
import * as _2D from "./PUtils2D";
import { TValveControlType } from "../../../store/main/types";
import { Vector3 } from "three";

function getPaIDdata(process: TYPES.TProcess) {
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
    const position = new THREE.Vector3(
      el.position.x,
      el.position.y,
      el.position.z
    ).sub(center);

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
      const start2D = _2D.convertTo2D(
        new THREE.Vector3(from.x, from.y, from.z).sub(center)
      );
      const end2D = _2D.convertTo2D(
        new THREE.Vector3(to.x, from.y, from.z).sub(center)
      );
      instrLines2D.push({ ...il, start2D, end2D });
    }
    if (from.z !== to.z) {
      const start2D = _2D.convertTo2D(
        new THREE.Vector3(to.x, to.y, from.z).sub(center)
      );
      const end2D = _2D.convertTo2D(
        new THREE.Vector3(to.x, to.y, to.z).sub(center)
      );
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

function getIsometricPaIDdata(process: TYPES.TProcess, view: TView) {
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
    const position = new THREE.Vector3(
      el.position.x,
      el.position.y,
      el.position.z
    ).sub(center);

    const position2D = _2D.convertToIsometric2D(position, view);

    const quarter = _2D.getQuarter(
      position2D,
      _2D.convertToIsometric2D(
        position
          .clone()
          .setX(position.x + 1)
          .applyAxisAngle(new THREE.Vector3(1), degToRad(el.rotationX ?? 0))
          .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(el.rotation))
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            degToRad(el.rotationZ ?? 0)
          ),
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
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(
                new Vector3(0, 0, 1),
                degToRad(el.rotationZ ?? 0)
              ),
            view
          ),
          generalPosition2D: _2D.convertToIsometric2D(
            p.generalPosition
              .applyAxisAngle(new Vector3(1), degToRad(el.rotationX ?? 0))
              .applyAxisAngle(new Vector3(0, 1), degToRad(el.rotation))
              .applyAxisAngle(
                new Vector3(0, 0, 1),
                degToRad(el.rotationZ ?? 0)
              ),
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
      const end2D = _2D.convertToIsometric2D(
        new THREE.Vector3(to.x, to.y, to.z).sub(center),
        view
      );
      const quarter = _2D.getQuarter(start2D, end2D);
      instrLines2D.push({ ...il, view, quarter, start2D, end2D });
    }
  }

  for (const line of lines) {
    lines2D.push({
      ...line,
      segments2D: line.segments.map((s) => {
        const start2D = _2D.convertToIsometric2D(
          s.start.clone().sub(center),
          view
        );
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

function drawPaID(
  svg: Svg,
  scale: TScale,
  size: TSize,
  data: TYPES.TProcess2D
) {
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

  const center = new THREE.Vector3().addVectors(min, max).divideScalar(2);

  const offsetY = (svg.height() as number) / 2;
  const offsetX = (svg.width() as number) / 2;

  for (const line of data.lines) {
    for (let i = 0, len = line.segments2D.length; i < len; i++) {
      const segment = line.segments2D[i];
      const s = _2D.fixV2D(
        new THREE.Vector2(),
        segment.start2D.clone(),
        scale,
        offsetX,
        offsetY
      );
      const e = _2D.fixV2D(
        new THREE.Vector2(),
        segment.end2D.clone(),
        scale,
        offsetX,
        offsetY
      );
      _2D.drawLine(svg, s, e, 1, undefined, line.parameters?.type);
      if (
        segment.parameters?.endConnectorType === "Reducer" &&
        segment.parameters?.endConnector
      ) {
        const h =
          MMtoM((segment.parameters.endConnector as TPipingReducer).h) / 2;
        const rs = _2D.fixV2D(
          new THREE.Vector2(),
          _2D.convertTo2D(
            getPosByDistance(h, segment.end, segment.start).sub(center)
          ),
          scale,
          offsetX,
          offsetY
        );
        const re = _2D.fixV2D(
          new THREE.Vector2(),
          _2D.convertTo2D(
            getPosByDistance(-h, segment.end, segment.start).sub(center)
          ),
          scale,
          offsetX,
          offsetY
        );
        drawReducer(svg, rs, re, 1);
      }
      if (
        segment.parameters?.endConnectorType === "Cap" &&
        segment.parameters?.endConnector
      ) {
        drawCap(
          svg,
          _2D.fixV2D(
            new THREE.Vector2(),
            segment.start2D,
            scale,
            offsetX,
            offsetY
          ),
          _2D.fixV2D(
            new THREE.Vector2(),
            segment.end2D,
            scale,
            offsetX,
            offsetY
          )
        );
      }
      drawFlanges(
        svg,
        _2D.fixV2D(
          new THREE.Vector2(),
          segment.start2D,
          scale,
          offsetX,
          offsetY
        ),
        _2D.fixV2D(new THREE.Vector2(), segment.end2D, scale, offsetX, offsetY),
        segment
      );
      if (i === len - 1) _2D.drawArrow(svg, e, s, 1, undefined);
    }
  }

  for (const el of data.elements) {
    const pos = _2D.fixV2D(
      new THREE.Vector2(),
      el.position2D.clone(),
      scale,
      offsetX,
      offsetY
    );

    const notFixedS =
      el.points2D.find((p) => p.isFixed && p.connectionType === "START") ??
      el.points2D.find((p) => p.connectionType === "START");
    const notFixedE =
      el.points2D.find((p) => p.isFixed && p.connectionType === "END") ??
      el.points2D.find((p) => p.connectionType === "END");

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

    const start: TYPES.TProcessElementPoint2D | undefined = notFixedS
      ? {
          ...notFixedS,
          startPosition2D: _2D.fixV2D(
            el.position2D.clone(),
            notFixedS.startPosition2D.clone(),
            scale,
            offsetX,
            offsetY
          ),
          generalPosition2D: _2D.fixV2D(
            el.position2D.clone(),
            notFixedS.generalPosition2D.clone(),
            scale,
            offsetX,
            offsetY
          ),
        }
      : undefined;

    const end: TYPES.TProcessElementPoint2D | undefined = notFixedE
      ? {
          ...notFixedE,
          startPosition2D: _2D.fixV2D(
            el.position2D.clone(),
            notFixedE.startPosition2D.clone(),
            scale,
            offsetX,
            offsetY
          ),
          generalPosition2D: _2D.fixV2D(
            el.position2D.clone(),
            notFixedE.generalPosition2D.clone(),
            scale,
            offsetX,
            offsetY
          ),
        }
      : undefined;

    const starts = points.filter((p) => p.connectionType === "START");
    const ends = points.filter((p) => p.connectionType === "END");

    let distance = 0;
    if (start) {
      distance = pos.distanceTo(start.generalPosition2D);
    } else if (end) {
      distance = pos.distanceTo(end.generalPosition2D);
    } else if (starts.length) {
      distance = pos.distanceTo(starts[0].generalPosition2D);
    } else if (ends.length) {
      distance = pos.distanceTo(ends[0].generalPosition2D);
    }
    drawPaIDElement(svg, el, pos, points, scale);
  }

  const distance = round(_2D.convertMetersTo2D(1, scale));

  for (const il2D of data.instrLines2D) {
    const start = _2D.fixV2D(
      new THREE.Vector2(),
      il2D.start2D,
      scale,
      offsetX,
      offsetY
    );
    const end = _2D.fixV2D(
      new THREE.Vector2(),
      il2D.end2D,
      scale,
      offsetX,
      offsetY
    );
    _2D.drawLine(svg, start, end, 2, undefined, il2D.type);
  }

  for (const i2D of data.instrs2D) {
    const pos = _2D.fixV2D(
      new THREE.Vector2(),
      i2D.position2D.clone(),
      scale,
      offsetX,
      offsetY - (1 / scale) * 750
    );
    const pos_origin = _2D.fixV2D(
      new THREE.Vector2(),
      i2D.position2D.clone(),
      scale,
      offsetX,
      offsetY
    );

    _2D.drawLine(svg, pos_origin, pos, 2, undefined);

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
        if (p.parameters.control as TValveControlType)
          control = p.parameters.control[0];
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

function drawPaIDElement(
  svg: Svg,
  el: TYPES.TProcessElement2D,
  pos: THREE.Vector2,
  points: TYPES.TProcessElementPoint2D[],
  scale: number
) {
  if (
    el.type !== TYPES.EProcessElementType.PUMP &&
    el.type !== TYPES.EProcessElementType.PIPE
  ) {
    for (const point of points) {
      _2D.drawLine(svg, pos, point.startPosition2D);
      _2D.drawLine(svg, point.startPosition2D, point.generalPosition2D);
    }
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

  const distance = _2D.convertMetersTo2D(1, scale);
  const d_2 = distance / 2;

  const drawText = (offset: number) => {
    _2D.drawText(svg, el.name, new THREE.Vector2(pos.x, pos.y - offset), {
      position: "RT",
      size: d_2 / 2,
    });
    _2D.drawText(svg, el.tag, new THREE.Vector2(pos.x, pos.y + offset), {
      position: "B",
      size: d_2 / 2,
    });
  };

  switch (el.type) {
    case TYPES.EProcessElementType.SOURCE:
      _2D.drawText(svg, "Source", pos, { position: "T", size: d_2 / 2 });
      _2D.drawText(svg, "Feed", pos, { position: "B", size: d_2 / 2 });
      break;
    case TYPES.EProcessElementType.SINK:
      _2D.drawText(svg, "To Storage", pos, { position: "T", size: d_2 / 2 });
      break;
    case TYPES.EProcessElementType.TANK:
      drawText(_2D.drawTank(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.PUMP:
      _2D.drawPump(
        svg,
        new THREE.Vector2(
          pos.x,
          points.find((p) => p.connectionType === "END")?.generalPosition2D.y ??
            pos.y
        ),
        scale,
        options
      );
      for (const point of points) {
        _2D.drawLine(
          svg,
          new THREE.Vector2(pos.x, point.generalPosition2D.y),
          point.generalPosition2D,
          2
        );
      }
      _2D.drawText(svg, el.name, pos, { position: "RT", size: d_2 / 2 });
      _2D.drawText(svg, el.tag, new THREE.Vector2(pos.x, pos.y + d_2), {
        position: "B",
        size: d_2 / 2,
      });
      break;
    case TYPES.EProcessElementType.DRUM:
      drawText(_2D.drawDrum(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.VALVE:
      drawText(_2D.drawValve(svg, el as any, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.SEPARATOR:
    case TYPES.EProcessElementType.HORIZONTAL_DRUM:
      drawText(_2D.drawSeparator(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.MIX:
      _2D.drawMix(svg, pos, distance, options);
      drawText(d_2);
      break;
    case TYPES.EProcessElementType.SPLIT:
      _2D.drawSplit(svg, pos, distance, options);
      drawText(d_2);
      break;
    case TYPES.EProcessElementType.DISTILLATION_COLUMN:
      drawText(_2D.drawColumn(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.EXTRACTOR:
      drawText(_2D.drawExtractor(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.EXPANDER:
      drawText(_2D.drawExpander(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.COMPRESSOR:
      drawText(_2D.drawCompressor(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.PSV:
      drawText(_2D.drawPSV(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.ENLARGER:
      drawText(_2D.drawEnlarger(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.PFR:
      drawText(_2D.drawPFR(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.CSTR:
      drawText(_2D.drawCSTR(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.RE:
    case TYPES.EProcessElementType.RC:
    case TYPES.EProcessElementType.RG:
      drawText(_2D.drawReactor(svg, pos, scale, el.type, options).height / 2);
      break;
    case TYPES.EProcessElementType.ST_HE_1P:
      drawText(_2D.drawSTHE1P(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.ST_HE_2P:
      drawText(_2D.drawSTHE2P(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.HEATER:
      drawText(_2D.drawHeater(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.COOLER:
      drawText(_2D.drawCooler(svg, pos, scale, options).height / 2);
      break;
    case TYPES.EProcessElementType.COLUMN:
    case TYPES.EProcessElementType.ABSORPTION_COLUMN:
      drawText(_2D.drawAbsorptionColumn(svg, pos, scale, options).height / 2);
      break;
    default:
      drawText(d_2);
      break;
  }
}

// function drawPaIDColumn(svg: Svg, pos: THREE.Vector2, d: number) {
//   const d_2 = round((d * 0.8) / 2);
//   const d_4 = round(d_2 / 2);
//   const d_8 = round(d_4 / 2);
//   svg
//     .polygon([
//       [pos.x - d_4, pos.y - d_2],
//       [pos.x, pos.y - d_2],
//       [pos.x + d_8, pos.y - d_2 + d_8],
//       [pos.x + d_8, pos.y + d_2 - d_8],
//       [pos.x, pos.y + d_2],
//       [pos.x - d_4, pos.y + d_2],
//       [pos.x - d_8, pos.y + d_2 - d_8],
//       [pos.x - d_8, pos.y - d_2 + d_8],
//     ])
//     .fill("#ddd")
//     .stroke({ width: 2, color: "#000" });
// }

function drawReducer(
  svg: Svg,
  start: THREE.Vector2,
  end: THREE.Vector2,
  width = 1,
  isEcc?: boolean
) {
  const vA = getPosByDistance2D(3, start, end);
  const vA1 = vA.clone().rotateAround(start, deg90InRad);
  const vA2 = vA.clone().rotateAround(start, -deg90InRad);
  const vB = getPosByDistance2D(6, end, start);
  const vB1 = vB.clone().rotateAround(end, deg90InRad);
  const vB2 = vB.clone().rotateAround(end, -deg90InRad);
  _2D.drawLine(svg, vA1, vB2, width);
  _2D.drawLine(svg, vB2, vB1, width);
  _2D.drawLine(svg, vB1, vA2, width);
  _2D.drawLine(svg, vA2, vA1, width);
  if (isEcc) {
    const centerA = vA1
      .clone()
      .add(vB1)
      .divideScalar(2);
    const centerB = vA2
      .clone()
      .add(vB2)
      .divideScalar(2);
    const cA1 = getPosByDistance2D(-3, centerA, centerB);
    const cA2 = getPosByDistance2D(3, centerA, centerB);
    _2D.drawLine(svg, cA1, cA2, width);
    const cA1S = centerA.clone().rotateAround(cA2, deg90InRad);
    const cA2S = centerA.clone().rotateAround(cA2, -deg90InRad);
    _2D.drawLine(svg, cA1S, cA2S, width);
    const cB1 = getPosByDistance2D(-3, centerB, centerA);
    const cB2 = getPosByDistance2D(3, centerB, centerA);
    _2D.drawLine(svg, cB1, cB2, width);
    const cB1S = centerA.clone().rotateAround(cB2, deg90InRad);
    const cB2S = centerA.clone().rotateAround(cB2, -deg90InRad);
    _2D.drawLine(svg, cB1S, cB2S, width);
  }
}

function drawFlanges(
  svg: Svg,
  start: THREE.Vector2,
  end: THREE.Vector2,
  line: TYPES.TProcessLineSegment2D,
  width = 1
) {
  line.parameters?.startFlange &&
    drawFlange(svg, start, end, line.parameters?.startFlangeType ?? "", width);
  line.parameters?.endFlange &&
    drawFlange(svg, end, start, line.parameters?.endFlangeType ?? "", width);
}

function drawFlange(
  svg: Svg,
  start: THREE.Vector2,
  end: THREE.Vector2,
  type: string,
  width = 1
) {
  const v = getPosByDistance2D(width * 3, start, end);
  if (!v.x && !v.y) return;
  const vA = v.clone().rotateAround(start, deg90InRad);
  const vB = v.clone().rotateAround(start, -deg90InRad);
  _2D.drawLine(svg, vA, vB, width);
  if ("Blind" === type) {
    const v1 = getPosByDistance2D(width + 2, start, end);
    const v2 = getPosByDistance2D(width * 3, v1, end);
    const v2A = v2.clone().rotateAround(v1, deg90InRad);
    const v2B = v2.clone().rotateAround(v1, -deg90InRad);
    _2D.drawLine(svg, v2A, v2B, width);
  }
}

function drawCap(
  svg: Svg,
  start: THREE.Vector2,
  end: THREE.Vector2,
  width = 1
) {
  const v = getPosByDistance2D(width * 5, end, start);
  const vA = v.clone().rotateAround(end, deg90InRad);
  const vB = v.clone().rotateAround(end, -deg90InRad);
  _2D.drawLine(svg, vA, vB, width);
  const startPos = vA.clone();
  for (let i = 0; i < 4; i++) {
    const endPos = startPos.clone().rotateAround(end, deg45InRad);
    _2D.drawLine(svg, startPos, endPos, width);
    startPos.copy(endPos);
  }
}

export { getPaIDdata, getIsometricPaIDdata, drawPaID };
