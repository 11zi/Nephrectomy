export const CHAT_INPUT_INSERT_TEXT_EVENT = 'nephrectomy:chat-input-insert-text'

export function requestInsertChatText(text: string) {
  window.dispatchEvent(
    new CustomEvent<string>(CHAT_INPUT_INSERT_TEXT_EVENT, {
      detail: text,
    }),
  )
}
