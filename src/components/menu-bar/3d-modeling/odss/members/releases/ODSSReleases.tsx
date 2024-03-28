import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { changeProjectAction } from "../../../../../../store/main/actions";
import { ODSS, ODSSBeamElement } from "../../../../../../store/main/odssTypes";
import { getCurrentProject } from "../../../../../3d-models/utils";
import { CheckBoxCellProps } from "../../../../../common/CheckBoxCell";
import { Paginator } from "../../../../../common/Paginator";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../../../common/table/GenericTable";

export default function ODSSReleases() {
  const [rows, setRows] = useState<TDataField[]>([]);

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  const onChange = useCallback(
    (val: boolean, i: number, el: ODSSBeamElement, model: ODSS) => {
      if (!project?.odss) return;
      const changedEl: ODSSBeamElement = {
        ...el,
        BeamHinges: el.BeamHinges.map((bh, bhi) => (bhi === i ? val : bh)),
      };
      const changed: ODSS = {
        ...model,
        BeamElements: { ...model.BeamElements, [changedEl.Label]: changedEl },
      };
      dispatch(
        changeProjectAction({
          ...project,
          odss: project.odss.map((m) => (m.id === changed.id ? changed : m)),
        })
      );
    },
    [project?.odss]
  );

  const items: TDataField[] = useMemo(() => {
    if (!project || !project.odss) return [];
    return getAllElements(project.odss, onChange);
  }, [project?.odss, onChange]);

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">ODSS Elements Releases</div>
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
        { title: "Fx1" },
        { title: "Fy1" },
        { title: "Fz1" },
        { title: "Mx1" },
        { title: "My1" },
        { title: "Mz1" },
        { title: "Fx2" },
        { title: "Fy2" },
        { title: "Fz2" },
        { title: "Mx2" },
        { title: "My2" },
        { title: "Mz2" },
      ],
    },
  ],
};

function getAllElements(
  models: ODSS[],
  onChange: (val: boolean, i: number, el: ODSSBeamElement, model: ODSS) => any
) {
  let items: TDataField[] = [];
  for (const model of models) {
    items = [
      ...items,
      ...getModelElements(model, (val, i, el) => onChange(val, i, el, model)),
    ];
  }
  return items;
}

function getModelElements(
  model: ODSS,
  onChange: (val: boolean, i: number, el: ODSSBeamElement) => any
) {
  return Object.values(model.BeamElements).map((el) => {
    return {
      id: el.Label,
      fields: getElementFields(model, el, (val, i) => onChange(val, i, el)),
    };
  });
}

function getElementFields(
  model: ODSS,
  element: ODSSBeamElement,
  onChange: (val: boolean, index: number) => any
): TField[] {
  return [
    { type: "CELL", value: model.name },
    { type: "CELL", value: element.Label },
    ...element.BeamHinges.map((h, i) =>
      getCheckBoxField(h, (val) => onChange(val, i))
    ),
  ];
}

function getCheckBoxField(
  value: boolean,
  onChange: (val: boolean) => any
): TField {
  return {
    type: "CHECKBOX",
    value,
    props: {
      value,
      onChange,
    } as CheckBoxCellProps,
  };
}
