import * as React from "react"
import type { Type } from "@/lib/types"
import { LongTextInput } from "./LongTextInput"
import { UrlInput } from "./UrlInput"
import { DateTimeInput } from "./DateTimeInput"
import { DateInput } from "./DateInput"
import { TimeInput } from "./TimeInput"
import { ColorInput } from "./ColorInput"
import { TextInput } from "./TextInput"
import { MediaFileInput } from "./MediaFileInput"

export interface RecordValueInputProps {
  type: Type
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  inList?: boolean
  disabled?: boolean
  className?: string
}

export const RecordValueInput = React.memo(function RecordValueInput({
  type,
  value,
  onChange,
  placeholder,
  isSmall = false,
  inList = false,
  disabled = false,
  className,
}: RecordValueInputProps) {
  switch (type) {
    case "image":
    case "video":
    case "audio":
    case "file":
      return (
        <MediaFileInput
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isSmall={isSmall}
          inList={inList}
          disabled={disabled}
          className={className}
        />
      )
    case "longText":
      return (
        <LongTextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    case "url":
      return (
        <UrlInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    case "dateTime":
      return (
        <DateTimeInput
          value={value}
          onChange={onChange}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    case "date":
      return (
        <DateInput
          value={value}
          onChange={onChange}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    case "time":
      return (
        <TimeInput
          value={value}
          onChange={onChange}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    case "color":
      return (
        <ColorInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
    default:
      return (
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isSmall={isSmall}
          disabled={disabled}
          className={className}
        />
      )
  }
})

export default RecordValueInput
