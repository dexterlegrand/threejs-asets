import React, { useCallback, useEffect, useMemo } from "react";
import { TDataField, TField, THeader } from "./GenericTable";
import { CheckBoxCell, CheckBoxCellProps } from "../CheckBoxCell";
import { InputCellProps, InputCell } from "../InputCell";
import { NumericCellProps, NumericCell } from "../NumericCell";
import { SelectorCellProps, SelectorCell } from "../SelectorCell";
import { ValueValidatorProps, ValueValidator } from "../ValueValidator";
import { setDefaultCellWidth } from "../../3d-models/utils";

type GenericTableBodyProps = {
  table: HTMLTableElement | null;
  header: THeader;
  dataFields: TDataField[];
  selected: number[];
  setSelected: (elements: number[] | ((elements: number[]) => number[])) => any;
  onDelete?: (elements: TDataField[]) => any;
};

export default React.memo(function GenericTableBody(
  props: GenericTableBodyProps
) {
  const columnCount = useMemo(() => {
    return props.header.rows.reduce((count, r) => {
      return (
        count +
        r.columns.reduce((count, c) => {
          return !c.colSpan ? count + 1 : count;
        }, 0)
      );
    }, 0);
  }, [props.header]);

  useEffect(() => {
    setDefaultCellWidth(props.table, columnCount);
  }, [props.table, columnCount]);

  const onSelect = useCallback(
    (id: any, checked: boolean) => {
      props.setSelected((prev) =>
        checked ? [...prev, id] : prev.filter((p) => p !== id)
      );
    },
    [props.setSelected]
  );

  const drawFields = useCallback(
    (dataField: TDataField, index: number) => {
      return (
        <tr key={index}>
          {props.onDelete ? (
            <CheckBoxCell
              key={index}
              value={props.selected.includes(dataField.id)}
              onChange={(val) => onSelect(dataField.id, val)}
            />
          ) : null}

          {dataField.fields.map(drawField)}
        </tr>
      );
    },
    [onSelect, props.onDelete, props.selected]
  );

  return <tbody>{props.dataFields.map(drawFields)}</tbody>;
});

function drawField(field: TField, index: number) {
  switch (field.type) {
    case "CHECKBOX": {
      const params = field.props as CheckBoxCellProps;
      return <CheckBoxCell key={index} {...params} />;
    }
    case "INPUT": {
      const params = field.props as InputCellProps;
      return <InputCell key={index} {...params} />;
    }
    case "NUMERIC": {
      const params = field.props as NumericCellProps;
      return <NumericCell key={index} {...params} />;
    }
    case "SELECTOR": {
      const params = field.props as SelectorCellProps<any>;
      return <SelectorCell key={index} {...params} />;
    }
    case "VALIDATOR": {
      const params = field.props as ValueValidatorProps;
      return (
        <td key={index}>
          <ValueValidator {...params} />
        </td>
      );
    }
    case "CELL":
      return <td key={index}>{field.value}</td>;
    case "CUSTOM":
      return <td key={index}>{field.element}</td>;
    default:
      return <td key={index} />;
  }
}
