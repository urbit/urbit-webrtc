import { deSig } from "@urbit/api";
import { isValidPatp } from "urbit-ob";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Icons, Flex, Text } from "@holium/design-system";

interface SectionHeaderProps {
  icon: any;
  header: string;
}

export const SectionHeader = ({ icon, header }: SectionHeaderProps) => {
  return (
    <Flex gap={12} alignItems="center">
      {icon}
      <Text
        fontSize={3}
        fontWeight={500}
        mt="1px"
        color="text.primary"
        title={`Sidebar section ${header}`}
      >
        {header}
      </Text>
    </Flex>
  );
};
