// Terms — Terms and conditions page
import Seo from '../components/Seo'
import { TermsContent } from '../components/legal/LegalContent'

export default function Terms() {
  return (
    <div className="page-wrap py-10">
      <Seo
        title="Terms & Conditions | Venky's Chicken Xperience Durgapur"
        description="Terms and conditions for ordering from Venky's Chicken Xperience Durgapur — orders, pricing, and app usage."
        path="/terms"
      />
      <div className="max-w-3xl mx-auto">
        <TermsContent />
      </div>
    </div>
  )
}
