import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { cn } from "@/lib/utils"
import { storage } from "@/services/storage"
import { type Credits, type Movie, type MovieDetails, tmdb } from "@/services/tmdb"
import { Calendar, User } from "lucide-react"
import React from "react"

interface MovieCardProps {
    movie: Movie
    details?: MovieDetails
    credits?: Credits
    showRating?: boolean
    onRatingChange?: (movieId: number, rating: number) => void
    onClick?: (movieId: number) => void
    className?: string
}

export function MovieCard({
    movie,
    details,
    credits,
    showRating = true,
    onRatingChange,
    onClick,
    className
}: MovieCardProps) {
    const [rating, setRating] = React.useState(() => storage.getRating(movie.id) || 0)

    const handleRatingChange = (newRating: number) => {
        setRating(newRating)
        if (newRating > 0) {
            storage.setRating(movie.id, newRating)
        } else {
            storage.removeRating(movie.id)
        }
        onRatingChange?.(movie.id, newRating)
    }

    const director = credits?.crew.find((person) => person.job === "Director")
    const topActors = credits?.cast.slice(0, 2)
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : ""
    const genres = details?.genres || []

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all hover:shadow-lg",
                onClick && "cursor-pointer hover:scale-[1.02]",
                className
            )}
            onClick={() => onClick?.(movie.id)}
        >
            <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                {movie.poster_path ? (
                    <img
                        src={tmdb.getImageUrl(movie.poster_path, "medium")}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <span className="text-muted-foreground">No poster</span>
                    </div>
                )}
            </div>

            <CardContent className="space-y-2 p-4">
                <h3 className="line-clamp-1 font-semibold" title={movie.title}>
                    {movie.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    {releaseYear && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{releaseYear}</span>
                        </div>
                    )}

                    {director && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="line-clamp-1">{director.name}</span>
                        </div>
                    )}
                </div>

                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {genres.slice(0, 3).map((genre) => (
                            <Badge key={genre.id} variant="secondary" className="text-xs">
                                {genre.name}
                            </Badge>
                        ))}
                    </div>
                )}

                {topActors && topActors.length > 0 && (
                    <p className="line-clamp-1 text-muted-foreground text-sm">
                        {topActors.map((actor) => actor.name).join(", ")}
                    </p>
                )}
            </CardContent>

            {showRating && (
                <CardFooter className="p-4 pt-0">
                    <StarRating
                        value={rating}
                        onChange={handleRatingChange}
                        size="sm"
                        className="w-full justify-center"
                    />
                </CardFooter>
            )}
        </Card>
    )
}
