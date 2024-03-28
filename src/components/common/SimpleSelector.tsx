import React, { useMemo, useState } from "react";
import Select, { ActionMeta, InputActionMeta, StylesConfig, OptionsType } from "react-select";
import CreatableSelect from "react-select/creatable";

interface Props<T> {
  items: T[];
  selected: T | undefined;
  itemLabel: (item: T) => string;
  itemSecondLabel?: (item: T) => string;
  onSelect: (item?: T) => any;
  onCreate?: (item: string) => any;
  autoFocus?: boolean;
  onBlur?: () => any;
  clearable?: boolean;
  filter?: (query: string, item: T) => boolean;
  className?: string;
  disabled?: boolean;
  minimal?: boolean;
  label?: string;
  loading?: boolean;
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
    padding: 0,
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
    background: props.isSelected ? "#137cbd" : props.isFocused ? "#6f6f6f" : "unset",
    color: props.isSelected ? "white" : "#c8c8c8",
    padding: "5px 10px",
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

export function SimpleSelector<T>(props: Props<T>) {
  const [query, setQuery] = useState<string>("");

  const filteredItems = useMemo(() => {
    if (!props.filter || !query) {return props.items.slice(0, 150);}
    return props.items.filter((item) => props.filter!(query, item)).slice(0, 250);
  }, [props.items, props.filter, query]);

  const items: IOption<T>[] = useMemo(() => {
    return filteredItems.map(convertItemToOption);
  }, [filteredItems]);

  const selected = useMemo(() => {
    return props.selected && convertItemToOption(props.selected);
  }, [props.selected]);

  function handleChange(value: IOption<T> | null, actionMeta: ActionMeta<IOption<T>>) {
    if (actionMeta.action === "select-option") {
      props.onSelect(value?.value);
    } else if (actionMeta.action === "clear") {
      props.onSelect();
    }
  }

  function handleCreate(inputValue: string) {
    const value = props.onCreate?.(inputValue);
    props.onSelect(value);
  }

  function handleInputChange(newValue: string, actionMeta: InputActionMeta) {
    switch (actionMeta.action) {
      case "input-change":
        setQuery(newValue);
        break;
      default:
        setQuery("");
        break;
    }
  }

  function getLabel(val: T) {
    return props.itemLabel(val) + (props.itemSecondLabel?.(val) ?? "");
  }

  function convertItemToOption(value: T): IOption<T> {
    return { label: getLabel(value), value };
  }

  return props.onCreate ? (
    <CreatableSelect<{ label: string; value: T }>
      placeholder={""}
      isClearable={props.clearable}
      isSearchable={!!props.filter}
      isDisabled={props.disabled}
      isLoading={props.loading}
      autoFocus={props.autoFocus}
      value={selected}
      inputValue={query}
      options={items}
      onChange={handleChange}
      onCreateOption={handleCreate}
      onInputChange={handleInputChange}
      onBlur={() => props.onBlur && props.onBlur()}
      className={props.className}
      blurInputOnSelect={true}
      captureMenuScroll={true}
      closeMenuOnScroll={true}
      styles={smallSelectorStyles}
      menuPortalTarget={document.body}
      menuPosition={"fixed"}
      menuPlacement={"auto"}
    />
  ) : (
    <Select<{ label: string; value: T }>
      placeholder={""}
      isClearable={props.clearable}
      isSearchable={!!props.filter}
      isDisabled={props.disabled}
      isLoading={props.loading}
      autoFocus={props.autoFocus}
      value={selected}
      inputValue={query}
      options={items}
      onChange={handleChange}
      onInputChange={handleInputChange}
      onBlur={() => props.onBlur && props.onBlur()}
      className={props.className}
      blurInputOnSelect={true}
      captureMenuScroll={true}
      closeMenuOnScroll={true}
      styles={smallSelectorStyles}
      menuPortalTarget={document.body}
      menuPosition={"fixed"}
      menuPlacement={"auto"}
    />
  );
}
