import React, { useMemo } from "react";
import { Tooltip } from "@blueprintjs/core";

export interface ValueValidatorProps {
  value?: any;
  valueFormater: (value?: any) => string | null;
  validator?: (value: any) => boolean;
  validationPrompt?: string;
  onClick?: () => any;
}

export function ValueValidator(props: ValueValidatorProps) {
  const { value, valueFormater, validator, validationPrompt } = props;

  const valid = useMemo(() => {
    return validator ? validator(value) : true;
  }, [value]);

  const text = useMemo(() => {
    return value !== undefined && value !== null ? valueFormater(value) : value;
  }, [value]);

  return (
    <div className={"d-flex f-center h-100p"} onClick={props.onClick}>
      {valid ? (
        text
      ) : (
        <Tooltip
          content={validationPrompt}
          intent={"danger"}
          targetProps={{ style: { margin: "0 2px", backgroundColor: "#DB3737", color: "#FFFFFF" } }}
        >
          {text}
        </Tooltip>
      )}
    </div>
  );
}
