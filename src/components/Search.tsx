import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"
import { type Movie, tmdb } from "@/services/tmdb"
import { Search as SearchIcon, X } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"

interface SearchProps {
    onSelectMovie?: (movie: Movie) => void
    onSearch?: (query: string) => void
}

export function Search({ onSelectMovie, onSearch }: SearchProps) {
    const [query, setQuery] = useState("")
    const [suggestions, setSuggestions] = useState<Movie[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const debouncedQuery = useDebounce(query, 300)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 3) {
                setSuggestions([])
                return
            }

            setIsLoading(true)
            try {
                const response = await tmdb.searchMovies(debouncedQuery)
                setSuggestions(response.results.slice(0, 8))
                setShowSuggestions(true)
            } catch (error) {
                console.error("Failed to fetch suggestions:", error)
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchSuggestions()
    }, [debouncedQuery])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
        setSelectedIndex(-1)
    }

    const handleSelectMovie = (movie: Movie) => {
        setQuery("")
        setShowSuggestions(false)
        onSelectMovie?.(movie)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setShowSuggestions(false)
            onSearch?.(query)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
                break
            case "ArrowUp":
                e.preventDefault()
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
                break
            case "Enter":
                e.preventDefault()
                if (selectedIndex >= 0) {
                    handleSelectMovie(suggestions[selectedIndex])
                } else {
                    handleSearch(e)
                }
                break
            case "Escape":
                setShowSuggestions(false)
                break
        }
    }

    const formatTitle = (movie: Movie) => {
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : ""
        return year ? `${movie.title} (${year})` : movie.title
    }

    return (
        <div className="relative mx-auto w-full max-w-3xl">
            <form onSubmit={handleSearch} className="relative">
                <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                    className="h-12 pr-10 pl-10 text-base"
                />
                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setQuery("")
                            setSuggestions([])
                            setShowSuggestions(false)
                        }}
                        className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </form>

            {showSuggestions && (suggestions.length > 0 || isLoading) && (
                <div
                    ref={suggestionsRef}
                    className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
                >
                    {isLoading ? (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                            Searching...
                        </div>
                    ) : (
                        <ul className="max-h-[400px] overflow-y-auto">
                            {suggestions.map((movie, index) => (
                                <li key={movie.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectMovie(movie)}
                                        className={cn(
                                            "flex w-full items-center gap-3 p-3 text-left hover:bg-accent focus:bg-accent focus:outline-none",
                                            selectedIndex === index && "bg-accent"
                                        )}
                                    >
                                        {movie.poster_path ? (
                                            <img
                                                src={tmdb.getImageUrl(movie.poster_path, "small")}
                                                alt={movie.title}
                                                className="h-12 w-8 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-8 items-center justify-center rounded bg-muted">
                                                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-sm">
                                                {formatTitle(movie)}
                                            </p>
                                            {movie.overview && (
                                                <p className="line-clamp-1 text-muted-foreground text-xs">
                                                    {movie.overview}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
