import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { type Credits, type Movie, type MovieDetails, tmdb } from "@/services/tmdb"
import { Calendar, ChevronLeft, ChevronRight, User } from "lucide-react"
import { useEffect, useState } from "react"

interface SearchResultsModalProps {
    query: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectMovie?: (movieId: number) => void
}

interface MovieWithDetails extends Movie {
    details?: MovieDetails
    credits?: Credits
}

export function SearchResultsModal({
    query,
    open,
    onOpenChange,
    onSelectMovie
}: SearchResultsModalProps) {
    const [results, setResults] = useState<MovieWithDetails[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalResults, setTotalResults] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState<Set<number>>(new Set())

    useEffect(() => {
        if (!open || !query) return

        const searchMovies = async () => {
            setIsLoading(true)
            try {
                const response = await tmdb.searchMovies(query, currentPage)
                setResults(response.results)
                setTotalPages(Math.min(response.total_pages, 10)) // Limit to 10 pages
                setTotalResults(response.total_results)

                // Load details for the first 5 movies
                loadMovieDetails(response.results.slice(0, 5))
            } catch (error) {
                console.error("Failed to search movies:", error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }

        searchMovies()
    }, [query, currentPage, open])

    const loadMovieDetails = async (movies: Movie[]) => {
        const loadingIds = new Set<number>()
        movies.forEach((movie) => loadingIds.add(movie.id))
        setDetailsLoading((prev) => new Set([...prev, ...loadingIds]))

        const detailsPromises = movies.map(async (movie) => {
            try {
                const [details, credits] = await Promise.all([
                    tmdb.getMovieDetails(movie.id),
                    tmdb.getMovieCredits(movie.id)
                ])
                return { ...movie, details, credits }
            } catch (error) {
                console.error(`Failed to load details for ${movie.title}:`, error)
                return movie
            }
        })

        const moviesWithDetails = await Promise.all(detailsPromises)

        setResults((prev) => {
            const updatedResults = [...prev]
            moviesWithDetails.forEach((movieWithDetails) => {
                const index = updatedResults.findIndex((m) => m.id === movieWithDetails.id)
                if (index !== -1) {
                    updatedResults[index] = movieWithDetails
                }
            })
            return updatedResults
        })

        setDetailsLoading((prev) => {
            const newSet = new Set(prev)
            loadingIds.forEach((id) => newSet.delete(id))
            return newSet
        })
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleMovieClick = (movieId: number) => {
        onSelectMovie?.(movieId)
        onOpenChange(false)
    }

    const renderPagination = () => {
        const pages = []
        const showEllipsis = totalPages > 7

        if (!showEllipsis) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i)
                pages.push(-1) // Ellipsis
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 3) {
                pages.push(1)
                pages.push(-1) // Ellipsis
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
            } else {
                pages.push(1)
                pages.push(-1) // Ellipsis
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                pages.push(-1) // Ellipsis
                pages.push(totalPages)
            }
        }

        return (
            <div className="flex items-center justify-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                >
                    First
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pages.map((page, index) =>
                    page === -1 ? (
                        <span key={`ellipsis-${index}`} className="px-2">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[40px]"
                        >
                            {page}
                        </Button>
                    )
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    Last
                </Button>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Search Results for "{query}"
                        {totalResults > 0 && (
                            <span className="ml-2 font-normal text-muted-foreground text-sm">
                                ({totalResults} results)
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <MovieResultSkeleton key={i} />
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((movie) => (
                                <Card
                                    key={movie.id}
                                    className="cursor-pointer transition-colors hover:bg-accent"
                                    onClick={() => handleMovieClick(movie.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {movie.poster_path ? (
                                                <img
                                                    src={tmdb.getImageUrl(
                                                        movie.poster_path,
                                                        "small"
                                                    )}
                                                    alt={movie.title}
                                                    className="h-30 w-20 flex-shrink-0 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-30 w-20 flex-shrink-0 items-center justify-center rounded bg-muted">
                                                    <span className="text-muted-foreground text-xs">
                                                        No image
                                                    </span>
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <h3 className="mb-1 font-semibold text-lg">
                                                    {movie.title}
                                                </h3>

                                                <div className="mb-2 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                                                    {movie.release_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                {new Date(
                                                                    movie.release_date
                                                                ).getFullYear()}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {detailsLoading.has(movie.id) ? (
                                                        <Skeleton className="h-4 w-24" />
                                                    ) : (
                                                        movie.credits?.crew.find(
                                                            (p) => p.job === "Director"
                                                        ) && (
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                <span>
                                                                    {
                                                                        movie.credits.crew.find(
                                                                            (p) =>
                                                                                p.job === "Director"
                                                                        )?.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <div className="mb-2 flex flex-wrap gap-1">
                                                    {detailsLoading.has(movie.id) ? (
                                                        <>
                                                            <Skeleton className="h-5 w-16" />
                                                            <Skeleton className="h-5 w-16" />
                                                        </>
                                                    ) : (
                                                        movie.details?.genres.map((genre) => (
                                                            <Badge
                                                                key={genre.id}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {genre.name}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>

                                                {detailsLoading.has(movie.id) ? (
                                                    <Skeleton className="h-4 w-32" />
                                                ) : movie.credits?.cast.slice(0, 2).length ? (
                                                    <p className="text-muted-foreground text-sm">
                                                        Starring:{" "}
                                                        {movie.credits.cast
                                                            .slice(0, 2)
                                                            .map((actor) => actor.name)
                                                            .join(", ")}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground">No results found</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && <div className="border-t pt-4">{renderPagination()}</div>}
            </DialogContent>
        </Dialog>
    )
}

function MovieResultSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-30 w-20 flex-shrink-0 rounded" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-1">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
