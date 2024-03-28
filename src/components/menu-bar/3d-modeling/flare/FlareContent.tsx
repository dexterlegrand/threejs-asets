import React from "react";
import Segments from "./segments/Segments";

type Props = { selected: number };

export default function FlareContent({ selected }: Props) {
  return <>{selected === 0 ? <Segments /> : null}</>;
}
