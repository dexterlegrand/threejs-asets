import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changeFlareSegment,
  createFlareSegment,
  deleteFlareSegments,
} from "../../../../../services/flare-services/flare-service";
import { ApplicationState } from "../../../../../store";
import { Material } from "../../../../../store/data/types";
import { changeFlareAction } from "../../../../../store/main/actions";
import { TFlare, TFlareSegment } from "../../../../../store/main/types/flare";
import { getCurrentProject, MMtoM } from "../../../../3d-models/utils";
import { NumericCellProps } from "../../../../common/NumericCell";
import { SelectorCellProps } from "../../../../common/SelectorCell";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../../common/table/GenericTable";

const header: THeader = {
  rows: [
    {
      columns: [
        { rowSpan: 2, title: "Model" },
        { rowSpan: 2, title: "Segment" },
        { rowSpan: 2, title: "Lower Elevation (m)" },
        { rowSpan: 2, title: "Upper Elevation (m)" },
        { rowSpan: 2, title: "Lower Inner Diameter (m)" },
        { rowSpan: 2, title: "Upper Inner Diameter (m)" },
        { rowSpan: 2, title: "Thickness (mm)" },
        { rowSpan: 2, title: "Corrosion allowance (mm)" },
        { rowSpan: 2, title: "Material" },
        { rowSpan: 2, title: "Minimum Design Temperature (°C)" },
        { rowSpan: 2, title: "Maximum Design Temperature (°C)" },
        { colSpan: 4, title: "Refractory" },
      ],
    },
    {
      columns: [
        { title: "Thickness (mm)" },
        { title: "Lower Internal Diameter (m)" },
        { title: "Upper Internal Diameter (m)" },
        { title: "Density (Kg/m^3)" },
      ],
    },
  ],
};

export default function SegemntsParameters() {
  const [flare, setFlare] = useState<TFlare>();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const materials = useSelector(
    (state: ApplicationState) => state.data.materials
  );

  const dispatch = useDispatch();

  const handleAdd = () => {
    if (flare) dispatch(changeFlareAction(createFlareSegment(flare)));
  };

  const handleChange = (segment: TFlareSegment, field: string, value: any) => {
    if (flare)
      dispatch(
        changeFlareAction(
          changeFlareSegment(flare, { ...segment, [field]: value })
        )
      );
  };

  const handleDelete = (elements: TDataField[]) => {
    if (flare)
      dispatch(
        changeFlareAction(
          deleteFlareSegments(
            flare,
            elements.map((e) => e.id)
          )
        )
      );
  };

  const flares: TFlare[] = useMemo(() => {
    return project?.flares ?? [];
  }, [project?.flares]);

  const fields: TDataField[] = useMemo(() => {
    const dataFields: TDataField[] = [];
    if (flare) {
      for (let i = 0; i < flare.segments.length; i++) {
        const prev = flare.segments[i - 1];
        const segment = flare.segments[i];
        const fields: TField[] = [
          { type: "CELL", value: flare.name },
          { type: "CELL", value: segment.name },
          {
            type: "NUMERIC",
            props: {
              min: prev ? prev.bottomElevation_M + 0.001 : 0,
              isDecimal: true,
              value: segment.bottomElevation_M,
              onChange: (val) =>
                handleChange(segment, "bottomElevation_M", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              isDecimal: true,
              value: segment.topElevation_M,
              onChange: (val) => handleChange(segment, "topElevation_M", val),
              contentClassName: "w-100",
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: 0.002,
              isDecimal: true,
              value: segment.bottomInternalDiameter_M,
              onChange: (val) =>
                handleChange(segment, "bottomInternalDiameter_M", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: 0.002,
              isDecimal: true,
              value: segment.topInternalDiameter_M,
              onChange: (val) =>
                handleChange(segment, "topInternalDiameter_M", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: 1,
              value: segment.thickness_MM,
              onChange: (val) => handleChange(segment, "thickness_MM", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: 0,
              value: segment.corrosionAllowance_MM,
              onChange: (val) =>
                handleChange(segment, "corrosionAllowance_MM", val),
            } as NumericCellProps,
          },
          {
            type: "SELECTOR",
            props: {
              items: materials,
              itemKey: (item) => item.material_id,
              itemLabel: (item) => item.material_name,
              selected: segment.material,
              onSelect: (val) => handleChange(segment, "material", val),
              filter: (q, item) =>
                !q ||
                item.material_name.toLowerCase().includes(q.toLowerCase()),
            } as SelectorCellProps<Material>,
          },
          {
            type: "NUMERIC",
            props: {
              max: segment.maxDesignTemperature,
              value: segment.minDesignTemperature,
              onChange: (val) =>
                handleChange(segment, "minDesignTemperature", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: segment.minDesignTemperature,
              value: segment.maxDesignTemperature,
              onChange: (val) =>
                handleChange(segment, "maxDesignTemperature", val),
            } as NumericCellProps,
          },
          {
            type: "NUMERIC",
            props: {
              min: 0,
              isDecimal: true,
              value: segment.refractoryThickness_MM,
              onChange: (val) =>
                handleChange(segment, "refractoryThickness_MM", val),
            } as NumericCellProps,
          },
          {
            type: "CELL",
            value: segment.refractoryThickness_MM
              ? segment.bottomInternalDiameter_M -
                MMtoM(segment.refractoryThickness_MM)
              : "",
          },
          {
            type: "CELL",
            value: segment.refractoryThickness_MM
              ? segment.topInternalDiameter_M -
                MMtoM(segment.refractoryThickness_MM)
              : "",
          },
          {
            type: "NUMERIC",
            props: {
              isDecimal: true,
              value: segment.refractoryDensity,
              onChange: (val) =>
                handleChange(segment, "refractoryDensity", val),
            } as NumericCellProps,
          },
        ];
        dataFields.push({ id: segment.id, fields });
      }
    }
    return dataFields;
  }, [flare]);

  useEffect(() => {
    setFlare(flare ? flares.find((f) => f.id === flare.id) : flares[0]);
  }, [flares, flare]);

  return (
    <GenericTable
      isSmall={true}
      isClosable={true}
      dataFields={fields}
      header={header}
      onAdd={handleAdd}
      onDelete={handleDelete}
      titleElement={
        <SimpleSelector<TFlare>
          items={flares}
          itemLabel={(item) => item.name}
          selected={flare}
          onSelect={setFlare}
          className="fill-select w-155"
        />
      }
      // onExport={handleExport}
      // onImport={handleImport}
    />
  );
}
