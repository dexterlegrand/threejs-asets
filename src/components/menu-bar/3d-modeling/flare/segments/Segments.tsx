import React from "react";
import SegemntsParameters from "./SegemntsParameters";
import SegmentsGeometry from "./SegmentsGeometry";

export default function Segments() {
  return (
    <div className="d-flex f-column">
      <SegmentsGeometry />
      <SegemntsParameters />
    </div>
  );
}
