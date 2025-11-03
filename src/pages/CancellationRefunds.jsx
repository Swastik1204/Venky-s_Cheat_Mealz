export default function CancellationRefunds() {
  return (
    <div className="page-wrap py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Cancellation & Refunds</h1>
        <div className="prose max-w-none">
          <p className="opacity-90">Orders can be cancelled before preparation starts. Refunds will be processed to your original payment method.</p>
          <ul className="list-disc pl-6 opacity-80">
            <li>Cash on Delivery refunds are handled as wallet/UPI whenever possible.</li>
            <li>Processing time is typically 5–7 business days.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
