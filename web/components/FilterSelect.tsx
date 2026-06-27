"use client";

import { ListBox, Select } from "@heroui/react";

export type FilterOption = {
  id: string;
  label: string;
};

const ALL_KEY = "__all__";

type FilterSelectProps = {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selectedKey: string | null;
  isDisabled?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onChange: (key: string | null) => void;
};

export function FilterSelect({
  label,
  placeholder,
  options,
  selectedKey,
  isDisabled,
  isLoading,
  errorMessage,
  onChange,
}: FilterSelectProps) {
  const displayPlaceholder = errorMessage
    ? "Failed to load"
    : isLoading
      ? "Loading..."
      : placeholder;

  return (
    <Select
      fullWidth
      variant="primary"
      className="compact-select"
      aria-label={label}
      isDisabled={isDisabled || isLoading || Boolean(errorMessage)}
      selectedKey={selectedKey ?? ALL_KEY}
      onSelectionChange={(key) => {
        if (key == null) {
          onChange(null);
          return;
        }
        const value = String(key);
        onChange(value === ALL_KEY ? null : value);
      }}
    >
      <Select.Trigger>
        <Select.Value className="truncate text-[11px] leading-none" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="compact-select-popover">
        <ListBox
          aria-label={label}
          className="text-[11px]"
          items={[{ id: ALL_KEY, label: displayPlaceholder }, ...options]}
        >
          {(item) => (
            <ListBox.Item id={item.id} textValue={item.label} className="text-[11px]">
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
