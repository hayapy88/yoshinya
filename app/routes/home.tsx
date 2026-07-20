import { LocaleProvider } from '~/i18n/LocaleContext'
import FileRenamerTool from '~/features/file-renamer/FileRenamerTool'

export default function Home() {
  return (
    <LocaleProvider>
      <FileRenamerTool />
    </LocaleProvider>
  )
}
