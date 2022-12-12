import React  from "react";
import { Flex, Text } from "@holium/design-system";

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
        title={`Sidebar - ${header}`}
      >
        {header}
      </Text>
    </Flex>
  );
};
