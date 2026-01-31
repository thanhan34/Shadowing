import React from "react";
import { EssayTemplate } from "../../data/essayTemplates";

interface TemplateSelectorProps {
  templates: EssayTemplate[];
  selectedId: string | null;
  onSelect: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedId,
  onSelect
}) => {
  return (
    <div className="w-full space-y-3">
      <h2 className="text-lg font-semibold text-[#fc5d01]">Chọn dạng bài</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map(template => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? "border-[#fc5d01] bg-[#fedac2]"
                  : "border-[#fdbc94] bg-white"
              }`}
            >
              <p className="text-base font-semibold text-[#fc5d01]">
                {template.label}
              </p>
              <p className="text-sm text-gray-700">Template cố định</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;