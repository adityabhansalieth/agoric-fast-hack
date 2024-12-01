import { useState } from 'react';
// import { NotificationContext } from '../context/NotificationContext';
// import { Notifications } from './Notifications';
import Orchestration from './Orchestration';
import { TabWrapper } from './TabWrapper';

import TrueSplit from '../routes/TrueSplit';
// notification related types
const dynamicToastChildStatuses = [
  'info',
  'success',
  'warning',
  'error',
] as const;

type DynamicToastChild = {
  text: string;
  status: (typeof dynamicToastChildStatuses)[number];
};

const Tabs = () => {
  const [activeTab, setActiveTab] = useState('Interchain Accounts');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div role="tablist" className="daisyui-tabs-boxed daisyui-tabs daisyui-tabs-lg">
      <TabWrapper
        tab="Interchain Accounts"
        activeTab={activeTab}
        handleTabClick={handleTabClick}
      >
        <Orchestration />
      </TabWrapper>
      <TabWrapper
        tab="TrueSplit"
        activeTab={activeTab}
        handleTabClick={handleTabClick}
      >
        <TrueSplit />
      </TabWrapper>
    </div>
  );
};

export { Tabs };
export type { DynamicToastChild };
