import React, { useState, useMemo, useEffect } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { FreePipe, TEndConnectorDetails } from "../../../../store/main/types";
import { CustomDlg } from "../../../common/CustomDlg";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import {
  TPipingElbow,
  DataState,
  TPipingAccessory,
  TPipingTee,
} from "../../../../store/data/types";
import {
  getUnicuesArray,
  degToRad,
  roundM,
  getLocalStorageImage,
} from "../../../3d-models/utils";

type Props = {
  pipe: FreePipe;
  nexts: FreePipe[];
  resoures: DataState;
  onClose: () => any;
  onSave: (pipe: FreePipe) => any;
};

export function EndConnectorDetails(props: Props) {
  const { pipe, nexts, resoures, onClose, onSave } = props;

  const [endConnectorSubtypes, setEndConnectorSubtypes] = useState("");
  const [changed, setChanged] = useState<FreePipe>();
  const [shape, setShape] = useState<string>();
  const [schedule, setSchedule] = useState<string>();
  const [material, setMaterial] = useState<string>();

  const type = useMemo(() => {
    return (changed ?? pipe).params.endConnectorDetails?.type;
  }, [pipe, changed]);

  const connectors = useMemo(() => {
    return (pipe.params.endConnectorType === "Elbow"
      ? resoures.pipingElbows.filter(
          (item) =>
            item.nps === pipe.params.nps &&
            item.degree === (pipe.params.endConnector as TPipingElbow)?.degree
        )
      : resoures.pipingTees.filter((item) => {
          const npss = item.nps.split(" x ");
          if (npss[0] !== pipe.params.nps) return false;
          const next0 = nexts.find((n) => Math.max(n.hDir, n.vDir) === 0);
          const next90 = nexts.find(
            (n) => Math.max(Math.abs(n.hDir), Math.abs(n.vDir)) === 90
          );
          if (!next0 || !next90) return false;
          if (next0.params.nps !== next90.params.nps) {
            return (
              npss[0] === next0.params.nps && npss[1] === next90.params.nps
            );
          }
          return (
            npss[0] === next0.params.nps &&
            (npss[1] !== undefined ? npss[1] === next90.params.nps : true)
          );
        })) as TPipingAccessory[];
  }, [pipe, nexts, resoures]);

  const endConnectorDetailsType = useMemo(() => {
    return (changed ?? pipe).params.endConnectorDetails?.type;
  }, [(changed ?? pipe).params.endConnectorDetails?.type]);

  useEffect(() => {
    setEndConnectorSubtypes(
      localStorage.getItem(
        `endConnectorSubtypes/${endConnectorDetailsType}.jpg`
      ) || ""
    );
    getLocalStorageImage(
      `endConnectorSubtypes/${endConnectorDetailsType}.jpg`
    ).then((data) => data && setEndConnectorSubtypes(data));
  }, [endConnectorDetailsType]);

  useEffect(() => {
    const ec = pipe.params.endConnector;
    if (!ec) return;
    if (pipe.params.endConnectorType === "Elbow") {
      if (ec.shape.includes("LR")) {
        setShape("LR");
      } else if (ec.shape.includes("SR")) {
        setShape("SR");
      }
    }
    setSchedule(ec.schedule);
    setMaterial(ec.material);
  }, [pipe]);

  function handleChange(field: string, value: any) {
    const item = changed ?? pipe;
    let changedECD: TEndConnectorDetails = {
      ...item.params.endConnectorDetails!,
      [field]: value,
    };
    if (field === "type") {
      switch (changedECD.type) {
        case "TW":
        case "TURF":
        case "TBWF":
        case "TWCI":
          {
            const tn =
              (item.params.endConnector as TPipingTee).t ??
              (item.params.endConnector as TPipingTee).t1;
            const r =
              (((item.params.endConnector as TPipingTee).d ??
                (item.params.endConnector as TPipingTee).d1 ??
                0) -
                tn) /
              2;
            changedECD = { ...changedECD, tn, r };
          }
          break;
        case "BWE":
          {
            const tn = (item.params.endConnector as TPipingElbow).t;
            const r =
              (((item.params.endConnector as TPipingElbow).d ?? 0) - tn) / 2;
            const R = (item.params.endConnector as TPipingElbow).a;
            changedECD = { ...changedECD, tn, r, R };
          }
          break;
        case "BWSM":
        case "BCSM":
          changedECD = calculateElbowParams(
            changedECD.type,
            item.params.endConnector as TPipingElbow,
            changedECD
          );
          break;
        case "TRF":
          {
            const tn =
              (item.params.endConnector as TPipingTee).t ??
              (item.params.endConnector as TPipingTee).t1;
            const r =
              (((item.params.endConnector as TPipingTee).d ??
                (item.params.endConnector as TPipingTee).d1 ??
                0) -
                tn) /
              2;
            changedECD = { ...changedECD, tn, r, tr: 0 };
          }
          break;
        case "TEW":
          {
            const tn = (item.params.endConnector as TPipingElbow).t;
            const r =
              (((item.params.endConnector as TPipingElbow).d ?? 0) - tn) / 2;
            const tc = (item.params.endConnector as TPipingElbow).t;
            changedECD = { ...changedECD, tn, r, tc, rx: 0 };
          }
          break;
      }
    }
    setChanged({
      ...item,
      params: { ...item.params, endConnectorDetails: changedECD },
    });
  }

  function calculateElbowParams(
    type: string,
    connector: TPipingElbow,
    details: TEndConnectorDetails
  ): TEndConnectorDetails {
    const tn = connector.t ?? 0;
    const r = ((connector.d ?? 0) - tn) / 2;
    let Re = connector.a ?? 0;
    if (connector.degree === 45) Re = Re * 2.5;
    const Theta = connector.degree / ((type === "BCSM" ? 3 : 2) * 2);
    const S = roundM(Math.tan(degToRad(Theta)) * Re * 2);
    return { ...details, tn, r, Re, S, Theta };
  }

  return (
    <CustomDlg
      title={`Details of ${pipe.params.endConnectorType} "${pipe.params.endConnector?.nps} - ${schedule} - ${material}"`}
      zIndex={11}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="label-light bg-dark">
            Additional Geometric parameters
          </div>
          <div className="hr" />
          <div className="d-flex f-grow bg-dark p-5">
            <div className="d-flex f-grow bg-gray">
              <div
                className="d-flex f-grow f-column"
                style={{ paddingRight: 10 }}
              >
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">Type</div>
                  <FormGroup className="no-m w-150">
                    <SimpleSelector<string>
                      items={
                        pipe.params.endConnectorType === "Elbow"
                          ? ["BWE", "BCSM", "BWSM"]
                          : ["TW", "TRF", "TURF", "TEW", "TWCI", "TBWF"]
                      }
                      itemLabel={(item) => item}
                      selected={
                        (changed ?? pipe).params.endConnectorDetails?.type
                      }
                      onSelect={(value) => handleChange("type", value)}
                      className={"fill-select"}
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">tn</div>
                  {type === "BWE" || type === "TW" ? (
                    <div className="label-light w-150">
                      {(changed ?? pipe).params.endConnectorDetails?.tn}
                    </div>
                  ) : (
                    <FormGroup className="no-m w-150">
                      <SimpleNumericInput
                        isDecimal={true}
                        value={(changed ?? pipe).params.endConnectorDetails?.tn}
                        onChange={(value) => handleChange("tn", value)}
                      />
                    </FormGroup>
                  )}
                  <div className="label-light w-50">mm</div>
                </div>
                {type === "BWE" ? (
                  <div className="d-flex f-ai-center">
                    <div className="label-light t-end w-50">R</div>
                    <div className="label-light w-150">
                      {(changed ?? pipe).params.endConnectorDetails?.R}
                    </div>
                    <div className="label-light w-50">mm</div>
                  </div>
                ) : null}
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">r</div>
                  {type === "BWE" || type === "TW" ? (
                    <div className="label-light w-150">
                      {(changed ?? pipe).params.endConnectorDetails?.r}
                    </div>
                  ) : (
                    <FormGroup className="no-m w-150">
                      <SimpleNumericInput
                        isDecimal={true}
                        value={(changed ?? pipe).params.endConnectorDetails?.r}
                        onChange={(value) => handleChange("r", value)}
                      />
                    </FormGroup>
                  )}
                  <div className="label-light w-50">mm</div>
                </div>
                {type === "BCSM" || type === "BWSM" ? (
                  <>
                    <div className="d-flex f-ai-center">
                      <div className="label-light t-end w-50">Re</div>
                      <FormGroup className="no-m w-150">
                        <SimpleNumericInput
                          min={0}
                          isDecimal={true}
                          value={
                            (changed ?? pipe).params.endConnectorDetails?.Re
                          }
                          onChange={(value) => {
                            const Theta =
                              (changed ?? pipe).params.endConnectorDetails
                                ?.Theta ?? 0;
                            const S = roundM(
                              Math.tan(degToRad(Theta)) * value * 2
                            );
                            handleChange("Re", value);
                            handleChange("S", S);
                          }}
                        />
                      </FormGroup>
                      <div className="label-light w-50">mm</div>
                    </div>
                    <div className="d-flex f-ai-center">
                      <div className="label-light t-end w-50">S</div>
                      <FormGroup className="no-m w-150">
                        <SimpleNumericInput
                          min={0}
                          isDecimal={true}
                          value={
                            (changed ?? pipe).params.endConnectorDetails?.S
                          }
                          onChange={(value) => {
                            const item = changed ?? pipe;
                            const type = item.params.endConnectorDetails?.type;
                            const tn =
                              (item.params.endConnectorDetails?.tn ?? 0) / 2;
                            const r =
                              (item.params.endConnectorDetails?.r ?? 0) + tn;
                            const Theta =
                              item.params.endConnectorDetails?.Theta ?? 0;
                            const checkVal =
                              r * (1 + Math.tan(degToRad(Theta)));
                            if (
                              type === "BCSM"
                                ? value >= checkVal
                                : value < checkVal
                            )
                              return;
                            const Re = value / (Math.tan(degToRad(Theta)) * 2);
                            handleChange("S", value);
                            handleChange("Re", Re);
                          }}
                        />
                      </FormGroup>
                      <div className="label-light w-50">mm</div>
                    </div>
                    <div className="d-flex f-ai-center">
                      <div className="label-light t-end w-50">Theta</div>
                      <FormGroup className="no-m w-150">
                        <SimpleNumericInput
                          min={0}
                          max={
                            ((changed ?? pipe).params
                              .endConnector as TPipingElbow)?.degree /
                            (((changed ?? pipe).params.endConnectorDetails
                              ?.type === "BCSM"
                              ? 3
                              : 2) *
                              2)
                          }
                          isDecimal={true}
                          value={
                            (changed ?? pipe).params.endConnectorDetails?.Theta
                          }
                          onChange={(value) => {
                            const Re =
                              (changed ?? pipe).params.endConnectorDetails
                                ?.Re ?? 0;
                            const S = roundM(
                              Math.tan(degToRad(value)) * Re * 2
                            );
                            handleChange("Theta", value);
                            handleChange("S", S);
                          }}
                        />
                      </FormGroup>
                      <div className="label-light w-50">Deg.</div>
                    </div>
                  </>
                ) : null}
                {type === "TRF" ? (
                  <div className="d-flex f-ai-center">
                    <div className="label-light t-end w-50">tr</div>
                    <FormGroup className="no-m w-150">
                      <SimpleNumericInput
                        min={0}
                        isDecimal={true}
                        value={(changed ?? pipe).params.endConnectorDetails?.tr}
                        onChange={(value) => handleChange("tr", value)}
                      />
                    </FormGroup>
                    <div className="label-light w-50">mm</div>
                  </div>
                ) : null}
                {type === "TEW" ? (
                  <>
                    <div className="d-flex f-ai-center">
                      <div className="label-light t-end w-50">tc</div>
                      <FormGroup className="no-m w-150">
                        <SimpleNumericInput
                          min={0}
                          isDecimal={true}
                          value={
                            (changed ?? pipe).params.endConnectorDetails?.tc
                          }
                          onChange={(value) => handleChange("tc", value)}
                        />
                      </FormGroup>
                      <div className="label-light w-50">mm</div>
                    </div>
                    <div className="d-flex f-ai-center">
                      <div className="label-light t-end w-50">rx</div>
                      <FormGroup className="no-m w-150">
                        <SimpleNumericInput
                          min={0}
                          isDecimal={true}
                          value={
                            (changed ?? pipe).params.endConnectorDetails?.rx
                          }
                          onChange={(value) => handleChange("rx", value)}
                        />
                      </FormGroup>
                      <div className="label-light w-50">mm</div>
                    </div>
                  </>
                ) : null}
                {type === "BWE" || type === "TW" ? (
                  <>
                    {type === "BWE" ? (
                      <>
                        <div
                          className="d-flex f-column"
                          style={{ margin: "0 10px" }}
                        >
                          <div
                            className="label-light w-mc"
                            style={{ paddingLeft: "unset" }}
                          >
                            Connector Type
                          </div>
                          <FormGroup className="no-m w-200">
                            <SimpleSelector<string>
                              items={["LR", "SR"].filter((val) =>
                                connectors.some((c) => c.shape.includes(val))
                              )}
                              itemLabel={(item) => item}
                              selected={shape}
                              onSelect={(value) => {
                                if (!value) return;
                                const item = changed ?? pipe;
                                const filtered = connectors.filter((c) =>
                                  c.shape.includes(value)
                                );
                                const endConnector = connectors.find(
                                  (c) =>
                                    c.shape.includes(value) &&
                                    filtered.some(
                                      (m) =>
                                        c.schedule === m.schedule &&
                                        c.material === m.material
                                    )
                                );
                                if (!endConnector) return;
                                setShape(value);
                                setSchedule(endConnector.schedule);
                                setMaterial(endConnector.material);
                                const tn =
                                  (endConnector as any)?.t ||
                                  (endConnector as any)?.t1;
                                const r =
                                  (((endConnector as any)?.d ??
                                    (endConnector as any)?.d1 ??
                                    0) -
                                    tn) /
                                  2;
                                const R = (endConnector as any)?.a;
                                setChanged({
                                  ...item,
                                  params: {
                                    ...item.params,
                                    endConnector,
                                    endConnectorDetails: {
                                      ...item.params.endConnectorDetails!,
                                      tn,
                                      r,
                                      R,
                                    },
                                  },
                                });
                              }}
                              className={"fill-select"}
                            />
                          </FormGroup>
                        </div>
                      </>
                    ) : null}
                    <div
                      className="d-flex f-column"
                      style={{ margin: "0 10px" }}
                    >
                      <div
                        className="label-light w-mc"
                        style={{ paddingLeft: "unset" }}
                      >
                        Schedule
                      </div>
                      <FormGroup className="no-m w-200">
                        <SimpleSelector<string>
                          items={getUnicuesArray(
                            connectors
                              .filter((c) =>
                                shape ? c.shape.includes(shape) : true
                              )
                              .map((c) => c.schedule)
                          )}
                          itemLabel={(item) => item}
                          selected={schedule}
                          onSelect={(value) => {
                            const item = changed ?? pipe;
                            const materials = getUnicuesArray(
                              connectors
                                .filter(
                                  (c) =>
                                    (shape ? c.shape.includes(shape) : true) &&
                                    c.schedule === schedule
                                )
                                .map((c) => c.material)
                            );
                            const endConnector = connectors.find(
                              (c) =>
                                (shape ? c.shape.includes(shape) : true) &&
                                c.schedule === value &&
                                materials.some((m) => c.material === m)
                            );
                            if (!endConnector) return;
                            setSchedule(value);
                            setMaterial(endConnector.material);
                            const tn =
                              (endConnector as any)?.t ||
                              (endConnector as any)?.t1;
                            const r =
                              (((endConnector as any)?.d ??
                                (endConnector as any)?.d1 ??
                                0) -
                                tn) /
                              2;
                            const R = (endConnector as any)?.a;
                            setChanged({
                              ...item,
                              params: {
                                ...item.params,
                                endConnector,
                                endConnectorDetails: {
                                  ...item.params.endConnectorDetails!,
                                  tn,
                                  r,
                                  R,
                                },
                              },
                            });
                          }}
                          className={"fill-select"}
                        />
                      </FormGroup>
                    </div>
                    <div
                      className="d-flex f-column"
                      style={{ margin: "0 10px" }}
                    >
                      <div
                        className="label-light w-mc"
                        style={{ paddingLeft: "unset" }}
                      >
                        Material
                      </div>
                      <FormGroup className="no-m w-200">
                        <SimpleSelector<string>
                          items={getUnicuesArray(
                            connectors
                              .filter(
                                (c) =>
                                  (shape ? c.shape.includes(shape) : true) &&
                                  c.schedule === schedule
                              )
                              .map((c) => c.material)
                          )}
                          itemLabel={(item) => item}
                          selected={material}
                          onSelect={(value) => {
                            const item = changed ?? pipe;
                            const endConnector = connectors.find(
                              (c) =>
                                (shape ? c.shape.includes(shape) : true) &&
                                c.schedule === schedule &&
                                c.material === value
                            );
                            const tn =
                              (endConnector as any)?.t ||
                              (endConnector as any)?.t1;
                            const r =
                              (((endConnector as any)?.d ??
                                (endConnector as any)?.d1 ??
                                0) -
                                tn) /
                              2;
                            const R = (endConnector as any)?.a;
                            setChanged({
                              ...item,
                              params: {
                                ...item.params,
                                endConnector,
                                endConnectorDetails: {
                                  ...item.params.endConnectorDetails!,
                                  tn,
                                  r,
                                  R,
                                },
                              },
                            });
                            setMaterial(value);
                          }}
                          className={"fill-select"}
                        />
                      </FormGroup>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="bg-white p-5">
                <img
                  src={endConnectorSubtypes}
                  alt={(changed ?? pipe).params.endConnectorDetails?.type}
                />
              </div>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Save"
            disabled={!changed}
            onClick={() => changed && onSave(changed)}
            intent={"primary"}
          />
        </>
      }
    />
  );
}
