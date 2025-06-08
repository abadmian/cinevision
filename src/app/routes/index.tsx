import { AIRecommendations } from "@/components/AIRecommendations"
import { FavoritesTable } from "@/components/FavoritesTable"
import { MovieDetailsModal } from "@/components/MovieDetailsModal"
import { Recommendations } from "@/components/Recommendations"
import { Search } from "@/components/Search"
import { SearchResultsModal } from "@/components/SearchResultsModal"
import type { Movie } from "@/services/tmdb"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/")({
    component: Home
})

function Home() {
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleSelectMovie = (movie: Movie) => {
        setSelectedMovieId(movie.id)
    }

    const handleMovieClick = (movieId: number) => {
        setSelectedMovieId(movieId)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setShowSearchResults(true)
    }

    const handleRatingChange = () => {
        // Trigger refresh of components that depend on ratings
        setRefreshTrigger((prev) => prev + 1)
    }

    return (
        <div className="container mx-auto space-y-12 px-4 py-6">
            {/* Search Bar */}
            <div className="mt-8">
                <Search onSelectMovie={handleSelectMovie} onSearch={handleSearch} />
            </div>

            {/* Recommendations */}
            <Recommendations
                onMovieClick={handleMovieClick}
                onRatingChange={handleRatingChange}
                refreshTrigger={refreshTrigger}
            />

            {/* AI Recommendations */}
            <AIRecommendations
                onMovieClick={handleMovieClick}
                onRatingChange={handleRatingChange}
            />

            {/* Favorites Table */}
            <FavoritesTable onMovieClick={handleMovieClick} refreshTrigger={refreshTrigger} />

            {/* Movie Details Modal */}
            <MovieDetailsModal
                movieId={selectedMovieId}
                open={!!selectedMovieId}
                onOpenChange={(open) => !open && setSelectedMovieId(null)}
                onRatingChange={handleRatingChange}
            />

            {/* Search Results Modal */}
            <SearchResultsModal
                query={searchQuery}
                open={showSearchResults}
                onOpenChange={setShowSearchResults}
                onSelectMovie={handleMovieClick}
            />
        </div>
    )
}
