// PolicyPage — Reusable layout wrapper for policy / info pages
export default function PolicyPage({ title, icon, children }) {
  return (
    <div className="page-wrap py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          {icon && <span className="text-4xl">{icon}</span>}
          <h1 className="text-4xl font-bold">{title}</h1>
        </div>
        <div className="prose max-w-none">
          {children}
        </div>
      </div>
    </div>
  )
}
