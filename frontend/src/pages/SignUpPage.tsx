import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SignUp } from '@clerk/clerk-react'

function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <Navbar />

      {/* Centered SignUp */}
      <div className="flex-grow flex py-32 items-center justify-center px-4">
          <SignUp signInUrl="/signin" afterSignUpUrl="/chats" />
      </div>

      <Footer />
    </div>
  )
}

export default SignUpPage
