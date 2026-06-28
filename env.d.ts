/// <reference types="vite/client" />

declare const mdui: {
  mutation: () => void
  updateTextFields?: () => void
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
  snackbar: (options: {
    message: string
    timeout?: number
    position?: 'bottom' | 'top' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
    buttonText?: string
    buttonColor?: string
    closeOnButtonClick?: boolean
    closeOnOutsideClick?: boolean
    onClick?: (snackbar: { close: () => void }) => void
    onButtonClick?: (snackbar: { close: () => void }) => void
  }) => { close: () => void }
}

declare const marked: {
  parse: (markdown: string) => string
}
