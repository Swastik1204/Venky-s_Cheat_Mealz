export default function Contact() {
  return (
    <div className="page-wrap py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <form className="space-y-4">
          <input className="input input-bordered w-full" placeholder="Your name" />
          <input type="email" className="input input-bordered w-full" placeholder="Your email" />
          <textarea className="textarea textarea-bordered w-full" rows={4} placeholder="Your message"></textarea>
          <button type="button" className="btn btn-primary">Send</button>
        </form>
      </div>
    </div>
  )
}
