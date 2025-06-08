import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/ui/star-rating"
import { storage } from "@/services/storage"
import { type Credits, type MovieDetails, tmdb } from "@/services/tmdb"
import { Calendar, Check, Clock, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface MovieDetailsModalProps {
    movieId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRatingChange?: () => void
}

export function MovieDetailsModal({
    movieId,
    open,
    onOpenChange,
    onRatingChange
}: MovieDetailsModalProps) {
    const [movie, setMovie] = useState<MovieDetails | null>(null)
    const [credits, setCredits] = useState<Credits | null>(null)
    const [rating, setRating] = useState(0)
    const [isInWatchlist, setIsInWatchlist] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!movieId || !open) return

        const fetchMovieData = async () => {
            setIsLoading(true)
            try {
                const [movieData, creditsData] = await Promise.all([
                    tmdb.getMovieDetails(movieId),
                    tmdb.getMovieCredits(movieId)
                ])

                setMovie(movieData)
                setCredits(creditsData)

                const savedRating = storage.getRating(movieId)
                setRating(savedRating || 0)

                setIsInWatchlist(storage.isInWatchlist(movieId))
            } catch (error) {
                console.error("Failed to fetch movie details:", error)
                toast.error("Failed to load movie details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchMovieData()
    }, [movieId, open])

    const handleRatingChange = (newRating: number) => {
        if (!movieId) return

        setRating(newRating)
        if (newRating > 0) {
            storage.setRating(movieId, newRating)
            toast.success(`Rated ${movie?.title} ${newRating} stars`)
        } else {
            storage.removeRating(movieId)
            toast.success(`Removed rating for ${movie?.title}`)
        }
        onRatingChange?.()
    }

    const handleWatchlistToggle = () => {
        if (!movieId) return

        if (isInWatchlist) {
            storage.removeFromWatchlist(movieId)
            setIsInWatchlist(false)
            toast.success(`Removed ${movie?.title} from watchlist`)
        } else {
            storage.addToWatchlist(movieId)
            setIsInWatchlist(true)
            toast.success(`Added ${movie?.title} to watchlist`)
        }
    }

    const director = credits?.crew.find((person) => person.job === "Director")
    const topActors = credits?.cast.slice(0, 5)
    const releaseYear = movie?.release_date ? new Date(movie.release_date).getFullYear() : ""

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                {isLoading ? (
                    <MovieDetailsSkeleton />
                ) : movie ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="pr-8 font-bold text-2xl">
                                {movie.title}
                                {releaseYear && (
                                    <span className="ml-2 text-muted-foreground">
                                        ({releaseYear})
                                    </span>
                                )}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                            <div className="space-y-4">
                                {movie.poster_path ? (
                                    <img
                                        src={tmdb.getImageUrl(movie.poster_path, "medium")}
                                        alt={movie.title}
                                        className="w-full rounded-lg shadow-lg"
                                    />
                                ) : (
                                    <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-muted">
                                        <span className="text-muted-foreground">No poster</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleWatchlistToggle}
                                    variant={isInWatchlist ? "secondary" : "default"}
                                    className="w-full"
                                >
                                    {isInWatchlist ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            In Watchlist
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add to Watchlist
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <StarRating
                                        value={rating}
                                        onChange={handleRatingChange}
                                        size="lg"
                                    />
                                    {rating > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRatingChange(0)}
                                        >
                                            Clear rating
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {movie.genres.map((genre) => (
                                        <Badge key={genre.id} variant="secondary">
                                            {genre.name}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="space-y-2 text-sm">
                                    {director && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Director:</span>
                                            <span>{director.name}</span>
                                        </div>
                                    )}

                                    {movie.runtime && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{movie.runtime} minutes</span>
                                        </div>
                                    )}

                                    {movie.release_date && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {new Date(movie.release_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {topActors && topActors.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 font-semibold">Cast</h3>
                                        <div className="space-y-1">
                                            {topActors.map((actor) => (
                                                <div key={actor.id} className="text-sm">
                                                    <span className="font-medium">
                                                        {actor.name}
                                                    </span>
                                                    {actor.character && (
                                                        <span className="text-muted-foreground">
                                                            {" "}
                                                            as {actor.character}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {movie.tagline && (
                                    <p className="text-muted-foreground italic">
                                        "{movie.tagline}"
                                    </p>
                                )}

                                {movie.overview && (
                                    <div>
                                        <h3 className="mb-2 font-semibold">Synopsis</h3>
                                        <p className="text-sm leading-relaxed">{movie.overview}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">Failed to load movie details</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function MovieDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-3/4" />
            </div>
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                <div className="space-y-4">
                    <Skeleton className="aspect-[2/3] w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </div>
        </div>
    )
}
