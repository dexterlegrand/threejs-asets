import { FormGroup } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import { ProfileSection, Section } from "../../../../../store/data/types";
import { SimpleInput } from "../../../../common/SimpleInput";
import { SimpleSelector } from "../../../../common/SimpleSelector";

type Props = {
  data: ProfileSection[];
  onChange: (data: ProfileSection[]) => any;
};

export default function SectionsFilter({ data, onChange }: Props) {
  const [designation, setDesignation] = useState("");
  const [lib, setLib] = useState<string>();
  const [type, setType] = useState<string>();
  const [shape, setShape] = useState<string>();

  const types = useMemo(() => {
    //console.log(getDataFieldValues(data, "type"));
    return getDataFieldValues(data, "type");
  }, [data]);

  const shapes = useMemo(() => {
    return getDataFieldValues(data, "shape");
  }, [data]);

  const libs = useMemo(() => {
    return getDataFieldValues(data, "country_code");
  }, [data]);

  useEffect(() => {
    const id = setTimeout(() => {
      onChange(filterData(data, { designation, type, lib, shape }));
    }, 200);
    return () => clearTimeout(id);
  }, [data, designation, type, lib, shape]);

  return (
    <>
      <div className="d-flex f-ai-center bg-gray p-end-10 label-light bg-dark">
        <div className="w-mc p-start-10">Designation</div>
        <FormGroup className="no-m w-100">
          <SimpleInput value={designation} onChange={setDesignation} />
        </FormGroup>
      </div>
      <div className="d-flex f-ai-center bg-gray p-end-10 label-light bg-dark">
        <div className="w-mc p-start-10">Country Code</div>
        <FormGroup className="no-m w-100">
          <SimpleSelector<string>
            items={libs}
            selected={lib}
            itemLabel={(item) => item}
            onSelect={setLib}
            clearable={true}
          />
        </FormGroup>
      </div>
      <div className="d-flex f-ai-center bg-gray p-end-10 label-light bg-dark">
        <div className="w-mc p-start-10">Type</div>
        <FormGroup className="no-m w-100">
          <SimpleSelector<string>
            items={types}
            selected={type}
            itemLabel={(item) => item}
            onSelect={setType}
            clearable={true}
          /> 
        </FormGroup>
      </div>
      <div className="d-flex f-ai-center bg-gray p-end-10 label-light bg-dark">
        <div className="w-mc p-start-10">Shape</div>
        <FormGroup className="no-m w-100">
          <SimpleSelector<string>
            items={shapes}
            selected={shape}
            itemLabel={(item) => item}
            onSelect={setShape}
            clearable={true}
          />
        </FormGroup>
      </div>
    </>
  );
}

function getDataFieldValues(
  data: ProfileSection[],
  field: "type" | "shape" | "country_code"
) {
  return Array.from(new Set(data.map((item) => item[field])));
}

type FilterProps = {
  designation: string;
  type?: string;
  shape?: string;
  lib?: string;
};

function filterData(data: ProfileSection[], props: FilterProps) {
  const designation = props.designation.toLowerCase();
  let filtered: ProfileSection[] = [...data];
  if (props.lib) {
    filtered = filtered.filter((item) => item.country_code === props.lib);
  }
  if (props.type) {
    filtered = filtered.filter((item) => item.type === props.type);
  }
  if (props.shape) {
    filtered = filtered.filter((item) => item.shape === props.shape);
  }
  if (designation) {
    filtered = filtered.filter((item) =>
      item.designation.toLowerCase().includes(designation)
    );
  }
  return filtered;
}
