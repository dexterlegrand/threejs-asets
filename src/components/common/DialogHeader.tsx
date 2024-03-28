import React, { useEffect, useState } from "react";
import { Button, Classes } from "@blueprintjs/core";
import { Vector2 } from "three";

type Props = {
  parent: React.RefObject<HTMLDivElement>;
  title?: string;
  isMinimize?: boolean;
  minimized?: boolean;
  position?: "center" | "default" | Vector2;
  onMinimaze?: () => any;
  onClose?: () => any;
  onToggleFullScreen?: () => any;
};

export function DialogHeader(props: Props) {
  const {
    parent,
    title,
    isMinimize,
    minimized,
    position,
    onMinimaze,
    onClose,
  } = props;

  const [grabbing, setGrabbing] = useState<boolean>(false);

  useEffect(() => {
    if (parent.current) {
      if ((position as Vector2)?.isVector2) {
        parent.current.style.top = `${(position as Vector2).y}px`;
        parent.current.style.left = `${(position as Vector2).x}px`;
      } else if (position === "center") {
        parent.current.style.top =
          window.innerHeight / 2 - parent.current.clientHeight / 2 + "px";
        parent.current.style.left =
          window.innerWidth / 2 - parent.current.clientWidth / 2 + "px";
      } else {
        parent.current.style.top = "147px";
        parent.current.style.left = "132px";
      }
    }
  }, [parent]);

  function drag(event: MouseEvent, shiftX: number, shiftY: number) {
    if (parent.current) {
      const left = event.pageX - shiftX;
      const top = event.pageY - shiftY;
      if (
        left >= 0 &&
        left <= document.body.offsetWidth - parent.current.offsetWidth
      )
        parent.current.style.left = left + "px";
      if (
        top >= 0 &&
        top <= document.body.offsetHeight - parent.current.offsetHeight
      )
        parent.current.style.top = top + "px";
    }
  }

  return title ? (
    <div
      style={{ cursor: grabbing ? "grabbing" : "grab" }}
      className={Classes.DIALOG_HEADER}
      onMouseDown={(eventMD) => {
        if (parent.current) {
          eventMD.persist();
          let left = parseInt(parent.current.style.left.replace("px", ""));
          if (!left) left = parent.current.offsetLeft;

          let top = parseInt(parent.current.style.top.replace("px", ""));
          if (!top) top = parent.current.offsetTop;

          const dragfn = (event: MouseEvent) =>
            drag(event, eventMD.pageX - left, eventMD.pageY - top);

          const removeEvents = () => {
            setGrabbing(false);
            document.body.removeEventListener("mousemove", dragfn);
            document.body.removeEventListener("mouseup", removeEvents);
            document.body.removeEventListener("mouseleave", removeEvents);
          };

          setGrabbing(true);
          document.body.addEventListener("mousemove", dragfn);
          document.body.addEventListener("mouseup", removeEvents);
          document.body.addEventListener("mouseleave", removeEvents);
        }
      }}
    >
      <div className="bp3-heading">{title}</div>
      <div>
        {isMinimize ? (
          <Button
            icon={minimized ? "chevron-down" : "chevron-up"}
            onClick={onMinimaze}
            minimal
          />
        ) : null}
        {onClose ? <Button icon="cross" minimal onClick={onClose} /> : null}
      </div>
    </div>
  ) : null;
}
