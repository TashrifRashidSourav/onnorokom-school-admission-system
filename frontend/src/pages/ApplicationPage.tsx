import { useParams } from 'react-router'

export function ApplicationPage() {
  const { holdId } = useParams()

  return (
    <section>
      <h1>Application</h1>
      <p className="muted">
        Status of application <code>{holdId}</code>, time left before it expires, and the
        pay and cancel actions.
      </p>
    </section>
  )
}
