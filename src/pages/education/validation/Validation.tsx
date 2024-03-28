import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button, H4, Popover } from "@blueprintjs/core";
import { TCourse, TValidation } from "../../../store/learnings/types";
import GenericTableBody from "../../../components/common/table/GenericTableBody";
import GenericTableHeader from "../../../components/common/table/GenericTableHeader";
import {
  getLocalStorageImage,
  getNextId,
} from "../../../components/3d-models/utils";
import {
  THeader,
  TDataField,
  TField,
} from "../../../components/common/table/GenericTable";
import { SimpleInput } from "../../../components/common/SimpleInput";

type Props = {
  course: TCourse;
  onChange: (validations: TValidation[]) => any;
};

export function Validation({ course, onChange }: Props) {
  const [isEditable, setEditable] = useState<boolean>(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [png, setPng] = useState("");

  const tableRef = useRef<HTMLTableElement>(null);

  const header: THeader = useMemo(() => {
    return {
      rows: [
        { columns: [{ title: "Description" }, { colSpan: 3, title: "Link" }] },
      ],
    };
  }, []);

  const dataFields: TDataField[] = useMemo(() => {
    const dataFields: TDataField[] =
      course.validations?.map((r) => {
        const fields: TField[] = [
          {
            type: "INPUT",
            props: {
              value: r.title,
              disabled: !isEditable,
              targetClassName: "f-jc-start f-weight-b p-20h",
              onChange: (v: any) => handleChange(r, "title", v),
            },
          },
          {
            type: "CUSTOM",
            element:
              r.document || isEditable ? (
                <Popover
                  fill={true}
                  minimal={true}
                  position={"bottom"}
                  boundary={"viewport"}
                  popoverClassName={"p-5 bg-gray"}
                  targetClassName={"h-100p"}
                  className={"h-100p"}
                  disabled={!isEditable}
                  content={
                    <SimpleInput
                      autoFocus={true}
                      value={r.document}
                      onChange={(v) => {
                        v && r.document !== v && handleChange(r, "document", v);
                      }}
                    />
                  }
                  target={
                    <Button
                      text={"Document"}
                      minimal
                      intent={"primary"}
                      className={"f-weight-b"}
                      disabled={isEditable}
                      onClick={() => window.open(r.document, "_blank")}
                    />
                  }
                />
              ) : (
                undefined
              ),
          },
          {
            type: "CUSTOM",
            element:
              r.video || isEditable ? (
                <Popover
                  fill={true}
                  minimal={true}
                  position={"bottom"}
                  boundary={"viewport"}
                  popoverClassName={"p-5 bg-gray"}
                  targetClassName={"h-100p"}
                  className={"h-100p"}
                  disabled={!isEditable}
                  content={
                    <SimpleInput
                      autoFocus={true}
                      value={r.video}
                      onChange={(v) => {
                        v && r.video !== v && handleChange(r, "video", v);
                      }}
                    />
                  }
                  target={
                    <Button
                      text={"Video"}
                      minimal
                      intent={"primary"}
                      className={"f-weight-b"}
                      disabled={isEditable}
                      onClick={() => window.open(r.video, "_blank")}
                    />
                  }
                />
              ) : (
                undefined
              ),
          },
          {
            type: "CUSTOM",
            element:
              r.files || isEditable ? (
                <Popover
                  fill={true}
                  minimal={true}
                  position={"bottom"}
                  boundary={"viewport"}
                  popoverClassName={"p-5 bg-gray"}
                  targetClassName={"h-100p"}
                  className={"h-100p"}
                  disabled={!isEditable}
                  content={
                    <SimpleInput
                      autoFocus={true}
                      value={r.files}
                      onChange={(v) => {
                        v && r.files !== v && handleChange(r, "files", v);
                      }}
                    />
                  }
                  target={
                    <Button
                      text={"Native Files"}
                      minimal
                      intent={"primary"}
                      className={"f-weight-b"}
                      disabled={isEditable}
                      onClick={() => window.open(r.files, "_blank")}
                    />
                  }
                />
              ) : (
                undefined
              ),
          },
        ];
        return { id: r.id, fields };
      }) ?? [];
    return dataFields;
  }, [course.validations, isEditable]);

  useEffect(() => {
    if (!course.img) return;
    setPng(localStorage.getItem(course.img) || "");
    getLocalStorageImage(course.img).then((data) => data && setPng(data));
  }, [course.img]);

  function handleAdd() {
    onChange([
      ...(course.validations ?? []),
      { id: getNextId(course.validations), title: "" },
    ]);
  }

  function handleChange(r: TValidation, field: string, value: any) {
    course.validations &&
      onChange(
        course.validations.map((t) =>
          t.id === r.id ? { ...t, [field]: value } : t
        )
      );
  }

  function handleDelete() {
    course.validations &&
      onChange(course.validations.filter((t) => !selected.includes(t.id)));
    setSelected([]);
  }

  function handleImport() {
    // importFromCSV();
  }

  return (
    <div className={"d-flex f-column f-grow"}>
      <div className={"d-flex f-ai-start p-20h"} style={{ gap: 16 }}>
        <img height={75} width={75} src={png} alt={"Course image"} />
        <div className={"d-flex f-column"}>
          <H4>{course.name}</H4>
          <div className="d-flex label-light f-ai-center">
            <Button text="Add Topic" intent="primary" onClick={handleAdd} />
            <Button
              text="Edit Topic"
              intent="primary"
              onClick={() => setEditable((prev) => !prev)}
            />
            <Button
              text="Delete Topic"
              intent="primary"
              onClick={handleDelete}
            />
            <Button
              text="CSV Upload"
              intent="success"
              disabled={true}
              onClick={handleImport}
            />
          </div>
        </div>
      </div>
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="light-table">
            <GenericTableHeader
              table={tableRef.current}
              selected={selected}
              setSelected={setSelected}
              header={header}
              dataFields={dataFields}
              onDelete={handleDelete}
            />
            <GenericTableBody
              table={tableRef.current}
              header={header}
              dataFields={dataFields}
              selected={selected}
              setSelected={setSelected}
              onDelete={handleDelete}
            />
          </table>
        </div>
      </div>
    </div>
  );
}
