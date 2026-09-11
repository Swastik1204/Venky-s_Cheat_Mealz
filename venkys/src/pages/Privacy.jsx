// Privacy — Privacy policy page
import Seo from '../components/Seo'
import { PrivacyContent } from '../components/legal/LegalContent'

export default function Privacy() {
  return (
    <div className="page-wrap py-10">
      <Seo
        title="Privacy Policy | Venky's Chicken Xperience Durgapur"
        description="How Venky's Chicken Xperience Durgapur collects, uses, and protects your data."
        path="/privacy"
      />
      <div className="max-w-3xl mx-auto">
        <PrivacyContent />
      </div>
    </div>
  )
}
