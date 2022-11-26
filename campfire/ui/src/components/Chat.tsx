import React, { useCallback, useMemo, useRef } from "react";
import {
  Flex,
  Card,
  Input,
  IconButton,
  Icons,
  Text,
} from "@holium/design-system";
import { createForm, createField } from "mobx-easy-form";
import { observer } from "mobx-react";

export interface Message {
  speaker: string;
  message: string;
}
interface ChatProps {
  sendMessage: (msg: string) => void;
  messages: Message[];
  ready: boolean;
}

export const Chat = observer(({ sendMessage, messages, ready }: ChatProps) => {
  const { form, message } = useMemo(chatInputForm, []);
  const chatInputRef = useRef(null);
  const disabled = !ready;
  const onSubmitMessage = () => {
    const formData = form.actions.submit();

    sendMessage(formData.message);
    message.actions.onChange("");
    message.actions.onFocus();
    chatInputRef.current.value = "";
  };

  return (
    <Card
      elevation="none"
      borderRadius={9}
      height="100%"
      style={{
        padding: 8,
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Flex flexDirection="column" flexGrow={1}>
        <Flex mx={1} flexDirection="column-reverse" justifyContent="flex-start">
          {messages.map((msg, idx) => (
            <Flex key={idx}>
              <Text fontSize={3} className="font-bold mr-3">
                {msg.speaker}:
              </Text>
              <Text fontSize={3} className="break-words w-5/6">{msg.message}</Text>
            </Flex>
          ))}
        </Flex>
        {messages.length === 0 && (
          <Flex flexGrow={1} alignItems="center" justifyContent="center">
            <Text opacity={0.7} fontSize={3} textAlign={"center"}>
              No messages yet
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex>
        <Input
          ref={chatInputRef}
          disabled={disabled}
          style={{
            fontSize: 18,
            height: 40,
            borderRadius: 6,
            width: "100%",
          }}
          placeholder="Send a message..."
          spellCheck={false}
          rightInteractive
          rightIcon={
            <IconButton
              color="brand.primary"
              disabled={
                !message.computed.isDirty ||
                message.computed.ifWasEverBlurredThenError !== undefined ||
                message.computed.error !== undefined
              }
              onClick={() => {
                onSubmitMessage();
              }}
            >
              <Icons.ArrowRight opacity={0.8} />
            </IconButton>
          }
          onKeyDown={(event: any) => {
            if (event.keyCode === 13 && !event.shiftKey) {
              onSubmitMessage();
            }
          }}
          onFocus={() => message.actions.onFocus()}
          onBlur={() => message.actions.onBlur()}
          onChange={(evt: any) => {
            message.actions.onChange(evt.target.value);
          }}
        />
      </Flex>
    </Card>
  );
});

export const chatInputForm = (
  defaults: any = {
    chat: "",
  }
) => {
  const form = createForm({
    onSubmit({ values }) {
      return values;
    },
  });

  const message = createField({
    id: "message",
    form: form,
    initialValue: defaults.message || "",
    validate: (msg: string) => {
      if (msg.length > 0) {
        return { error: undefined, parsed: msg };
      }
      return { error: "Message required to send", parsed: undefined };
    },
  });

  return {
    form,
    message,
  };
};
