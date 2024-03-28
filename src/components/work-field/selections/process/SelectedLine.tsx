import React, { useCallback, useMemo } from "react";
import { Button, FormGroup, Icon } from "@blueprintjs/core";
import { ApplicationState } from "../../../../store";
import {
  getNextId,
  getPosByDistance,
  getUnicuesArray,
  roundM,
  roundVectorM,
} from "../../../3d-models/utils";
import { useSelector, useDispatch } from "react-redux";
import {
  selectProcessLineAction,
  changeProcessLineAction,
  removeProcessLineAction,
  setProcessAction,
} from "../../../../store/process/actions";
import { SimpleSelector } from "../../../common/SimpleSelector";
import {
  TProcessPipeType,
  TProcessLine,
  TProcessLineSegment,
  TInstrumentationLineType,
  TProcessLineOrder,
  TProcessState,
  TInstrumentationElement,
} from "../../../../store/process/types";
import {
  pipeLineTypes,
  intstrLineTypes,
} from "../../../../store/process/initialState";
import { PipeProfile, Material } from "../../../../store/data/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import {
  addProcessLineSegmentsByOrder,
  updateProcessLine,
} from "../../../3d-models/process/process";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { Vector3 } from "three";

type Props = {
  current: string;
  processState: TProcessState;
  profiles: PipeProfile[];
  disabled: boolean;
};

export function SelectedLine({
  current,
  processState,
  profiles,
  disabled,
}: Props) {
  const materials = useSelector((state: ApplicationState) =>
    state.data.materials.filter((m) => m.material_type === "PIPING")
  );

  const dispatch = useDispatch();

  const item = useMemo(() => {
    return processState.selectedLine;
  }, [processState]);

  function handleChangeOrder(order?: TProcessLineOrder) {
    const p = processState.processes.get(current);
    if (!p || !item?.to) return;
    const instrs = p.instrumentations ?? [];
    const from = p.elements.get(item.from);
    const to = p.elements.get(item.to);
    if (!from || !to) return;
    const res = updateProcessLine({ ...item, order }, from, to, instrs);
    dispatch(
      setProcessAction(current, {
        ...p,
        lines: p.lines?.map((l) => (l.id === res.line.id ? res.line : l)) ?? [],
        instrumentations: res.instrs,
      })
    );
  }

  const handleChangeInitialLength = useCallback(
    (val: number) => {
      if (!item?.to) return;
      const res = recreateProcessLineByInitialLength(item, val, []);
      dispatch(changeProcessLineAction(current, res.line));
    },
    [current, item]
  );

  function handleChangeParameters(field: string, value: any) {
    if (!item) return;
    let changed: TProcessLine = {
      ...item,
      parameters: { ...item.parameters, [field]: value },
    };
    if (field === "nps") {
      changed = {
        ...changed,
        segments: changed.segments.map((s) => ({
          ...s,
          parameters: { ...s.parameters, nps: value, profile: undefined },
        })),
      };
    } else if (field === "schedule") {
      changed = {
        ...changed,
        segments: changed.segments.map((s) => ({
          ...s,
          parameters: {
            ...s.parameters,
            profile: value,
            od: (value as PipeProfile)?.outside_diameter_global,
            thickness: (value as PipeProfile)?.wall_thickness_global,
          },
        })),
      };
    } else if (field === "material") {
      changed = {
        ...changed,
        segments: changed.segments.map((s) => ({
          ...s,
          parameters: { ...s.parameters, material: value },
        })),
      };
    }
    dispatch(changeProcessLineAction(current, changed));
  }

  function handleChangeSegment(
    s: TProcessLineSegment,
    field: string,
    value: any
  ) {
    if (!item) return;
    if (field === "locked") {
      const changed: TProcessLine = {
        ...item,
        segments: item.segments.map((is) =>
          is.id === s.id ? { ...is, [field]: value } : is
        ),
      };
      dispatch(changeProcessLineAction(current, changed));
    } else {
      let changed: TProcessLine = {
        ...item,
        segments: item.segments.map((is) =>
          is.id === s.id
            ? { ...is, parameters: { ...is.parameters, [field]: value } }
            : is
        ),
      };
      if (field === "nps") {
        changed = {
          ...changed,
          segments: changed.segments.map((is) =>
            is.id === s.id
              ? { ...is, parameters: { ...is.parameters, profile: undefined } }
              : is
          ),
        };
      } else if (field === "profile") {
        changed = {
          ...changed,
          segments: changed.segments.map((is) =>
            is.id === s.id
              ? {
                  ...is,
                  parameters: {
                    ...is.parameters,
                    profile: value,
                    od: (value as PipeProfile)?.outside_diameter_global,
                    thickness: (value as PipeProfile)?.wall_thickness_global,
                  },
                }
              : is
          ),
        };
      }
      dispatch(changeProcessLineAction(current, changed));
    }
  }

  function handleRemove() {
    if (!item) return;
    dispatch(removeProcessLineAction(current, item));
  }

  function handleClose() {
    dispatch(selectProcessLineAction(undefined));
  }

  function getLineLength() {
    const p = processState.processes.get(current);
    if (!p) return 0;
    const length =
      p.lines
        ?.filter((l) => l.processLineNo === item?.processLineNo)
        .reduce((l, line) => {
          const ls = line.segments.reduce(
            (ls, s) => ls + s.start.distanceTo(s.end),
            0
          );
          return l + ls;
        }, 0) ?? 0;
    return roundM(length);
  }

  return item ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Connection Line: {item.from} - {item.to}
          </h2>
        </div>
        <Button
          large
          minimal
          icon={"cross"}
          onClick={handleClose}
          intent={"danger"}
        />
      </div>
      <div
        className={"body-grid"}
        style={{
          gridTemplateColumns: "105px 1fr",
        }}
      >
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <div className={"label-light"}>{item.processLineNo}</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Order: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<TProcessLineOrder>
              items={["XYZ", "XZY", "YXZ", "YZX", "ZXY", "ZYX"]}
              itemLabel={(item) => item}
              selected={item.order}
              onSelect={handleChangeOrder}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Initial Length: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className={"f-grow no-m"}>
            <SimpleNumericInput
              min={0}
              isDecimal
              value={item.initialLength}
              onChange={handleChangeInitialLength}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Length: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <div className={"label-light"}>{getLineLength()} m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Type: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<TProcessPipeType | TInstrumentationLineType>
              items={[...pipeLineTypes, ...intstrLineTypes]}
              itemLabel={(item) => item}
              selected={item.parameters?.type}
              onSelect={(val) => handleChangeParameters("type", val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>NPS: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<string>
              items={getUnicuesArray(
                profiles.map((p) => p.nominal_pipe_size_inch)
              )}
              itemLabel={(item) => item}
              selected={item.parameters?.nps}
              onSelect={(val) => handleChangeParameters("nps", val)}
              className={"fill-select"}
              clearable={true}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Schedule: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<PipeProfile>
              items={profiles.filter(
                (p) => p.nominal_pipe_size_inch === item.parameters?.nps
              )}
              itemLabel={(item) => item.schedule}
              selected={item.parameters?.schedule}
              onSelect={(val) => handleChangeParameters("schedule", val)}
              className={"fill-select"}
              clearable={true}
            />
          </FormGroup>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Material: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<Material>
              items={materials}
              itemLabel={(item) => item.material_name}
              selected={item.parameters?.material}
              onSelect={(val) => handleChangeParameters("material", val)}
              className={"fill-select"}
              clearable={true}
            />
          </FormGroup>
        </div>

        {item.segments.map((s, i) => {
          return (
            <React.Fragment key={`${s.id}-${i}`}>
              <div className={"label-light"}>Segment ({i + 1})</div>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-="}>Locked: </div>
              </div>
              <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
                <FormGroup className={"f-grow no-m"}>
                  <CheckBoxCell
                    key={s.id}
                    value={s.locked}
                    onChange={(value) =>
                      handleChangeSegment(s, "locked", value)
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>Length: </div>
              </div>
              <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
                <div className={"label-light"}>
                  {roundM(s.start.distanceTo(s.end))} m
                </div>
              </div>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>NPS: </div>
              </div>
              <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
                <FormGroup className={"f-grow no-m"}>
                  <SimpleSelector<string>
                    items={getUnicuesArray(
                      profiles.map((p) => p.nominal_pipe_size_inch)
                    )}
                    itemLabel={(item) => item}
                    selected={s.parameters?.nps}
                    onSelect={(val) => handleChangeSegment(s, "nps", val)}
                    className={"fill-select"}
                    clearable={true}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>Schedule: </div>
              </div>
              <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
                <FormGroup className={"f-grow no-m"}>
                  <SimpleSelector<PipeProfile>
                    items={profiles.filter(
                      (p) => p.nominal_pipe_size_inch === s.parameters?.nps
                    )}
                    itemLabel={(item) => item.schedule}
                    selected={s.parameters?.profile}
                    onSelect={(val) => handleChangeSegment(s, "profile", val)}
                    className={"fill-select"}
                    clearable={true}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>Material: </div>
              </div>
              <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
                <FormGroup className={"f-grow no-m"}>
                  <SimpleSelector<Material>
                    items={materials}
                    itemLabel={(item) => item.material_name}
                    selected={s.parameters?.material}
                    onSelect={(val) => handleChangeSegment(s, "material", val)}
                    className={"fill-select"}
                    clearable={true}
                  />
                </FormGroup>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <Button
        large
        fill
        text={"Remove"}
        intent={"danger"}
        disabled={disabled}
        onClick={handleRemove}
      />
    </div>
  ) : null;
}

export function recreateProcessLineByInitialLength(
  line: TProcessLine,
  length: number,
  instrs: TInstrumentationElement[]
) {
  const start = new Vector3();
  const end = new Vector3();

  let startSegment: TProcessLineSegment;
  let endSegment: TProcessLineSegment;
  console.log("length", length);
  if (length) {
    startSegment = line.segments[0];
    const endOfStartSegmentPoint = roundVectorM(
      getPosByDistance(length, startSegment.start, startSegment.end)
    );
    startSegment = { ...startSegment, end: endOfStartSegmentPoint.clone() };

    endSegment = line.segments[line.segments.length - 1];
    const startOfEndSegmentPoint = roundVectorM(
      getPosByDistance(length, endSegment.end, endSegment.start)
    );
    endSegment = { ...endSegment, start: startOfEndSegmentPoint.clone() };

    start.copy(endOfStartSegmentPoint);
    end.copy(startOfEndSegmentPoint);
  } else {
    start.copy(line.segments[0].start);
    end.copy(line.segments[line.segments.length - 1].end);
  }

  const availableSegments = line.segments
    .filter((s) => !s.locked)
    .map((s) => ({
      ...s,
      start: roundVectorM(s.start).clone(),
      end: roundVectorM(s.end).clone(),
    }));

  // @ts-ignore
  const segments: TProcessLineSegment[] = startSegment ? [startSegment] : [];
  const res = addProcessLineSegmentsByOrder(
    line,
    start,
    end,
    availableSegments,
    instrs
  );
  for (const segment of res.segments) {
    segments.push({ ...segment, id: getNextId(segments) });
  }
  // @ts-ignore
  endSegment && segments.push({ ...endSegment, id: getNextId(segments) });

  return {
    line: { ...line, initialLength: length, segments } as TProcessLine,
    instrs: res.fixedInstrs,
  };
}
