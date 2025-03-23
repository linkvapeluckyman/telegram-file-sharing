export async function encode(string: string): Promise<string> {
  const stringBytes = new TextEncoder().encode(string)
  const base64Bytes = btoa(String.fromCharCode(...new Uint8Array(stringBytes)))
  const base64String = base64Bytes.replace(/=/g, "")
  return base64String
}

export async function decode(base64String: string): Promise<string> {
  // Add padding if needed
  const paddedBase64 = base64String + "=".repeat((4 - (base64String.length % 4)) % 4)
  const stringBytes = Uint8Array.from(atob(paddedBase64), (c) => c.charCodeAt(0))
  const string = new TextDecoder().decode(stringBytes)
  return string
}

