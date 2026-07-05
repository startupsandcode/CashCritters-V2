import Link from "next/link"
import { Header } from "@/components/layout/Header"

export const metadata = {
  title: "Privacy Policy - Cash Critters",
  description:
    "How Cash Critters collects, uses, and protects your family's information.",
}

const LAST_UPDATED = "May 4, 2026"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-3xl">
          <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Draft policy.</strong> This is a generic placeholder. It is
            not legal advice. Have a lawyer review and tailor it before
            launching publicly.
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                Cash Critters (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                &ldquo;our&rdquo;) provides interactive financial education
                for children. This Privacy Policy explains what information we
                collect, how we use it, and the choices parents and guardians
                have. By using Cash Critters, you agree to the practices
                described here.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                Information We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Account information.</strong> When a parent or
                  guardian creates an account, we collect their name, email
                  address, and password.
                </li>
                <li>
                  <strong>Child profile data.</strong> Parents may add child
                  profiles with a first name, age or grade, and an avatar. We
                  do not require a child&rsquo;s last name, address, or phone
                  number.
                </li>
                <li>
                  <strong>Activity data.</strong> We record progress through
                  games, lessons, and savings activities so we can show
                  results, awards, and recommendations.
                </li>
                <li>
                  <strong>Device & usage data.</strong> Standard log data such
                  as browser type, device type, and pages visited.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                How We Use Information
              </h2>
              <p className="text-muted-foreground">
                We use the information we collect to operate the service,
                personalize learning content, save progress across sessions,
                respond to support requests, and improve Cash Critters. We do
                not use children&rsquo;s information for behavioral
                advertising.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                Children&rsquo;s Privacy
              </h2>
              <p className="text-muted-foreground">
                Cash Critters is designed for children with the involvement of
                a parent or guardian. Consistent with the U.S.
                Children&rsquo;s Online Privacy Protection Act (COPPA) and
                similar laws, we collect information about children only
                through an account created and managed by a parent or
                guardian. We do not knowingly collect more personal
                information from a child than is reasonably necessary to
                participate in the activity, and we never condition a
                child&rsquo;s participation on disclosing more information
                than needed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                How We Share Information
              </h2>
              <p className="text-muted-foreground">
                We do not sell personal information. We share information only
                with service providers that help us operate Cash Critters
                (such as hosting and authentication providers), when required
                by law, or to protect the rights and safety of our users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We use industry-standard safeguards including encrypted
                connections and hashed passwords. No system is perfectly
                secure, but we work to protect family information from
                unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Parental Rights</h2>
              <p className="text-muted-foreground">
                Parents and guardians may review the personal information we
                have collected from their child, request that we correct or
                delete it, and refuse to permit further collection. To
                exercise these rights, contact us at the address below. We
                will verify the request before acting on it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                Cookies & Analytics
              </h2>
              <p className="text-muted-foreground">
                We use a small number of cookies to keep users signed in and
                remember preferences. We may use privacy-respecting analytics
                to understand which features are working, but we do not use
                third-party advertising trackers in areas of the site
                directed to children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. When we
                do, we will revise the &ldquo;Last updated&rdquo; date above.
                Material changes will be communicated to account holders by
                email or in-app notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                Questions about this Privacy Policy or your family&rsquo;s
                information? Email us at{" "}
                <a
                  href="mailto:privacy@cashcritters.example"
                  className="text-primary underline"
                >
                  privacy@cashcritters.example
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t">
            <Link
              href="/"
              className="text-primary hover:underline"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-12 bg-muted/40">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-primary">Cash Critters</h2>
              <p className="text-muted-foreground">
                Financial education made fun for kids
              </p>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Cash Critters. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
