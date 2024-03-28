import { getNextId } from "../../components/3d-models/utils";
import { TFlare, TFlareSegment } from "../../store/main/types/flare";

export function createFlareSegment(flare: TFlare): TFlare {
  const last = flare.segments[flare.segments.length - 1];
  if (!last) return flare;
  const id = getNextId(flare.segments);
  const newSegment: TFlareSegment = {
    ...last,
    id,
    name: `FS${id}`,
    bottomElevation_M: last.topElevation_M,
    topElevation_M: last.topElevation_M + 1,
    bottomInternalDiameter_M: last.topInternalDiameter_M,
    topInternalDiameter_M: last.topInternalDiameter_M,
  };
  const segments = [...flare.segments, newSegment];
  const changed = { ...flare, segments };
  return changed;
}

export function changeFlareSegment(
  flare: TFlare,
  segment: TFlareSegment
): TFlare {
  const segments = flare.segments.map((s) => {
    return s.id === segment.id ? segment : s;
  });
  const changed = { ...flare, segments };
  return changed;
}

export function deleteFlareSegments(flare: TFlare, ids: number[]): TFlare {
  const segments = flare.segments.filter((s) => !ids.includes(s.id));
  const changed = { ...flare, segments };
  return changed;
}

export function deleteFlareSegment(flare: TFlare, id: number) {
  const segments = flare.segments.filter((s) => s.id !== id);
  const changed = { ...flare, segments };
  return changed;
}

export function fixFlareSegmentElevationsByPrev(
  segment: TFlareSegment,
  prev: TFlareSegment
): TFlareSegment | undefined {
  if (segment.bottomElevation_M === prev.topElevation_M) return;
  const diff = prev.topElevation_M - segment.bottomElevation_M;
  const changed: TFlareSegment = {
    ...segment,
    bottomElevation_M: segment.bottomElevation_M + diff,
    topElevation_M: segment.topElevation_M + diff,
  };
  return changed;
}

export function fixFlareSegmentElevationsByNext(
  segment: TFlareSegment,
  next: TFlareSegment
): TFlareSegment | undefined {
  if (segment.topElevation_M === next.bottomElevation_M) return;
  const diff = next.bottomElevation_M - segment.topElevation_M;
  const changed: TFlareSegment = {
    ...segment,
    topElevation_M: segment.topElevation_M + diff,
  };
  return changed;
}

export function fixFlareSegmentDiameterByPrev(
  segment: TFlareSegment,
  prev: TFlareSegment
): TFlareSegment | undefined {
  if (segment.bottomInternalDiameter_M === prev.topInternalDiameter_M) return;
  const diff = prev.topInternalDiameter_M - segment.bottomInternalDiameter_M;
  const changed: TFlareSegment = {
    ...segment,
    bottomInternalDiameter_M: segment.bottomInternalDiameter_M + diff,
  };
  return changed;
}

export function fixFlareSegmentDiameterByNext(
  segment: TFlareSegment,
  next: TFlareSegment
): TFlareSegment | undefined {
  if (segment.topInternalDiameter_M === next.bottomInternalDiameter_M) return;
  const diff = next.bottomInternalDiameter_M - segment.topInternalDiameter_M;
  const changed: TFlareSegment = {
    ...segment,
    topInternalDiameter_M: segment.topInternalDiameter_M + diff,
  };
  return changed;
}
