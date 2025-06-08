import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"

interface HeaderProps {
    user?: {
        name?: string
        email?: string
        picture?: string
    }
    onLogin?: () => void
    onLogout?: () => void
}

export function Header({ user, onLogin, onLogout }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex-1" />

                <h1 className="font-bold text-2xl tracking-tight">CineVision</h1>

                <div className="flex flex-1 items-center justify-end">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.picture} alt={user.name} />
                                        <AvatarFallback>
                                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5">
                                    <p className="font-medium text-sm">{user.name || "User"}</p>
                                    <p className="text-muted-foreground text-xs">{user.email}</p>
                                </div>
                                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onLogin}
                            className="rounded-full"
                        >
                            <User className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
