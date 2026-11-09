import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p className="muted">
        This page does not exist. <Link to="/">Go to the class list</Link>.
      </p>
    </section>
  )
}
