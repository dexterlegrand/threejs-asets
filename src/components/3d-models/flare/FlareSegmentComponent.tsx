import React, { useEffect, useState } from "react";
import { Group } from "three";
import {
  createFlareRefractoryGroup,
  createFlareSegmentGroup,
} from "../../../services/flare-services/flare-geometry-service";
import {
  fixFlareSegmentDiameterByNext,
  fixFlareSegmentDiameterByPrev,
  fixFlareSegmentElevationsByNext,
  fixFlareSegmentElevationsByPrev,
} from "../../../services/flare-services/flare-service";
import { TFlareSegment } from "../../../store/main/types/flare";

type Props = {
  group: Group;
  segment: TFlareSegment;
  prev: TFlareSegment | undefined;
  next: TFlareSegment | undefined;
  onChange: (segment: TFlareSegment) => any;
};

export default function FlareSegmentComponent(props: Props) {
  const [segmentGroup, setSegmentGroup] = useState<Group>();
  const [refractoryGroup, setRefractoryGroup] = useState<Group>();

  useEffect(() => {
    setSegmentGroup(createFlareSegmentGroup(props.segment));
  }, [
    props.segment.topElevation_M,
    props.segment.bottomElevation_M,
    props.segment.topInternalDiameter_M,
    props.segment.bottomInternalDiameter_M,
    props.segment.thickness_MM,
  ]);

  useEffect(() => {
    setRefractoryGroup(
      props.segment.refractoryThickness_MM
        ? createFlareRefractoryGroup(props.segment)
        : undefined
    );
  }, [
    props.segment.topElevation_M,
    props.segment.bottomElevation_M,
    props.segment.topInternalDiameter_M,
    props.segment.bottomInternalDiameter_M,
    props.segment.refractoryThickness_MM,
  ]);

  useEffect(() => {
    if (!segmentGroup) return;
    props.group.add(segmentGroup);
    return () => {
      props.group.remove(segmentGroup);
    };
  }, [props.group, segmentGroup]);

  useEffect(() => {
    if (!refractoryGroup) return;
    props.group.add(refractoryGroup);
    return () => {
      props.group.remove(refractoryGroup);
    };
  }, [props.group, refractoryGroup]);

  useEffect(() => {
    if (!props.prev) return;
    const changed = fixFlareSegmentElevationsByPrev(props.segment, props.prev);
    changed && props.onChange(changed);
  }, [props.prev?.topElevation_M]);

  useEffect(() => {
    if (!props.next) return;
    const changed = fixFlareSegmentElevationsByNext(props.segment, props.next);
    changed && props.onChange(changed);
  }, [props.next?.bottomElevation_M]);

  useEffect(() => {
    if (!props.prev) return;
    const changed = fixFlareSegmentDiameterByPrev(props.segment, props.prev);
    changed && props.onChange(changed);
  }, [props.prev?.topInternalDiameter_M]);

  useEffect(() => {
    if (!props.next) return;
    const changed = fixFlareSegmentDiameterByNext(props.segment, props.next);
    changed && props.onChange(changed);
  }, [props.next?.bottomInternalDiameter_M]);

  return null;
}
