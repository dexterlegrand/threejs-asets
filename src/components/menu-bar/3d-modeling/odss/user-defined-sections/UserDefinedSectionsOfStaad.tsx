import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeProjectAction } from "../../../../../store/main/actions";
import { ODSSUserDefinedSection } from "../../../../../store/main/odssTypes";
import { getCurrentProject, getNextId } from "../../../../3d-models/utils";
import { InputCellProps } from "../../../../common/InputCell";
import { NumericCellProps } from "../../../../common/NumericCell";
import GenericTable, {
  TDataField,
  THeader,
} from "../../../../common/table/GenericTable";

export default function UserDefinedSectionsOfStaad() {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  const handleAdd = useCallback(() => {
    if (!project?.userDefinedSectionsOfStaad) return;
    dispatch(
      changeProjectAction({
        ...project,
        userDefinedSectionsOfStaad: [
          ...project.userDefinedSectionsOfStaad,
          {
            ...init,
            id: getNextId(project.userDefinedSectionsOfStaad),
          },
        ],
      })
    );
  }, [project?.userDefinedSectionsOfStaad]);

  const handleDelete = useCallback(
    (elements: TDataField[]) => {
      if (!project?.userDefinedSectionsOfStaad) return;
      dispatch(
        changeProjectAction({
          ...project,
          userDefinedSectionsOfStaad: project.userDefinedSectionsOfStaad.filter(
            (uds) => !elements.some((e) => e.id === uds.id)
          ),
        })
      );
    },
    [project?.userDefinedSectionsOfStaad]
  );

  const handleChange = useCallback(
    (id: number, field: string, val: any) => {
      if (!project?.userDefinedSectionsOfStaad) return;
      dispatch(
        changeProjectAction({
          ...project,
          userDefinedSectionsOfStaad: project.userDefinedSectionsOfStaad.map(
            (uds) => {
              return uds.id === id ? { ...uds, [field]: val } : uds;
            }
          ),
        })
      );
    },
    [project?.userDefinedSectionsOfStaad]
  );

  const items: TDataField[] = useMemo(() => {
    if (!project?.userDefinedSectionsOfStaad) return [];
    return getDataFields(project.userDefinedSectionsOfStaad, handleChange);
  }, [project?.userDefinedSectionsOfStaad, handleChange]);

  return (
    <div className="d-flex f-column f-grow">
      <div className="hr" />
      <div className="label-light bg-dark">User Defined Sections of Staad</div>
      <div className="hr" />
      <GenericTable
        header={header}
        dataFields={items}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />
    </div>
  );
}

const init: ODSSUserDefinedSection = {
  id: 0,
  name: "",
  area: 0,
  height: 0,
  width: 0,
  lx: 0,
  ly: 0,
  lz: 0,
  type: "Prismatic",
};

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Name" },
        { title: "Type" },
        { title: "Area" },
        { title: "lx" },
        { title: "ly" },
        { title: "lz" },
        { title: "Width" },
        { title: "Height" },
      ],
    },
  ],
};

function getDataFields(
  udss: ODSSUserDefinedSection[],
  onChange: (id: number, field: string, value: any) => any
): TDataField[] {
  return udss.map((uds) => getDataField(uds, onChange));
}

function getDataField(
  uds: ODSSUserDefinedSection,
  onChange: (id: number, field: string, value: any) => any
): TDataField {
  return {
    id: uds.id,
    fields: [
      {
        type: "INPUT",
        props: {
          value: uds.name,
          onChange: (val) => onChange(uds.id, "name", val),
        } as InputCellProps,
      },
      { type: "CELL", value: uds.type },
      {
        type: "NUMERIC",
        props: {
          min: 0,
          value: uds.area,
          onChange: (val) => onChange(uds.id, "area", val),
        } as NumericCellProps,
      },
      {
        type: "NUMERIC",
        props: {
          value: uds.lx,
          onChange: (val) => onChange(uds.id, "lx", val),
        } as NumericCellProps,
      },
      {
        type: "NUMERIC",
        props: {
          value: uds.ly,
          onChange: (val) => onChange(uds.id, "ly", val),
        } as NumericCellProps,
      },
      {
        type: "NUMERIC",
        props: {
          value: uds.lz,
          onChange: (val) => onChange(uds.id, "lz", val),
        } as NumericCellProps,
      },
      {
        type: "NUMERIC",
        props: {
          min: 0,
          value: uds.width,
          onChange: (val) => onChange(uds.id, "width", val),
        } as NumericCellProps,
      },
      {
        type: "NUMERIC",
        props: {
          min: 0,
          value: uds.height,
          onChange: (val) => onChange(uds.id, "height", val),
        } as NumericCellProps,
      },
    ],
  };
}
