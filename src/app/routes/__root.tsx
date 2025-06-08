import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary"
import { Header } from "@/components/Header"
import { NotFound } from "@/components/NotFound"
import { seo } from "@/utils/seo"
import type { QueryClient } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import type * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Providers } from "../providers"
import customCss from "../styles/custom.css?url"
import appCss from "../styles/index.css?url"

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient
}>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8"
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1"
            },
            ...seo({
                title: "CineVision - Movie Ranking & Recommendations",
                description:
                    "Rank your favorite movies and get personalized recommendations powered by AI"
            })
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss
            },
            {
                rel: "stylesheet",
                href: customCss
            },
            {
                rel: "apple-touch-icon",
                sizes: "180x180",
                href: "/apple-touch-icon.png"
            },
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                href: "/favicon-32x32.png"
            },
            {
                rel: "icon",
                type: "image/png",
                sizes: "16x16",
                href: "/favicon-16x16.png"
            },
            { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
            { rel: "icon", href: "/favicon.ico" }
        ]
    }),
    errorComponent: (props) => {
        return (
            <RootDocument>
                <DefaultCatchBoundary {...props} />
            </RootDocument>
        )
    },
    notFoundComponent: () => <NotFound />,
    component: RootComponent
})

function RootComponent() {
    const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(
        null
    )

    const handleLogin = () => {
        // Placeholder for Google OAuth login
        toast.info("Google login integration coming soon!")
        // For demo purposes, set a mock user
        setUser({
            name: "Demo User",
            email: "demo@example.com",
            picture: undefined
        })
    }

    const handleLogout = () => {
        setUser(null)
        toast.success("Logged out successfully")
    }

    return (
        <RootDocument>
            <Header user={user || undefined} onLogin={handleLogin} onLogout={handleLogout} />
            <Outlet />
        </RootDocument>
    )
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="">
                <Providers>
                    <div className="flex min-h-svh flex-col">{children}</div>
                </Providers>
                <Scripts />
            </body>
        </html>
    )
}
