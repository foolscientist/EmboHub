import type { ModelInfoMetric } from "@/types/model";
import React, { useState } from "react";

interface InputModelMetricProps {
  metric: ModelInfoMetric;
  setMetric: React.Dispatch<React.SetStateAction<ModelInfoMetric>>;
}

export default function InputModelInfoMetric({
  metric,
  setMetric,
}: InputModelMetricProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    switch (event.currentTarget.name) {
      case "gpu_memory_gb":
      case "storage_gb":
        setMetric((prevMetric) => ({
          ...prevMetric,
          [event.target.name]: Number(event.target.value),
        }));
        break;

      case "parameters":
      case "quantatization":
        // logic to update the `quantatization` field here:
        setMetric((prevMetric) => ({
          ...prevMetric,
          [event.target.name]: event.target.value,
        }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevent page refresh on form submission

    // ignore this
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Parameters:
        <input
          type="number"
          name="parameters"
          value={metric.parameters || ""}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Quantatization:
        <input
          type="text"
          name="quantatization"
          value={metric.quantatization || ""}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        GPU Memory (GB):
        <input
          type="number"
          name="gpu_memory_gb"
          value={metric.gpu_memory_gb || ""}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Storage (GB):
        <input
          type="number"
          name="storage_gb"
          value={metric.storage_gb || ""}
          onChange={handleChange}
        />
      </label>
      <br />
    </form>
  );
}
