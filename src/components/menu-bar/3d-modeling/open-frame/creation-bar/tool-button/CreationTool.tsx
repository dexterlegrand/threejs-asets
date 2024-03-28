import React, { useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { getLocalStorageImage } from "../../../../../3d-models/utils";
import OFCreationAtom, {
  TOFCreationElementType,
} from "../../../../../../recoil/atoms/of-creation-atom";

import "./CreationTool.css";

type Props = {
  type: TOFCreationElementType;
  disabled?: boolean;
  draggable?: boolean;
};

export default React.memo(function CreationTool({
  type,
  draggable = false,
  disabled,
}: Props) {
  const [png, setPng] = useState("");

  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  const className = useMemo(() => {
    return `creation-tool ${OFCreationState.type === type ? "active" : ""} ${
      disabled ? "disabled" : ""
    }`;
  }, [OFCreationState.type, disabled, type]);

  useEffect(() => {
    setPng(localStorage.getItem(`of-creation-bar/${type}.png`) || "");
    getLocalStorageImage(`of-creation-bar/${type}.png`).then(
      (data) => data && setPng(data)
    );
  }, []);

  function handleSelect() {
    if (disabled) return;
    setOFCreationState((prev) => ({
      type: prev.type !== type ? type : undefined,
      lib: prev.lib,
      profile: prev.profile,
      thickness: prev.thickness,
      bracingType: prev.bracingType,
      routing: prev.routing,
    }));
  }
  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.dataTransfer.setData("text/html", `${"creation-bar"}&${type}`);
  }
  return (
    <div
      className={className}
      onClick={handleSelect}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div>
        <img src={png} alt={type} />
        <div />
      </div>
    </div>
  );
});
