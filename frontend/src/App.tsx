import { Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import ChatsPage from "./chats/chatsPage";

function App() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={<SignUp signInUrl="/signin" afterSignUpUrl="/chats" />}
      />

      <Route
        path="/signin"
        element={<SignIn signUpUrl="/signup" afterSignInUrl="/chats" />}
      />

      <Route
        path="/chats"
        element={
          <>
            <SignedIn>
              <ChatsPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/signin" />
            </SignedOut>
          </>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
}

export default App;
