import React, { useState, useMemo } from "react";
import { Button, FormGroup, InputGroup, Checkbox } from "@blueprintjs/core";
import { CustomDlg } from "../common/CustomDlg";
import { SimpleSelector } from "../common/SimpleSelector";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../store";
import { getUnicuesArray, getCurrentProject, strFilter } from "../3d-models/utils";
import { SimpleNumericInput } from "../common/SimpleNumericInput";

type Props = {
  onClose: () => any;
  onSubmit: (res: Result) => any;
};

type Result = {
  name: string;
  line?: number;
  size?: string;
  min?: { x: number; y: number; z: number } | false;
  max?: { x: number; y: number; z: number } | false;
  insulation?: string;
};

export function PipeSearcher(props: Props) {
  const { onClose, onSubmit } = props;
  const [value, setValue] = useState<string>("");
  const [line, setLine] = useState<number>();
  const [size, setSize] = useState<string>();
  const [byPoints, setByPoints] = useState<boolean>(false);
  const [min, setMin] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [max, setMax] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [insulation, setInsulation] = useState<string>();

  const profiles = useSelector((state: ApplicationState) => state.data.pipingSS);
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const lines = useMemo(() => {
    if (!project) return [];
    return project.freePipes ? getUnicuesArray(project.freePipes.map((i) => i.line)) : [];
  }, [project]);

  const sizes = useMemo(() => {
    return getUnicuesArray(profiles.map((p) => p.nominal_pipe_size_inch));
  }, [profiles]);

  const insulations = useMemo(() => {
    if (!project) return [];
    return getUnicuesArray(
      project.pipeLoadings.deadLoad.insulations.map((i) =>
        i.type ? `${i.thickness} - ${i.type}` : `${i.thickness}`
      )
    );
  }, [project]);

  function submit() {
    onSubmit({
      name: value.trim(),
      line,
      size,
      min: byPoints && min,
      max: byPoints && max,
      insulation,
    });
  }

  return (
    <CustomDlg
      isMinimize={true}
      title={"Search"}
      position={"center"}
      onClose={onClose}
      zIndex={5}
      body={
        <div className={"d-flex f-column"}>
          <FormGroup>
            <InputGroup
              autoFocus
              leftIcon={"search"}
              placeholder={"Name"}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setValue(event.currentTarget.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </FormGroup>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-180">Search Between Points:</div>
            <FormGroup className="no-m f-grow">
              <Checkbox checked={byPoints} onChange={(e) => setByPoints(e.currentTarget.checked)} />
            </FormGroup>
          </div>

          {byPoints ? (
            <>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Min X:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={min.x}
                    onChange={(x) => setMin({ ...min, x })}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Min Y:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={min.y}
                    onChange={(y) => setMin({ ...min, y })}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Min Z:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={min.z}
                    onChange={(z) => setMin({ ...min, z })}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Max X:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={max.x}
                    onChange={(x) => setMax({ ...max, x })}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Max Y:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={max.y}
                    onChange={(y) => setMax({ ...max, y })}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Max Z:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleNumericInput
                    isDecimal={true}
                    value={max.z}
                    onChange={(z) => setMax({ ...max, z })}
                  />
                </FormGroup>
              </div>
            </>
          ) : null}

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Line: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<number>
                items={lines}
                itemLabel={(val) => `${val}`}
                selected={line}
                onSelect={setLine}
                filter={(q, item) => (q ? `${item}`.includes(q) : true)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Size: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<string>
                items={sizes}
                itemLabel={(val) => val}
                selected={size}
                onSelect={setSize}
                className={"fill-select"}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-90">Insulation: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<string>
                items={insulations}
                itemLabel={(val) => val}
                selected={insulation}
                onSelect={setInsulation}
                filter={strFilter}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
        </div>
      }
      actions={
        <>
          <Button text={"Cancel"} onClick={onClose} />
          <Button text={"Ok"} onClick={submit} intent={"primary"} />
        </>
      }
    />
  );
}
