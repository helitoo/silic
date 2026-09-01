import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLang } from "@/contexts/LangContext"

export interface LoadingDialogProps {
  open: boolean
  message?: string
  description?: string
}

export function LoadingDialog({
  open,
  message,
  description,
}: LoadingDialogProps) {
  const { t } = useLang()

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[280px] p-6 text-center sm:max-w-[300px]"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <DialogHeader className="gap-1 text-center">
            <DialogTitle className="text-center text-sm font-semibold">
              {message || t("common.processing")}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-center text-xs">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoadingDialog
