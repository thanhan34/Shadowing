import React from "react";
import Button from "./Button";
import { cn } from "../../lib/cn";

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, activeKey, onChange, className }) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist" aria-label="Tabs">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Button
            key={item.key}
            variant="tab"
            active={isActive}
            onClick={() => onChange(item.key)}
            role="tab"
            aria-selected={isActive}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
};

export default Tabs;
