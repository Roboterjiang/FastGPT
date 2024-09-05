import {
  Box,
  Flex,
  IconButton,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  css,
  useSteps
} from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';

export const useMyStep = ({
  defaultStep = 0,
  steps = []
}: {
  defaultStep?: number;
  steps: { title?: string; description?: string }[];
}) => {
  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: defaultStep,
    count: steps.length
  });

  const MyStep = useCallback(
    () => (
      <Stepper
        size={['xs', 'sm']}
        index={activeStep}
        colorScheme="primary"
        gap={5}
        css={css({
          '.chakra-step__indicator': {
            borderWidth: '0 !important'
          }
        })}
        bg={'myGray.20'}
        padding={'5px 12px'}
        borderRadius={'20px'}
      >
        {steps.map((step, index) => (
          <Step key={step.title}>
            <StepIndicator>
              <StepStatus
                complete={
                  <Flex
                      bg={'primary.40'}
                      color={'primary.10'}
                      w={'100%'}
                      h={'100%'}
                      lineHeight={'100%'}
                      borderRadius={'50%'}
                      alignItems={'center'}
                      justifyContent={'center'}
                  >
                    {index + 1}
                  </Flex>
                }
                incomplete={
                  <Flex
                    bg={'white'}
                    borderColor={'myGray.300'}
                    borderWidth={'1px'}
                    color={'black.100'}
                    w={'100%'}
                    h={'100%'}
                    lineHeight={'100%'}
                    borderRadius={'50%'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    {index + 1}
                  </Flex>
                }
                active={
                  <Flex
                    bg={'primary.40'}
                    color={'primary.10'}
                    w={'100%'}
                    h={'100%'}
                    lineHeight={'100%'}
                    borderRadius={'50%'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    {index + 1}
                  </Flex>
                }
              />
            </StepIndicator>

            <StepSeparator h={'3px !important'} bg={'linear-gradient(to right, #c3006f, #c3006f, rgba(255,255,255,0)) !important'} />
          </Step>
        ))}
      </Stepper>
    ),
    [steps, activeStep]
  );

  return {
    activeStep,
    goToNext,
    goToPrevious,
    MyStep
  };
};
