import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { serviceSideProps } from '@/web/common/utils/i18n';
import PageContainer from '@/components/PageContainer';
//动态引入 TabTag 组件
const TabTag = dynamic(() => import('./tab/Tag'));
const Config = () => {
  return (
    <PageContainer>
      <TabTag />
    </PageContainer>
  );
};

const ConfigRender = () => {
  return <Config />;
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}

export default ConfigRender;
