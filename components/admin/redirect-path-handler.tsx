"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function RedirectPathHandler() {
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  useEffect(() => {
    if (redirectPath) {
      // Find the hidden input and set its value
      const redirectInput = document.querySelector('input[name="redirectPath"]') as HTMLInputElement
      if (redirectInput) {
        redirectInput.value = redirectPath
      }
    }
  }, [redirectPath])

  // This component doesn't render anything
  return null
}

