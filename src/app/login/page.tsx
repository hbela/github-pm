import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Github } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">GitHub PM</span>
            </div>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your GitHub account to manage your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/" })
            }}
          >
            <Button type="submit" className="w-full gap-2" size="lg">
              <Github className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            This app requests read access to your repositories and issues.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
