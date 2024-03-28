import React from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { DataState } from "../../../store/data/types";
import { Project } from "../../../store/main/types";
import FlareComponent from "./FlareComponent";

type Props = {
  project: Project;
  data: DataState;
};

export default function FlareContainer(props: Props) {
  const scene = useSelector((state: ApplicationState) => state.main.scene);

  return (
    <>
      {props.project.flares?.map((flare) => (
        <FlareComponent key={flare.id} flare={flare} scene={scene} />
      )) ?? null}
    </>
  );
}
