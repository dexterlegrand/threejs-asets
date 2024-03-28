import React, { useMemo } from "react";
import { CheckBoxCell } from "./CheckBoxCell";

interface Props {
  rowSpan?: number;
  data: any[];
  title?: string;
  field?: string;
  onChange: (data: any[]) => any;
}

export function GeneralCheckBoxCell(props: Props) {
  const checked = useMemo(() => {
    const field = props.field ?? "selected";
    return props.data.length ? !props.data.some((item) => !item[field]) : false;
  }, [props.data]);

  const indeterminate = useMemo(() => {
    const field = props.field ?? "selected";
    return props.data.some((item) => item[field]) && props.data.some((item) => !item[field]);
  }, [props.data]);

  function handleChangeData(value: boolean) {
    const field = props.field ?? "selected";
    props.onChange(props.data.map((item) => ({ ...item, [field]: value })));
  }

  return (
    <CheckBoxCell
      cellType={"th"}
      title={props.title}
      rowSpan={props.rowSpan}
      indeterminate={indeterminate}
      value={checked}
      onChange={handleChangeData}
    />
  );
}
