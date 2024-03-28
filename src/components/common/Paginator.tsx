import React, { useEffect, useMemo, useState } from "react";
import { SimpleSelector } from "./SimpleSelector";
import { Button, ButtonGroup } from "@blueprintjs/core";

interface Props {
  items: any[];
  onChange: (items: any[]) => any;
}

export function Paginator(props: Props) {
  const { items, onChange } = props;

  const [index, setIndex] = useState<number>(0);
  const [limit, setLimit] = useState<number>(25);

  useEffect(() => {
    if (index * limit > items.length) {
      setIndex(lastIndex);
    } else {
      onChange(items.slice(index * limit, (index + 1) * limit));
    }
  }, [index, limit, items]);

  const lastIndex = useMemo(() => {
    return Math.floor(items.length / limit);
  }, [limit, items]);

  function handleToStart() {
    index > 0 && setIndex(0);
  }

  function handleToBack() {
    index > 0 && setIndex(index - 1);
  }

  function handleToNext() {
    lastIndex > index && setIndex(index + 1);
  }

  function handleToEnd() {
    lastIndex > index && setIndex(lastIndex);
  }

  return (
    <div className={"label-light d-flex bg-dark f-ai-center f-jc-end"}>
      <ButtonGroup>
        <Button
          small
          minimal
          className={"c-light"}
          icon={"chevron-backward"}
          onClick={handleToStart}
        />
        <Button small minimal className={"c-light"} icon={"chevron-left"} onClick={handleToBack} />
        <Button small minimal className={"c-light"} text={`Page: ${index + 1}`} />
        <Button small minimal className={"c-light"} icon={"chevron-right"} onClick={handleToNext} />
        <Button
          small
          minimal
          className={"c-light"}
          icon={"chevron-forward"}
          onClick={handleToEnd}
        />
      </ButtonGroup>
      <SimpleSelector
        items={[10, 25, 50, 100]}
        selected={limit}
        itemLabel={(item) => `${item}`}
        onSelect={(limit) => setLimit(limit!)}
        label={"Limit: "}
        minimal={true}
        className={"w-60"}
      />
    </div>
  );
}
