export const MisterSync = () => {
  return (
    <div>
      <SaveStatus />
    </div>
  )
}

type SaveStatusProps = {
  path?: string
}

const SaveStatus = ({ path }: SaveStatusProps) => {
  return (
    <div>
      <div>Pocket</div>
      <div>Equals</div>
      <div>MiSTer</div>
    </div>
  )
}
