import { BoxProps, FlexProps } from '@chakra-ui/react';

export const cardStyles: BoxProps = {
  borderRadius: 'lg',
  // overflow: 'hidden',
  bg: 'white'
};

export const workflowBoxStyles: FlexProps = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  flexDirection: 'column',
  zIndex: 200,
  bg: 'myGray.100'
};

export const publishStatusStyle = {
  unPublish: {
    colorSchema: 'adora' as any,
    text: 'core.app.Unpublished'
  },
  published: {
    colorSchema: 'green' as any,
    text: 'core.app.Published'
  }
};

export default function Dom() {
  return <></>;
}
