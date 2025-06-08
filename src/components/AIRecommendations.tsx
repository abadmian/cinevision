import { MovieCard } from "@/components/MovieCard"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ai } from "@/services/ai"
import { type Credits, type Movie, type MovieDetails, tmdb } from "@/services/tmdb"
import { Loader2, Sparkles } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { toast } from "sonner"

interface MovieWithDetails extends Movie {
    details?: MovieDetails
    credits?: Credits
}

interface AIRecommendationsProps {
    onMovieClick?: (movieId: number) => void
    onRatingChange?: () => void
}

export function AIRecommendations({ onMovieClick, onRatingChange }: AIRecommendationsProps) {
    const [input, setInput] = useState("")
    const [recommendations, setRecommendations] = useState<MovieWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleGenerate = async () => {
        if (!input.trim()) {
            toast.error("Please describe what you're in the mood to watch")
            return
        }

        setIsLoading(true)
        setRecommendations([])

        try {
            // Get AI recommendations
            const aiRecommendations = await ai.getRecommendations(input)

            if (aiRecommendations.length === 0) {
                toast.error("Failed to generate recommendations. Please try again.")
                setIsLoading(false)
                return
            }

            // Search for each recommended movie
            const moviePromises = aiRecommendations.map(async (rec) => {
                try {
                    const searchQuery = rec.year ? `${rec.title} ${rec.year}` : rec.title

                    const searchResults = await tmdb.searchMovies(searchQuery)

                    // Try to find exact match or best match
                    let movie = searchResults.results.find((m: Movie) => {
                        const titleMatch = m.title.toLowerCase() === rec.title.toLowerCase()
                        if (rec.year && m.release_date) {
                            const movieYear = new Date(m.release_date).getFullYear()
                            return titleMatch && movieYear === rec.year
                        }
                        return titleMatch
                    })

                    // If no exact match, take the first result
                    if (!movie && searchResults.results.length > 0) {
                        movie = searchResults.results[0]
                    }

                    if (movie) {
                        // Load additional details
                        const [details, credits] = await Promise.all([
                            tmdb.getMovieDetails(movie.id),
                            tmdb.getMovieCredits(movie.id)
                        ])

                        return { ...movie, details, credits }
                    }

                    return null
                } catch (error) {
                    console.error(`Failed to find movie: ${rec.title}`, error)
                    return null
                }
            })

            const movies = (await Promise.all(moviePromises)).filter(
                (movie): movie is MovieWithDetails => movie !== null
            )

            if (movies.length === 0) {
                toast.error("Could not find any of the recommended movies")
            } else if (movies.length < aiRecommendations.length) {
                toast.warning(
                    `Found ${movies.length} out of ${aiRecommendations.length} recommendations`
                )
            }

            setRecommendations(movies)
        } catch (error) {
            console.error("Failed to generate recommendations:", error)
            toast.error("Failed to generate recommendations. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            handleGenerate()
        }
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2 className="font-bold text-2xl">AI Recommendations</h2>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tell me what you're in the mood to watch tonight..."
                        className="min-h-[100px] resize-none pr-4"
                        maxLength={500}
                    />
                    <div className="absolute right-2 bottom-2 text-muted-foreground text-xs">
                        {input.length}/500
                    </div>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="w-full sm:w-auto"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Recommendations
                        </>
                    )}
                </Button>

                {recommendations.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recommendations.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                details={movie.details}
                                credits={movie.credits}
                                onClick={onMovieClick}
                                onRatingChange={onRatingChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
