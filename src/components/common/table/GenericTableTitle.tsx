import React, { useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { TDataField } from "./GenericTable";

type GenericTableTitleProps = {
  display: boolean;
  selected: number[];
  dataFields: TDataField[];
  title?: string;
  isClosable?: boolean;
  onAdd?: () => any;
  onDelete?: (elements: TDataField[]) => any;
  onExport?: () => any;
  onImport?: () => any;
  setDisplay: (display: boolean | ((display: boolean) => boolean)) => any;
  setSelected?: (elements: number[]) => any;
  titleElement?: JSX.Element;
};

export default React.memo(function GenericTableTitle(props: GenericTableTitleProps) {
  const title = useMemo(() => {
    return (
      props.isClosable ||
      props.title ||
      props.onAdd ||
      props.onDelete ||
      props.onExport ||
      props.onImport
    );
  }, [props.isClosable, props.title, props.onAdd, props.onDelete, props.onExport, props.onImport]);

  return title ? (
    <>
      <div className="d-flex label-light bg-dark f-ai-center">
        {props.isClosable ? (
          <Button
            small
            minimal
            icon={props.display ? "caret-down" : "caret-right"}
            onClick={() => props.setDisplay((prev) => !prev)}
          />
        ) : null}
        {props.title ? <span>{props.title}</span> : null}
        {props.onDelete ? (
          <Button
            small
            icon="trash"
            text="Delete"
            intent="warning"
            onClick={() => {
              props.onDelete!(props.dataFields.filter((el) => props.selected.includes(el.id)));
              props.setSelected && props.setSelected([]);
            }}
          />
        ) : null}
        {props.onExport ? (
          <Button
            small
            icon="export"
            text="Export to CSV"
            intent="success"
            onClick={props.onExport}
          />
        ) : null}
        {props.onImport ? (
          <Button
            small
            icon="import"
            text="Import from CSV"
            intent="success"
            onClick={props.onImport}
          />
        ) : null}
        {props.onAdd ? (
          <Button small icon="plus" text="Add" intent="danger" onClick={props.onAdd} />
        ) : null}
        {props.titleElement}
      </div>
      <div className="hr" />
    </>
  ) : null;
})
