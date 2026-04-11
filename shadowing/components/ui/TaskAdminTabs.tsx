import React from "react";
import { useRouter } from "next/router";
import Tabs from "./Tabs";

export type TaskAdminTabKey =
  | "wfd"
  | "ra-add"
  | "ra-edit"
  | "rs-add"
  | "rs-edit"
  | "edit"
  | "list";

type TaskAdminTabsProps = {
  activeKey: TaskAdminTabKey;
};

const TaskAdminTabs: React.FC<TaskAdminTabsProps> = ({ activeKey }) => {
  const router = useRouter();

  return (
    <Tabs
      items={[
        { key: "wfd", label: "Add WFD" },
        { key: "ra-add", label: "Add Read Aloud" },
        { key: "ra-edit", label: "Edit Read Aloud" },
        { key: "rs-add", label: "Add Repeat Sentence" },
        { key: "rs-edit", label: "Edit Repeat Sentence" },
        { key: "edit", label: "Edit Audio Sample" },
        { key: "list", label: "Audio Sample List" },
      ]}
      activeKey={activeKey}
      onChange={(key) => {
        const routeMap: Record<TaskAdminTabKey, string> = {
          wfd: "/add-audio-sample",
          "ra-add": "/AddReadAloud",
          "ra-edit": "/EditReadAloudList",
          "rs-add": "/AddRepeatSentence",
          "rs-edit": "/EditRepeatSentenceList",
          edit: "/EditAudioSamplePage",
          list: "/AudioSampleList",
        };

        void router.push(routeMap[key as TaskAdminTabKey]);
      }}
    />
  );
};

export default TaskAdminTabs;