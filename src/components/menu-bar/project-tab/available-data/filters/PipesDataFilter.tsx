import { FormGroup } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import { PipeProfile } from "../../../../../store/data/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";

type Props = {
  data: PipeProfile[];
  onChange: (data: PipeProfile[]) => any;
};

export default function PipesDataFilter({ data, onChange }: Props) {
  const [lib, setLib] = useState<string>();
  const [nps, setNPS] = useState<string>();
  const [schedule, setSchedule] = useState<string>();

  const npss = useMemo(() => {
    return getDataFieldValues(data, "nps");
  }, [data]);

  const schedules = useMemo(() => {
    return getDataFieldValues(data, "schedule");
  }, [data]);

  const libs = useMemo(() => {
    return getDataFieldValues(data, "country_code");
  }, [data]);

  useEffect(() => {
    const id = setTimeout(() => {
      onChange(filterData(data, { lib, nps, schedule }));
    }, 200);
    return () => clearTimeout(id);
  }, [data, lib, nps, schedule]);

  return (
    <>
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
        <div className="w-mc p-start-10">NPS</div>
        <FormGroup className="no-m w-100">
          <SimpleSelector<string>
            items={npss}
            selected={nps}
            itemLabel={(item) => item}
            onSelect={setNPS}
            clearable={true}
          />
        </FormGroup>
      </div>
      <div className="d-flex f-ai-center bg-gray p-end-10 label-light bg-dark">
        <div className="w-mc p-start-10">Schedule</div>
        <FormGroup className="no-m w-100">
          <SimpleSelector<string>
            items={schedules}
            selected={schedule}
            itemLabel={(item) => item}
            onSelect={setSchedule}
            clearable={true}
          />
        </FormGroup>
      </div>
    </>
  );
}

function getDataFieldValues(
  data: PipeProfile[],
  field: "nps" | "schedule" | "country_code"
) {
  return Array.from(
    new Set(
      data.map((item) => {
        if (field === "nps") {
          // @ts-ignore
          if (!item[field]) {
            return item["nominal_pipe_size_inch"];
            // @ts-ignore
          } else return item[field];
        } else return item[field];
      })
    )
  );
}

type FilterProps = {
  lib?: string;
  schedule?: string;
  nps?: string;
};

function filterData(data: PipeProfile[], props: FilterProps) {
  let filtered: PipeProfile[] = [...data];
  if (props.lib) {
    filtered = filtered.filter((item) => item.country_code === props.lib);
  }
  if (props.nps) {
    filtered = filtered.filter(
      (item) => item.nominal_pipe_size_inch === props.nps
    );
  }
  if (props.schedule) {
    filtered = filtered.filter((item) => item.schedule === props.schedule);
  }
  return filtered;
}
