/// <reference types="vite/client" />

declare const mdui: {
  mutation: () => void
  dialog: (options: {
    title?: string
    content?: string
    cssClass?: string
    buttons?: Array<{
      text: string
      bold?: boolean
      close?: boolean
      onClick?: () => void
    }>
    history?: boolean
    onOpened?: (dialog: {
      $element: Array<HTMLElement>
      close: () => void
    }) => void
  }) => void
}

declare const marked: {
  parse: (markdown: string) => string
}
