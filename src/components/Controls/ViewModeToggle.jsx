import React from "react";
import SegmentedControl from "./SegmentedControl";
import { useTranslation } from "react-i18next";

export default function ViewModeToggle({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={[
        { value: "individual", label: t("visualization.common.view.individual") },
        { value: "grouped",    label: t("visualization.common.view.grouped") },
      ]}
    />
  );
}
