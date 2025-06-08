import { MovieCard } from "@/components/MovieCard"
import { Skeleton } from "@/components/ui/skeleton"
import { storage } from "@/services/storage"
import { type Credits, type Movie, type MovieDetails, tmdb } from "@/services/tmdb"
import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface MovieWithDetails extends Movie {
    details?: MovieDetails
    credits?: Credits
}

interface RecommendationsProps {
    onMovieClick?: (movieId: number) => void
    onRatingChange?: () => void
    refreshTrigger?: number
}

export function Recommendations({
    onMovieClick,
    onRatingChange,
    refreshTrigger = 0
}: RecommendationsProps) {
    const [recommendations, setRecommendations] = useState<MovieWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true)
            try {
                const favoriteMovies = storage.getFavoriteMovies()
                const recommendedMovieIds = new Set<number>()
                const movieRecommendations: Movie[] = []

                // Get recommendations based on favorite movies (60% weight)
                if (favoriteMovies.length > 0) {
                    // Sort by rating and recency, take top 3
                    const topFavorites = favoriteMovies
                        .sort((a, b) => {
                            if (b.rating === a.rating) {
                                return b.timestamp - a.timestamp
                            }
                            return b.rating - a.rating
                        })
                        .slice(0, 3)

                    for (const favorite of topFavorites) {
                        try {
                            const similar = await tmdb.getSimilarMovies(favorite.movieId)
                            const recommendations = await tmdb.getMovieRecommendations(
                                favorite.movieId
                            )

                            // Add similar and recommended movies
                            ;[...similar.results, ...recommendations.results].forEach((movie) => {
                                if (
                                    !recommendedMovieIds.has(movie.id) &&
                                    movie.id !== favorite.movieId
                                ) {
                                    recommendedMovieIds.add(movie.id)
                                    movieRecommendations.push(movie)
                                }
                            })
                        } catch (error) {
                            console.error(
                                `Failed to get recommendations for movie ${favorite.movieId}:`,
                                error
                            )
                        }
                    }
                }

                // Get trending movies (40% weight or 100% if no favorites)
                const trending = await tmdb.getTrendingMovies("week")
                const trendingMovies = trending.results.filter(
                    (movie) => !recommendedMovieIds.has(movie.id)
                )

                // Combine recommendations
                let finalRecommendations: Movie[] = []

                if (favoriteMovies.length > 0) {
                    // Take 2 from personalized recommendations, 1 from trending
                    finalRecommendations = [
                        ...movieRecommendations.slice(0, 2),
                        ...trendingMovies.slice(0, 1)
                    ]
                } else {
                    // Only trending movies if no favorites
                    finalRecommendations = trendingMovies.slice(0, 3)
                }

                // Ensure we have 3 recommendations
                if (finalRecommendations.length < 3) {
                    const additionalNeeded = 3 - finalRecommendations.length
                    const additionalMovies = [...movieRecommendations, ...trendingMovies]
                        .filter((movie) => !finalRecommendations.some((r) => r.id === movie.id))
                        .slice(0, additionalNeeded)
                    finalRecommendations = [...finalRecommendations, ...additionalMovies]
                }

                // Load details for all recommendations
                const moviesWithDetails = await Promise.all(
                    finalRecommendations.map(async (movie) => {
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
                )

                setRecommendations(moviesWithDetails)
            } catch (error) {
                console.error("Failed to fetch recommendations:", error)
                setRecommendations([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecommendations()
    }, [refreshTrigger])

    const handleRatingChange = () => {
        onRatingChange?.()
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <h2 className="font-bold text-2xl">Recommended for You</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <RecommendationSkeleton />
                        <RecommendationSkeleton />
                        <RecommendationSkeleton />
                    </>
                ) : recommendations.length > 0 ? (
                    recommendations.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            details={movie.details}
                            credits={movie.credits}
                            onClick={onMovieClick}
                            onRatingChange={handleRatingChange}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center">
                        <p className="text-muted-foreground">
                            No recommendations available. Rate some movies to get personalized
                            suggestions!
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}

function RecommendationSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="mx-auto h-8 w-32" />
            </div>
        </div>
    )
}
