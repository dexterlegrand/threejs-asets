import React, { useRef, useMemo, useState } from "react";
import { CheckBoxCellProps } from "../CheckBoxCell";
import { InputCellProps } from "../InputCell";
import { NumericCellProps } from "../NumericCell";
import { SelectorCellProps } from "../SelectorCell";
import { ValueValidatorProps } from "../ValueValidator";
import GenericTableHeader from "./GenericTableHeader";
import GenericTableBody from "./GenericTableBody";
import GenericTableTitle from "./GenericTableTitle";
import { ProgressBar } from "@blueprintjs/core";

export type THeader = {
  rows: THeaderRow[];
};

export type THeaderRow = {
  columns: THeaderColumn[];
};

export type THeaderColumn = {
  rowSpan?: number;
  colSpan?: number;
  title?: string;
  element?: JSX.Element;
};

export interface TField {
  type:
    | "CELL"
    | "CHECKBOX"
    | "INPUT"
    | "NUMERIC"
    | "SELECTOR"
    | "VALIDATOR"
    | "CUSTOM";
  element?: JSX.Element;
  value?: any;
  props?:
    | CheckBoxCellProps
    | InputCellProps
    | NumericCellProps
    | SelectorCellProps<any>
    | ValueValidatorProps;
}

export type TDataField = {
  id: number;
  fields: TField[];
};

interface Props {
  header: THeader;
  dataFields: TDataField[];
  title?: string;
  isClosable?: boolean;
  isSmall?: boolean;
  onAdd?: () => any;
  onDelete?: (elements: TDataField[]) => any;
  onExport?: () => any;
  onImport?: () => any;
  titleElement?: JSX.Element;
  inProgress?: boolean;
}

export default React.memo(function GenericTable(props: Props) {
  const [display, setDisplay] = useState<boolean>(true);
  const [selected, setSelected] = useState<number[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  const container = useMemo(() => {
    return props.isSmall ? "small-table-container" : "table-container";
  }, [props.isSmall]);

  return (
    <>
      <div className="hr" />
      <GenericTableTitle
        display={display}
        selected={selected}
        dataFields={props.dataFields}
        title={props.title}
        isClosable={props.isClosable}
        onAdd={props.onAdd}
        onDelete={props.onDelete}
        onExport={props.onExport}
        onImport={props.onImport}
        setDisplay={setDisplay}
        setSelected={setSelected}
        titleElement={props.titleElement}
      />
      {props.inProgress ? (
        <>
          <ProgressBar />
          <div className={"hr"} />
        </>
      ) : null}
      {display ? (
        <div className={"p-5"}>
          <div className={container}>
            <table ref={tableRef} className="table bg-gray">
              <GenericTableHeader
                table={tableRef.current}
                selected={selected}
                setSelected={setSelected}
                header={props.header}
                dataFields={props.dataFields}
                onDelete={props.onDelete}
              />
              <GenericTableBody
                table={tableRef.current}
                header={props.header}
                dataFields={props.dataFields}
                selected={selected}
                setSelected={setSelected}
                onDelete={props.onDelete}
              />
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
});
