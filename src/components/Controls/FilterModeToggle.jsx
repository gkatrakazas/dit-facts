import React from "react";
import SegmentedControl from "./SegmentedControl";
import { useTranslation } from "react-i18next";

export default function FilterModeToggle({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={[
        { value: "hide", label: t("visualization.common.filterMode.hide") },
        { value: "dim",  label: t("visualization.common.filterMode.dim") },
      ]}
    />
  );
}
