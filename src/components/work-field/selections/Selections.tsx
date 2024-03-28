import React from "react";
import PipeSelections from "./piping/PipeSelections";
import ProcessSelections from "./process/ProcessSelections";
import StructureSelections from "./structures/StructureSelections";

export default function Selections() {
  return (
    <>
      <ProcessSelections />
      <PipeSelections />
      <StructureSelections />
    </>
  );
}
