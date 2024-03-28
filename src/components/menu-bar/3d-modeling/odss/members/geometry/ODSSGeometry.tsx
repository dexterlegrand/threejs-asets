import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { Section } from "../../../../../../store/data/types";
import {
  ODSS,
  ODSSBeamElement,
  ODSSUserDefinedSection,
} from "../../../../../../store/main/odssTypes";
import { getCurrentProject } from "../../../../../3d-models/utils";
import { Paginator } from "../../../../../common/Paginator";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../../../common/table/GenericTable";

export default function ODSSGeometry() {
  const [rows, setRows] = useState<TDataField[]>([]);

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const profiles = useSelector(
    (state: ApplicationState) => state.data.profileSectionData
  );

  const items: TDataField[] = useMemo(() => {
    if (!project || !project.odss) return [];
    return getAllElements(project.odss, [
      ...profiles,
      ...(project.userDefinedSectionsOfStaad ?? []),
    ]);
  }, [project?.odss, profiles]);

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">ODSS Elements Geometry</div>
      <div className="hr" />
      <GenericTable header={header} dataFields={rows} />
      <div className="hr" />
      <Paginator items={items} onChange={setRows} />
    </div>
  );
}

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Model" },
        { title: "Element" },
        { title: "C/S Library" },
        { title: "Profile" },
        { title: "Start Node" },
        { title: "End Node" },
        { title: "Orientation" },
      ],
    },
  ],
};

function getAllElements(
  models: ODSS[],
  profiles: (Section | ODSSUserDefinedSection)[]
) {
  let items: TDataField[] = [];
  for (const model of models) {
    items = [...items, ...getModelElements(model, profiles)];
  }
  return items;
}

function getModelElements(
  model: ODSS,
  profiles: (Section | ODSSUserDefinedSection)[]
) {
  return Object.values(model.BeamElements).map((el) => {
    return {
      id: el.Label,
      fields: getElementFields(model, el, profiles),
    };
  });
}

function getElementFields(
  model: ODSS,
  element: ODSSBeamElement,
  profiles: (Section | ODSSUserDefinedSection)[]
): TField[] {
  const profile = profiles.find(
    (profile) =>
      // @ts-ignore
      profile.designation?.toLowerCase() ===
        element.SectionName.toLowerCase() ||
      profile.name?.toLowerCase() === element.SectionName.toLowerCase()
  );
  return [
    { type: "CELL", value: model.name },
    { type: "CELL", value: element.Label },
    // @ts-ignore
    { type: "CELL", value: profile?.country_code },
    // @ts-ignore
    { type: "CELL", value: profile?.designation ?? profile?.name },
    { type: "CELL", value: element.Nodes[0] },
    { type: "CELL", value: element.Nodes[1] },
    { type: "CELL", value: element.Orientation ?? 0 },
  ];
}
