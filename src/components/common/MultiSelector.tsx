import React, { useMemo, useState } from "react";
import Select, { StylesConfig, OptionsType, ActionMeta } from "react-select";

interface Props<T> {
  items: T[];
  selected: T[];
  itemLabel: (item: T) => string;
  onSelect: (items: T[]) => any;
  autoFocus?: boolean;
  onBlur?: () => any;
  className?: string;
  disabled?: boolean;
}

interface IOption<T> {
  label: string;
  value: T;
}

const smallSelectorStyles: StylesConfig<any, any> = {
  control: (base) => ({
    ...base,
    minHeight: 24,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: 0,
  }),
  clearIndicator: (base) => ({
    ...base,
    // padding: 4,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0px 6px",
  }),
  input: (base) => ({
    ...base,
    fontSize: 12,
    margin: 0,
    padding: 0,
  }),
  menu: (base) => ({
    ...base,
    padding: 5,
    background: "#4b4b4b",
    width: "max-content",
    maxWidth: 300,
  }),
  option: (base, props) => ({
    ...base,
    borderRadius: 3,
    background: props.isSelected
      ? "#137cbd"
      : props.isFocused
      ? "#6f6f6f"
      : "unset",
    color: props.isSelected ? "white" : "#c8c8c8",
    padding: "5px 10px",
  }),
  multiValue: (base) => ({
    ...base,
    minWidth: "max-content",
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "#c8c8c8",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export function MultiSelector<T>(props: Props<T>) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => {
    return props.selected.map(convertItemToOption);
  }, [props.selected]);

  const items: IOption<T>[] = useMemo(() => {
    return props.items
      .map(convertItemToOption)
      .filter(
        (item) =>
          !query || item.label.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 50);
  }, [props.items, query]);

  function convertItemToOption(value: T): IOption<T> {
    return { label: props.itemLabel(value), value };
  }

  function handleChange(
    value: IOption<T> | OptionsType<IOption<T>> | null,
    actionMeta: ActionMeta<IOption<T>>
  ) {
    if (value && actionMeta.action === "select-option") {
      props.onSelect(
        Array.isArray(value)
          ? value.map((el) => el.value)
          : [(value as IOption<T>).value]
      );
    } else if (value && actionMeta.action === "remove-value") {
      props.onSelect(
        Array.isArray(value)
          ? value.map((v) => v.value)
          : [(value as IOption<T>).value]
      );
    } else if (actionMeta.action === "clear") {
      props.onSelect([]);
    }
  }

  return (
    <Select
      isMulti
      placeholder={""}
      isClearable={true}
      isDisabled={props.disabled}
      autoFocus={props.autoFocus}
      value={selected}
      options={items}
      onChange={handleChange}
      onBlur={() => props.onBlur && props.onBlur()}
      className={props.className}
      blurInputOnSelect={true}
      captureMenuScroll={true}
      closeMenuOnScroll={true}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      styles={smallSelectorStyles}
      menuPortalTarget={document.body}
      menuPosition={"fixed"}
      menuPlacement={"auto"}
      inputValue={query}
      onInputChange={(q: string) => {
        setQuery(q);
      }}
    />
  );
}
