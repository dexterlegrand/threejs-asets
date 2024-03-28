import React, { useRef, useEffect } from "react";
import { Toaster, IToastProps } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../store";
import { changeEventsAction, removeEventAction } from "../../store/ui/actions";
import { getCurrentUI } from "../3d-models/utils";

export function SimpleToaster() {
  const events = useSelector((state: ApplicationState) => getCurrentUI(state)?.events ?? []);

  const dispatch = useDispatch();

  const toaster = useRef<any>();

  useEffect(() => {
    if (events.some((event) => event.isNew)) {
      events
        .filter((event) => event.isNew)
        .forEach((event) => {
          addToast({
            ...getStyles(event.type),
            message: event.message,
            timeout: 5000,
            onDismiss: (expired) => !expired && dispatch(removeEventAction(event.id)),
          });
        });
      dispatch(
        changeEventsAction(
          events.map((item) => {
            if (item.isNew) {
              return { ...item, isNew: false };
            } else return item;
          })
        )
      );
    }
  }, [events]);

  function getStyles(type: "danger" | "none" | "success" | "warning"): any {
    switch (type) {
      case "danger":
        return {
          icon: "error",
          intent: "danger",
        };
      case "none":
        return {
          icon: "info-sign",
        };
      case "success":
        return {
          info: "tick-circle",
          intent: "success",
        };
      case "warning":
        return {
          icon: "warning-sign",
          intent: "warning",
        };
      default:
        return {
          icon: "info-sign",
        };
    }
  }

  function addToast(toast: IToastProps) {
    toast.timeout = 5000;
    toaster.current.show(toast);
  }

  return <Toaster ref={toaster} canEscapeKeyClear={true} position={"bottom-left"} maxToasts={5} />;
}
