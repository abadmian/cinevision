import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/ui/star-rating"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { type Rating, storage } from "@/services/storage"
import { type Credits, type MovieDetails, tmdb } from "@/services/tmdb"
import { ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react"
import { useEffect, useState } from "react"

interface FavoriteMovie extends Rating {
    details?: MovieDetails
    credits?: Credits
}

interface FavoritesTableProps {
    onMovieClick?: (movieId: number) => void
    refreshTrigger?: number
}

type SortField = "title" | "director" | "year" | "rating"
type SortDirection = "asc" | "desc"

export function FavoritesTable({ onMovieClick, refreshTrigger = 0 }: FavoritesTableProps) {
    const [favorites, setFavorites] = useState<FavoriteMovie[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [sortField, setSortField] = useState<SortField>("rating")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        const loadFavorites = async () => {
            setIsLoading(true)
            try {
                const favoriteRatings = storage.getFavoriteMovies()

                const favoritesWithDetails = await Promise.all(
                    favoriteRatings.map(async (rating) => {
                        try {
                            const [details, credits] = await Promise.all([
                                tmdb.getMovieDetails(rating.movieId),
                                tmdb.getMovieCredits(rating.movieId)
                            ])
                            return { ...rating, details, credits }
                        } catch (error) {
                            console.error(
                                `Failed to load details for movie ${rating.movieId}:`,
                                error
                            )
                            return rating
                        }
                    })
                )

                setFavorites(favoritesWithDetails)
            } catch (error) {
                console.error("Failed to load favorites:", error)
                setFavorites([])
            } finally {
                setIsLoading(false)
            }
        }

        loadFavorites()
    }, [refreshTrigger])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
        setCurrentPage(1)
    }

    const sortedFavorites = [...favorites].sort((a, b) => {
        const aDetails = a.details
        const bDetails = b.details
        const aDirector = a.credits?.crew.find((p) => p.job === "Director")?.name || ""
        const bDirector = b.credits?.crew.find((p) => p.job === "Director")?.name || ""

        let compareValue = 0

        switch (sortField) {
            case "title":
                compareValue = (aDetails?.title || "").localeCompare(bDetails?.title || "")
                break
            case "director":
                compareValue = aDirector.localeCompare(bDirector)
                break
            case "year": {
                const aYear = aDetails?.release_date
                    ? new Date(aDetails.release_date).getFullYear()
                    : 0
                const bYear = bDetails?.release_date
                    ? new Date(bDetails.release_date).getFullYear()
                    : 0
                compareValue = aYear - bYear
                break
            }
            case "rating":
                compareValue = a.rating - b.rating
                break
        }

        return sortDirection === "asc" ? compareValue : -compareValue
    })

    const paginatedFavorites = sortedFavorites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(sortedFavorites.length / itemsPerPage)

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        )
    }

    if (isLoading) {
        return <FavoritesTableSkeleton />
    }

    if (favorites.length === 0) {
        return (
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <h2 className="font-bold text-2xl">My Favorite Movies</h2>
                </div>
                <div className="py-12 text-center text-muted-foreground">
                    <p>No favorite movies yet. Rate movies 4 stars or higher to see them here!</p>
                </div>
            </section>
        )
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <h2 className="font-bold text-2xl">My Favorite Movies</h2>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Poster</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("title")}
                                    className="h-auto p-0 font-medium hover:bg-transparent"
                                >
                                    Title
                                    <SortIcon field="title" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("director")}
                                    className="h-auto p-0 font-medium hover:bg-transparent"
                                >
                                    Director
                                    <SortIcon field="director" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("year")}
                                    className="h-auto p-0 font-medium hover:bg-transparent"
                                >
                                    Year
                                    <SortIcon field="year" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("rating")}
                                    className="h-auto p-0 font-medium hover:bg-transparent"
                                >
                                    My Rating
                                    <SortIcon field="rating" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedFavorites.map((favorite) => {
                            const director = favorite.credits?.crew.find(
                                (p) => p.job === "Director"
                            )
                            const releaseYear = favorite.details?.release_date
                                ? new Date(favorite.details.release_date).getFullYear()
                                : ""

                            return (
                                <TableRow
                                    key={favorite.movieId}
                                    className="cursor-pointer"
                                    onClick={() => onMovieClick?.(favorite.movieId)}
                                >
                                    <TableCell>
                                        {favorite.details?.poster_path ? (
                                            <img
                                                src={tmdb.getImageUrl(
                                                    favorite.details.poster_path,
                                                    "small"
                                                )}
                                                alt={favorite.details.title}
                                                className="h-24 w-16 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-24 w-16 items-center justify-center rounded bg-muted">
                                                <span className="text-muted-foreground text-xs">
                                                    No image
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {favorite.details?.title || "Unknown"}
                                    </TableCell>
                                    <TableCell>{director?.name || "Unknown"}</TableCell>
                                    <TableCell>{releaseYear || "Unknown"}</TableCell>
                                    <TableCell>
                                        <StarRating value={favorite.rating} readonly size="sm" />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        Last
                    </Button>
                </div>
            )}
        </section>
    )
}

function FavoritesTableSkeleton() {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <h2 className="font-bold text-2xl">My Favorite Movies</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Poster</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Director</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>My Rating</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-24 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-48" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-24" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    )
}
