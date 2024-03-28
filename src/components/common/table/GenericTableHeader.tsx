import React, { useState, useCallback, useMemo } from "react";
import { THeader, THeaderRow, TDataField, THeaderColumn } from "./GenericTable";
import { GeneralCheckBoxCell } from "../GeneralCheckBoxCell";

type GenericTableHeaderProps = {
  table: HTMLTableElement | null;
  header: THeader;
  dataFields: TDataField[];
  selected: any[];
  onDelete: ((elements: TDataField[]) => any) | undefined;
  setSelected: (elements: any[]) => any;
};

export default React.memo(function GenericTableHeader(
  props: GenericTableHeaderProps
) {
  const [tops, setTops] = useState<number[]>([]);

  const heightCallback = useCallback((node) => {
    if (!node) return;
    const tops: number[] = [...node.rows].map(
      (r: HTMLTableRowElement) => r.offsetTop
    );
    setTops(tops);
  }, []);

  const selectedDataFields = useMemo(() => {
    return props.dataFields.map((el) => ({
      id: el.id,
      selected: props.selected.includes(el.id),
    }));
  }, [props.dataFields, props.selected]);

  const generalCheckBox = useMemo(() => {
    if (!props.onDelete) return null;
    return (
      <GeneralCheckBoxCell
        key={"general-check-box"}
        rowSpan={props.header.rows.length}
        data={selectedDataFields}
        onChange={(data) =>
          props.setSelected(data.filter((el) => el.selected).map((el) => el.id))
        }
      />
    );
  }, [props.onDelete, props.header.rows.length, selectedDataFields]);

  const getHeaderRow = useCallback(
    (row: THeaderRow, index: number) => {
      const top = tops[index];
      return (
        <tr key={index}>
          {!index ? generalCheckBox : null}
          {row.columns.map((c, i) => getHeaderColumn(c, i, top))}
        </tr>
      );
    },
    [tops, generalCheckBox]
  );

  return (
    <thead ref={heightCallback}>{props.header.rows.map(getHeaderRow)}</thead>
  );
});

function getHeaderColumn(column: THeaderColumn, index: number, top: number) {
  return (
    column.element ?? (
      <th
        key={index}
        id={ column.title + '-' + index }
        rowSpan={column.rowSpan}
        colSpan={column.colSpan}
        style={{ top }}
      >
        {column.title}
      </th>
    )
  );
}
