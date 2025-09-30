import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-wrap py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Page not found</h1>
      <p className="mb-6">The page you’re looking for doesn’t exist.</p>
  <Link className="btn btn-primary" to="/">Go Home</Link>
    </div>
  )
}
