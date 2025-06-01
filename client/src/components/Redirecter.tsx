import { useRouter } from "next/navigation"
import { useEffect } from "react"


export default function Redirecter() {
  const router = useRouter()

  useEffect(() => {
    router.push("/app")
  }, [])

  return <div></div>
}
