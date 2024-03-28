import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Scene, Group } from "three";
import { changeFlareSegment } from "../../../services/flare-services/flare-service";
import {
  changeFlareAction,
  deleteFlareAction,
} from "../../../store/main/actions";
import { TFlare, TFlareSegment } from "../../../store/main/types/flare";
import { degToRad } from "../utils";
import FlareSegmentComponent from "./FlareSegmentComponent";

type Props = {
  flare: TFlare;
  scene: Scene;
};

export default function FlareComponent(props: Props) {
  const [group, setGroup] = useState<Group>(new Group());

  const dispatch = useDispatch();

  const onChangeSegment = (segment: TFlareSegment) => {
    dispatch(changeFlareAction(changeFlareSegment(props.flare, segment)));
  };

  useEffect(() => {
    if (!group) return;
    props.scene.add(group);
    return () => {
      props.scene.remove(group);
    };
  }, [props.scene]);

  useEffect(() => {
    if (!group) return;
    group.name = props.flare.name;
  }, [group, props.flare.name]);

  useEffect(() => {
    if (!group) return;
    group.position.set(
      props.flare.position.x,
      props.flare.position.y,
      props.flare.position.z
    );
  }, [group, props.flare.position]);

  useEffect(() => {
    if (!group) return;
    group.rotation.set(0, degToRad(props.flare.rotation ?? 0), 0);
  }, [group, props.flare.rotation]);

  useEffect(() => {
    if (props.flare.segments.length) return;
    dispatch(deleteFlareAction(props.flare));
  }, [props.flare.segments.length]);

  return (
    <>
      {props.flare.segments.map((s, i, arr) => (
        <FlareSegmentComponent
          key={s.id}
          group={group}
          segment={s}
          prev={arr[i - 1]}
          next={arr[i + 1]}
          onChange={onChangeSegment}
        />
      ))}
    </>
  );
}
